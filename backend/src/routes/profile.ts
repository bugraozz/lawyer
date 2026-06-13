import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';

const router = Router();

// Get current user profile
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, name, email, phone, barNo FROM users WHERE id = ?');
    const user = stmt.get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile details
router.put('/', (req, res) => {
  const { name, phone, barNo } = req.body;
  try {
    const stmt = db.prepare('UPDATE users SET name = ?, phone = ?, barNo = ? WHERE id = ?');
    const info = stmt.run(name, phone, barNo, req.user.id);
    
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
    const stmt = db.prepare('SELECT password FROM users WHERE id = ?');
    const user = stmt.get(req.user.id) as any;
    
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
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.user.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
