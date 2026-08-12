const axios = require('axios');

async function test() {
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@bureau.local',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('Login successful. Token:', token.substring(0, 20) + '...');

    // 2. Fetch dashboard
    console.log('Fetching dashboard...');
    const dashRes = await axios.get('http://localhost:3000/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Dashboard data:', JSON.stringify(dashRes.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

test();
