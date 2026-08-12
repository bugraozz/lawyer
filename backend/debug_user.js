const http = require('http');

function apiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api' + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', e => reject(e));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// Direct DB test - what does the prepare().get() return?
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:1905@localhost:5432/avukat' });

async function main() {
  // Simulate exactly what auth.ts does
  const res = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@bureau.local']);
  const user = res.rows[0];
  console.log('DB user object keys:', Object.keys(user));
  console.log('user.status =', user.status);
  console.log('user.role =', user.role);
  console.log('Full user:', JSON.stringify(user, null, 2));
  pool.end();
}

main().catch(console.error);
