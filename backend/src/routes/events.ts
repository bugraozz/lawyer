import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/upcoming', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const eventsStmt = db.prepare(`SELECT id, title, type, date, time, location, 'event' as source FROM events WHERE userId = ? AND date >= ? ORDER BY date ASC, time ASC`);
    const events = eventsStmt.all(req.user.id, today);
    
    const hearingsStmt = db.prepare(`SELECT h.id, h.title, 'hearing' as type, h.date, h.time, h.location, 'hearing' as source, c.title as caseTitle FROM hearings h LEFT JOIN cases c ON h.caseId = c.id WHERE h.userId = ? AND h.date >= ? ORDER BY h.date ASC, h.time ASC`);
    const hearings = hearingsStmt.all(req.user.id, today);
    
    const all = [...events, ...hearings].sort((a, b) => {
      const dateA = a.date + ' ' + (a.time || '00:00');
      const dateB = b.date + ' ' + (b.time || '00:00');
      return dateA.localeCompare(dateB);
    });
    
    res.json(all);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM events WHERE userId = ? ORDER BY date ASC, time ASC');
    res.json(stmt.all(req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', (req, res) => {
  const { title, type, date, time, location } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO events (title, type, date, time, location, userId) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(title, type, date, time, location, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM events WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
