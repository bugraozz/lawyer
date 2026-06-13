import { Router } from 'express';
import db from '../db';

const router = Router();

// Get all notifications
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY id DESC');
    res.json(stmt.all(req.user.id));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all as read
router.put('/read-all', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET unread = 0 WHERE userId = ?').run(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create notification (for testing or internal system use)
router.post('/', (req, res) => {
  const { title, desc, time, type } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO notifications (title, desc, time, type, unread, userId) VALUES (?, ?, ?, ?, 1, ?)');
    const info = stmt.run(title, desc, time, type, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
