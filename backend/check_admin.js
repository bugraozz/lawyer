const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:1905@localhost:5432/avukat' });

pool.query("SELECT * FROM users WHERE email = 'admin@bureau.local'")
  .then(r => {
    console.log('Satır:', JSON.stringify(r.rows[0], null, 2));
    pool.end();
  })
  .catch(e => {
    console.log('Hata:', e.message);
    pool.end();
  });
