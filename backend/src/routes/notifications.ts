import { Router } from 'express';
import db from '../db';

const router = Router();

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const stmt = await db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY id DESC');
    res.json(await stmt.all(req.user.id));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    await db.prepare('UPDATE notifications SET unread = 0 WHERE userId = ?').run(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create notification (for testing or internal system use)
router.post('/', async (req, res) => {
  const { title, description, time, type } = req.body;
  try {
    const stmt = await db.prepare('INSERT INTO notifications (title, description, time, type, unread, userId) VALUES (?, ?, ?, ?, 1, ?) RETURNING id');
    const info = await stmt.run(title, description, time, type, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
