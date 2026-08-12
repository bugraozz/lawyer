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

async function main() {
  console.log('Sunucu bağlantısı test ediliyor...');
  try {
    const r = await apiCall('POST', '/auth/login', { email: 'admin@bureau.local', password: 'admin123' });
    console.log('HTTP Status:', r.status);
    console.log('Response:', JSON.stringify(r.data, null, 2));
  } catch(e) {
    console.log('BAĞLANTI HATASI:', e.message);
    console.log('→ Sunucu çalışıyor mu? npm run start komutunu çalıştırın.');
  }
}

main();
