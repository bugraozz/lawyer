import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1905@localhost:5432/avukat',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// A wrapper to convert SQLite's ? placeholders to PostgreSQL's $1, $2, etc.
class DatabaseWrapper {
  private convertSql(sql: string) {
    let i = 1;
    return sql.replace(/\?/g, () => `$${i++}`);
  }

  async query(sql: string, params: any[] = []) {
    const pgSql = this.convertSql(sql);
    const res = await pool.query(pgSql, params);
    return res.rows;
  }

  async execute(sql: string, params: any[] = []) {
    const pgSql = this.convertSql(sql);
    const res = await pool.query(pgSql, params);
    return {
      changes: res.rowCount || 0,
      // Postgres RETURNING is needed for lastInsertRowid. 
      // If the query has RETURNING id, it will be in res.rows[0].id
      lastInsertRowid: res.rows.length > 0 ? res.rows[0].id : null
    };
  }

  async get(sql: string, params: any[] = []) {
    const pgSql = this.convertSql(sql);
    const res = await pool.query(pgSql, params);
    return res.rows[0];
  }

  async run(sql: string, params: any[] = []) {
    return this.execute(sql, params);
  }

  async all(sql: string, params: any[] = []) {
    return this.query(sql, params);
  }

  // To simulate db.prepare(sql).run(params) -> db.prepare(sql) returns an object with .run, .get, .all
  prepare(sql: string) {
    return {
      run: async (...params: any[]) => this.run(sql, params),
      get: async (...params: any[]) => this.get(sql, params),
      all: async (...params: any[]) => this.all(sql, params),
    };
  }

  async exec(sql: string) {
    return pool.query(sql);
  }
}

const db = new DatabaseWrapper();

export const initDb = async () => {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        barNo TEXT,
        password TEXT NOT NULL,
        companyId INTEGER DEFAULT 1,
        role TEXT DEFAULT 'lawyer',
        status TEXT DEFAULT 'pending',
        approvedBy INTEGER,
        createdAt TIMESTAMP,
        lastLogin TIMESTAMP,
        pushToken TEXT,
        FOREIGN KEY(approvedBy) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        userId INTEGER,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        lastLogin TEXT,
        status TEXT DEFAULT 'active',
        FOREIGN KEY(userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS cases (
        id SERIAL PRIMARY KEY,
        userId INTEGER,
        clientId INTEGER,
        caseNo TEXT NOT NULL,
        title TEXT NOT NULL,
        court TEXT,
        status TEXT DEFAULT 'active',
        type TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(clientId) REFERENCES clients(id)
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        userId INTEGER,
        title TEXT NOT NULL,
        type TEXT,
        date TEXT NOT NULL,
        time TEXT,
        location TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
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
        id SERIAL PRIMARY KEY,
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
        id SERIAL PRIMARY KEY,
        userId INTEGER,
        caseId INTEGER,
        title TEXT NOT NULL,
        content TEXT,
        date TEXT,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(caseId) REFERENCES cases(id)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        userId INTEGER,
        caseId INTEGER,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        completedAt TIMESTAMP,
        date TEXT,
        priority TEXT DEFAULT 'normal',
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(caseId) REFERENCES cases(id)
      );

      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
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
        id SERIAL PRIMARY KEY,
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
        id SERIAL PRIMARY KEY,
        userId INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        time TEXT,
        type TEXT,
        unread INTEGER DEFAULT 1,
        FOREIGN KEY(userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS caseCollaborators (
        id SERIAL PRIMARY KEY,
        caseId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        permissionLevel TEXT DEFAULT 'view',
        dateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(caseId) REFERENCES cases(id),
        FOREIGN KEY(userId) REFERENCES users(id),
        UNIQUE(caseId, userId)
      );

      CREATE TABLE IF NOT EXISTS caseActivity (
        id SERIAL PRIMARY KEY,
        caseId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        actionType TEXT NOT NULL,
        actionDesc TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(caseId) REFERENCES cases(id),
        FOREIGN KEY(userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS caseShares (
        id SERIAL PRIMARY KEY,
        caseId INTEGER NOT NULL,
        sharedWithUserId INTEGER NOT NULL,
        permissionLevel TEXT DEFAULT 'view',
        dateShared TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(caseId) REFERENCES cases(id),
        FOREIGN KEY(sharedWithUserId) REFERENCES users(id),
        UNIQUE(caseId, sharedWithUserId)
      );

      CREATE TABLE IF NOT EXISTS invitationCodes (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        used INTEGER DEFAULT 0,
        usedBy INTEGER,
        expiresAt TIMESTAMP NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(usedBy) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS auditLog (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        ipAddress TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS passwordResetTokens (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        code TEXT UNIQUE NOT NULL,
        used INTEGER DEFAULT 0,
        expiresAt TIMESTAMP NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
      );
    `);
    
    // Initialize first admin if none exists
    const adminCount = await db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin') as any;
    if (parseInt(adminCount.count) === 0) {
      const hashedPassword = require('bcryptjs').hashSync('admin123', 10);
      await db.prepare('INSERT INTO users (name, email, password, role, status, companyId) VALUES (?, ?, ?, ?, ?, ?)').run(
        'Admin Kullanıcısı',
        'admin@bureau.local',
        hashedPassword,
        'admin',
        'approved',
        1
      );
      console.log('✅ İlk admin hesabı oluşturuldu: admin@bureau.local / admin123');
    }
  } catch (e) {
    console.log('Admin initialization:', e);
  }
};

export default db;
