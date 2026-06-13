import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM clients WHERE userId = ? ORDER BY id DESC');
    res.json(stmt.all(req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', (req, res) => {
  const { name, email, phone, status } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO clients (name, email, phone, status, userId) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, email, phone, status || 'active', req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM clients WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
