import bcrypt from 'bcryptjs';
import { Router } from 'express';
import db from '../db';

const router = Router();

// Get current user profile
router.get('/', async (req, res) => {
  try {
    const stmt = await db.prepare('SELECT id, name, email, phone, barNo FROM users WHERE id = ?');
    const user = await stmt.get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile details
router.put('/', async (req, res) => {
  const { name, phone, barNo } = req.body;
  try {
    const stmt = await db.prepare('UPDATE users SET name = ?, phone = ?, barNo = ? WHERE id = ?');
    const info = await stmt.run(name, phone, barNo, req.user.id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/password', async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const stmt = await db.prepare('SELECT password FROM users WHERE id = ?');
    const user = await stmt.get(req.user.id) as any;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Eski şifre yanlış' });
    }
    
    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.user.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users in company
router.get('/company/users', async (req, res) => {
  try {
    const stmt = await db.prepare(`
      SELECT id, name, email FROM users 
      WHERE companyId = (SELECT companyId FROM users WHERE id = ?)
      ORDER BY name ASC
    `);
    const users = await stmt.all(req.user.id);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save push token
router.post('/push-token', async (req, res) => {
  const { token } = req.body;
  try {
    await db.prepare('UPDATE users SET pushToken = ? WHERE id = ?').run(token, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
