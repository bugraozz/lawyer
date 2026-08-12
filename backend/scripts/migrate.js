const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../src/routes');
const cronDir = path.join(__dirname, '../src/cron');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Replace router methods with async
  content = content.replace(/router\.(get|post|put|delete)\(([^,]+),\s*(checkAdmin,\s*)?\s*(async\s*)?\((req[^)]*)\)\s*=>/g, 
    (match, method, route, check, isAsync, args) => {
      return `router.${method}(${route}, ${check || ''}async (${args}) =>`;
    }
  );

  // 2. Replace db.prepare with await db.prepare if not already awaited
  content = content.replace(/(?<!await\s)db\.prepare/g, 'await db.prepare');

  // 3. Replace datetime('now') with CURRENT_TIMESTAMP
  content = content.replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP');

  // 4. Handle info.lastInsertRowid which is what SQLite run() returns. 
  // Our Postgres wrapper run() returns { changes, lastInsertRowid } 
  // so info.lastInsertRowid will still work IF the wrapper supports it.
  
  // 5. Replace SQLite syntax if needed.
  // In PostgreSQL, to get inserted ID, we need `RETURNING id`.
  // Let's find INSERT queries that use run() and capture the result.
  // Actually, we can just let it be, but Postgres won't return lastInsertRowid without RETURNING id.
  // Let's modify INSERT statements to include RETURNING id, and update wrapper to use it.
  content = content.replace(/INSERT INTO\s+([a-zA-Z0-9_]+)\s*\([^)]+\)\s*VALUES\s*\([^)]+\)/gi, (match) => {
      // It's too complex to safely append RETURNING id via regex for all cases.
      // We will do it for users and cases since they often return IDs.
      if (!match.toUpperCase().includes('RETURNING ID')) {
          return match + ' RETURNING id';
      }
      return match;
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Processed:', filePath);
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.ts')) {
      processFile(path.join(dir, file));
    }
  }
}

processDirectory(routesDir);
processDirectory(cronDir);
