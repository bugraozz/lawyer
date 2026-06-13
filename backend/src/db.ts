import Database from 'better-sqlite3';

const db = new Database('lex_architect.db', { verbose: console.log });

export const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      barNo TEXT,
      password TEXT NOT NULL,
      companyId INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      lastLogin TEXT,
      status TEXT DEFAULT 'active',
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      clientId INTEGER,
      caseNo TEXT NOT NULL,
      title TEXT NOT NULL,
      court TEXT,
      status TEXT DEFAULT 'active',
      type TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(clientId) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      title TEXT NOT NULL,
      type TEXT,
      date TEXT NOT NULL,
      time TEXT,
      location TEXT,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      caseId INTEGER,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT,
      status TEXT DEFAULT 'pending',
      isCompanyExpense INTEGER DEFAULT 0,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(caseId) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS hearings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      caseId INTEGER,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      location TEXT,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(caseId) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      caseId INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      date TEXT,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(caseId) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      caseId INTEGER,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      date TEXT,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(caseId) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      caseId INTEGER,
      title TEXT NOT NULL,
      size TEXT,
      type TEXT,
      date TEXT,
      uploaderName TEXT,
      filePath TEXT,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(caseId) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      caseId INTEGER,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      time TEXT,
      type TEXT DEFAULT 'user',
      isMe INTEGER DEFAULT 0,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(caseId) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      title TEXT NOT NULL,
      desc TEXT,
      time TEXT,
      type TEXT,
      unread INTEGER DEFAULT 1,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `);
  
  // Migrate existing databases if they don't have new columns
  try { db.exec("ALTER TABLE documents ADD COLUMN filePath TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN companyId INTEGER DEFAULT 1"); } catch (e) {}
  try { db.exec("ALTER TABLE expenses ADD COLUMN isCompanyExpense INTEGER DEFAULT 0"); } catch (e) {}
};

export default db;
