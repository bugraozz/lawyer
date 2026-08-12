const { Client } = require('pg');

const passwords = ['postgres', 'root', '1234', '123456', 'admin', 'password', ''];

async function testPasswords() {
  console.log('Testing common PostgreSQL passwords...');
  for (const pwd of passwords) {
    const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres', // connect to default db
      password: pwd,
      port: 5432,
    });
    try {
      await client.connect();
      console.log(`\n✅ SUCCESS! The password is: "${pwd}"`);
      await client.end();
      return pwd;
    } catch (err) {
      process.stdout.write('.');
    }
  }
  console.log('\n❌ None of the common passwords worked.');
  return null;
}

testPasswords();
