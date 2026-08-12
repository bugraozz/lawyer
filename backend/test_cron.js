const Database = require('better-sqlite3');
const db = new Database('lex_architect.db');

const today = new Date().toISOString().split('T')[0];
const incompleteTasks = db.prepare(`
  SELECT title, userId
  FROM tasks
  WHERE date <= ? AND completed = 0
`).all(today);

console.log('Incomplete tasks found:', incompleteTasks.length);
console.log(incompleteTasks);
