const Database = require('better-sqlite3');
const db = new Database('lex_architect.db');

const info = db.prepare('UPDATE cases SET clientId = NULL WHERE clientId IS NOT NULL AND clientId NOT IN (SELECT id FROM clients)').run();
console.log(`Cleaned up ${info.changes} orphaned clients in cases table.`);
