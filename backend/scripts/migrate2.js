const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, search, replace) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(search, replace);
  fs.writeFileSync(filePath, content, 'utf-8');
}

const casesFile = path.join(__dirname, '../src/routes/cases.ts');
const clientsFile = path.join(__dirname, '../src/routes/clients.ts');
const authFile = path.join(__dirname, '../src/routes/auth.ts');
const eventsFile = path.join(__dirname, '../src/routes/events.ts');
const expensesFile = path.join(__dirname, '../src/routes/expenses.ts');
const notificationsFile = path.join(__dirname, '../src/routes/notifications.ts');
const profileFile = path.join(__dirname, '../src/routes/profile.ts');
const tasksFile = path.join(__dirname, '../src/routes/tasks.ts');
const pushServiceFile = path.join(__dirname, '../src/services/PushService.ts');
const cronFile = path.join(__dirname, '../src/cron/notificationCron.ts');
const dashboardFile = path.join(__dirname, '../src/routes/dashboard.ts');

// Fix cases.ts async handlers
let casesContent = fs.readFileSync(casesFile, 'utf-8');
casesContent = casesContent.replace(/upload\.single\('file'\),\s*\((req,\s*res)\)\s*=>/g, "upload.single('file'), async ($1) =>");
casesContent = casesContent.replace(/upload\.array\('files'\),\s*\((req,\s*res)\)\s*=>/g, "upload.array('files'), async ($1) =>");
casesContent = casesContent.replace(/const info = stmt\.run/g, "const info = await stmt.run");
casesContent = casesContent.replace(/stmt\.run\(/g, "await stmt.run(");
fs.writeFileSync(casesFile, casesContent, 'utf-8');

// Fix clients.ts
replaceInFile(clientsFile, /const info = stmt\.run/g, "const info = await stmt.run");

// Fix auth.ts
replaceInFile(authFile, /const info = stmt\.run/g, "const info = await stmt.run");

// Fix events.ts
replaceInFile(eventsFile, /const info = stmt\.run/g, "const info = await stmt.run");

// Fix profile.ts
replaceInFile(profileFile, /const info = stmt\.run/g, "const info = await stmt.run");

// PushService
replaceInFile(pushServiceFile, /const tokens = db\.prepare/g, "const tokens = await db.prepare");
replaceInFile(pushServiceFile, /const tokens = \(db\.prepare/g, "const tokens = await (db.prepare");

// cron
replaceInFile(cronFile, /const (\w+) = db\.prepare/g, "const $1 = await db.prepare");
replaceInFile(cronFile, /stmt\.run/g, "await stmt.run");

// Add await to all `.run()` if they missed it because it was `const info = db.prepare(...).run`
function fixAwaits(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.replace(/const info = await db\.prepare\([^)]+\)\.run\([^)]*\);/g, (match) => {
        // It's already awaited!
        return match;
    });
    // Wait, the regex `/(?<!await\s)db\.prepare/g` in migrate.js already added `await db.prepare`.
    // So `const info = db.prepare(...).run()` became `const info = await db.prepare(...).run()`.
    // BUT TS compiler complained: Property 'lastInsertRowid' does not exist on type 'Promise<{ changes: number | null; lastInsertRowid: any; }>'.
    // That means `await db.prepare(...).run()` is a Promise!
    // Why? Because `db.prepare` is evaluated synchronously, returning the object.
    // The `await` is applied to `db.prepare(...).run()`, which should evaluate the Promise.
    // Wait, if `await` is applied to `.run()`, it returns the resolved object, which HAS `.lastInsertRowid`.
    // Why does TS say it's a Promise?
    // Let's check `backend/src/db.ts`:
    // prepare(sql: string) { return { run: async (...params) => this.run(sql, params) } }
    // So `db.prepare(...).run()` returns a Promise.
    // Therefore `await db.prepare(...).run()` should return the resolved object!
    // Wait, is it parsing as `(await db.prepare(...)).run()`?
    // YES! `await db.prepare(...)` parses as `(await db.prepare(...))`.
    // But `db.prepare` is NOT a promise. It returns the object synchronously.
    // BUT because TS sees `await` before a function call, it awaits the result of `db.prepare(...)`, which just returns the object `{run, get, all}`.
    // Then `.run()` is called on that object, which RETURNS A PROMISE!
    // So `const info = await db.prepare(...).run()` evaluates to a Promise!
    // We need `const info = await (db.prepare(...).run(...))` OR `const info = await db.execute(...)`.
    // Actually, `await db.prepare(...).run()` evaluates as `(await db.prepare(...)).run()`.
    fs.writeFileSync(filePath, content, 'utf-8');
}

// Let's fix this precedence issue in all files!
// `await db.prepare(...).run(...)` -> `await (db.prepare(...).run(...))` is hard.
// Actually, I can just change `await db.prepare` to `db.prepare` again, and then change `.run(` to `.run(` wait.
// Let's just change `await db.prepare(` to `db.prepare(` and then change `.run(` to `await .run(` No.
function fixPrecedence(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    // Remove the blindly added 'await db.prepare'
    content = content.replace(/await db\.prepare/g, 'db.prepare');
    
    // Now add await before the actual execution method: .run, .get, .all
    // e.g. db.prepare('...').run() -> await db.prepare('...').run()
    // Wait, if I do `await db.prepare('...').run()`, JS still parses it as `(await db.prepare('...')).run()`.
    // Wait, NO. `await a.b().c()` parses as `await (a.b().c())`.
    // Let's test this in Node.
    // Actually, `await a.b().c()` awaits the result of `c()`.
    // Why did TS complain?
    // Because `db.prepare` might have been typed incorrectly?
    // Let's check db.ts again.
    fs.writeFileSync(filePath, content, 'utf-8');
}

const dir = path.join(__dirname, '../src/routes');
fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.ts')) fixPrecedence(path.join(dir, file));
});
fixPrecedence(cronFile);
fixPrecedence(pushServiceFile);

// Let's just use `db.execute` and `db.query` instead of `db.prepare().run()`. It's so much easier and cleaner!
// `db.prepare(X).run(Y)` -> `await db.execute(X, Y)`
// `db.prepare(X).get(Y)` -> `await db.get(X, Y)`
// `db.prepare(X).all(Y)` -> `await db.all(X, Y)`
// Let's do this replacement instead! It's much safer!

function rewriteToDirectMethods(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace db.prepare(X).run(Y) -> await db.execute(X, [Y])
    // This is hard with regex because of nested parentheses in X and Y.
    fs.writeFileSync(filePath, content, 'utf-8');
}

// We will use typescript compiler API or just simple regex for most common cases.
// For now, let's just use `await db.prepare(sql).run()` but tell TS it's correct?
// Wait, if TS says `await db.prepare(sql).run()` returns a Promise, it means `await` didn't apply to `.run()`.
// Ah! `const info = db.prepare('...').run();` -> The previous script only replaced `db.prepare` with `await db.prepare` if it wasn't awaited.
// But if it was `const info = db.prepare('...'); info.run();`, then `info.run()` wasn't awaited!

// Let's just fix the files manually or with a smarter script.
