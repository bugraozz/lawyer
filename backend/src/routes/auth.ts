import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';

const router = Router();
const JWT_SECRET = 'super_secret_lex_architect_key_change_in_prod';

router.post('/register', async (req, res) => {
  const { name, email, phone, barNo, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, email, phone, barNo, password) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, email, phone, barNo, hashedPassword);
    
    const token = jwt.sign({ id: info.lastInsertRowid, email, companyId: 1 }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: info.lastInsertRowid, name, email, companyId: 1 } });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as any;
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, companyId: user.companyId }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, companyId: user.companyId } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
