const Database = require('better-sqlite3');
const db = new Database('lex_architect.db', { verbose: console.log });

try {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE companyId = 1').get().count;
  console.log('totalUsers', totalUsers);
  
  const pendingUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE status = ? AND companyId = 1').get('pending').count;
  console.log('pendingUsers', pendingUsers);
  
  const approvedUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE status = ? AND companyId = 1').get('approved').count;
  console.log('approvedUsers', approvedUsers);
  
  const totalCases = db.prepare('SELECT COUNT(*) as count FROM cases WHERE userId IN (SELECT id FROM users WHERE companyId = 1)').get().count;
  console.log('totalCases', totalCases);
  
  const recentActivity = db.prepare(`
    SELECT au.action, au.details, u.name, au.timestamp
    FROM auditLog au
    JOIN users u ON au.userId = u.id
    WHERE u.companyId = 1
    ORDER BY au.timestamp DESC
    LIMIT 10
  `).all();
  console.log('recentActivity', recentActivity.length);
  
  console.log('Dashboard queries succeeded!');
} catch (error) {
  console.error('Error:', error.message);
}
