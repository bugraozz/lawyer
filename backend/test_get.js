const { pool } = require('./src/db');
const db = require('./src/db').default;

async function test() {
  const sqliteDb = require('./src/db');
  // Wait, db.ts exports initDb and pool.
}
test();
