const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf-8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filePath, content, 'utf-8');
}

// Fix db.ts
replaceInFile(path.join(__dirname, '../src/db.ts'), [
    ['changes: res.rowCount,', 'changes: res.rowCount || 0,']
]);

// Fix cases.ts
replaceInFile(path.join(__dirname, '../src/routes/cases.ts'), [
    [/(router\.(post|put)\([^,]+,\s*upload\.[a-z]+\([^)]+\),\s*)\(req/g, '$1async (req'],
    [/const\s+info\s*=\s*([a-zA-Z0-9_.]+)\.run\(/g, 'const info = await $1.run(']
]);

// Fix auth.ts
replaceInFile(path.join(__dirname, '../src/routes/auth.ts'), [
    [/const\s+info\s*=\s*stmt\.run/g, 'const info = await stmt.run']
]);

// Fix clients.ts
replaceInFile(path.join(__dirname, '../src/routes/clients.ts'), [
    [/const\s+info\s*=\s*stmt\.run/g, 'const info = await stmt.run']
]);

// Fix events.ts
replaceInFile(path.join(__dirname, '../src/routes/events.ts'), [
    [/const\s+info\s*=\s*stmt\.run/g, 'const info = await stmt.run']
]);

// Fix expenses.ts
replaceInFile(path.join(__dirname, '../src/routes/expenses.ts'), [
    [/const\s+info\s*=\s*stmt\.run/g, 'const info = await stmt.run']
]);

// Fix notifications.ts
replaceInFile(path.join(__dirname, '../src/routes/notifications.ts'), [
    [/const\s+info\s*=\s*stmt\.run/g, 'const info = await stmt.run']
]);

// Fix profile.ts
replaceInFile(path.join(__dirname, '../src/routes/profile.ts'), [
    [/const\s+info\s*=\s*stmt\.run/g, 'const info = await stmt.run']
]);

// Fix tasks.ts
replaceInFile(path.join(__dirname, '../src/routes/tasks.ts'), [
    [/const\s+info\s*=\s*stmt\.run/g, 'const info = await stmt.run']
]);

// Fix dashboard.ts (localISOTime possibly undefined)
replaceInFile(path.join(__dirname, '../src/routes/dashboard.ts'), [
    ['let localISOTime;', 'let localISOTime = "";']
]);

// Fix PushService.ts (Conversion of Promise<any[]> to any[])
replaceInFile(path.join(__dirname, '../src/services/PushService.ts'), [
    ['db.prepare(`', 'await db.prepare(`'],
    ['(db.prepare', '(await db.prepare']
]);

// Fix notificationCron.ts
replaceInFile(path.join(__dirname, '../src/cron/notificationCron.ts'), [
    ['const upcomingHearings = db.prepare', 'const upcomingHearings = await db.prepare'],
    ['const upcomingEvents = db.prepare', 'const upcomingEvents = await db.prepare'],
    ['const incompleteTasks = db.prepare', 'const incompleteTasks = await db.prepare'],
    ['const deletedInfo = db.prepare', 'const deletedInfo = await db.prepare'],
    ['const highPriorityTasks = db.prepare', 'const highPriorityTasks = await db.prepare'],
    ['stmt.run(', 'await stmt.run(']
]);

console.log("Fixes applied.");
