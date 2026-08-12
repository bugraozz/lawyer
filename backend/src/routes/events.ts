import { Router } from 'express';
import db from '../db';

const router = Router();

// Helper to normalize DD.MM.YYYY → YYYY-MM-DD for SQLite string comparison
const normalizeDateExpr = (col: string) =>
  `CASE WHEN ${col} LIKE '__.__.____' THEN substr(${col},7,4)||'-'||substr(${col},4,2)||'-'||substr(${col},1,2) ELSE ${col} END`;

router.get('/upcoming', async (req, res) => {
  try {
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const today = localNow.toISOString().split('T')[0];

    // Delete hearings that are strictly before today
    await db.prepare(`
      DELETE FROM hearings 
      WHERE userId = ? 
      AND (${normalizeDateExpr('date')}) < ?
    `).run(req.user.id, today);

    // Events (stored as YYYY-MM-DD)
    const events = await db.prepare(`
      SELECT id, title, type, date, time, location,
             'event' as source, null as caseId, null as caseTitle, null as caseNo, null as court
      FROM events
      WHERE userId = ? AND date >= ?
      ORDER BY date ASC, time ASC
    `).all(req.user.id, today);

    // Hearings (may be stored as DD.MM.YYYY)
    const hearings = await db.prepare(`
      SELECT h.id, h.title, 'hearing' as type, h.date, h.time, h.location,
             'hearing' as source, h.caseId, c.title as caseTitle, c.caseNo, c.court
      FROM hearings h
      LEFT JOIN cases c ON h.caseId = c.id
      WHERE h.userId = ?
        AND (${normalizeDateExpr('h.date')}) >= ?
      ORDER BY (${normalizeDateExpr('h.date')}) ASC, h.time ASC
    `).all(req.user.id, today);

    // Tasks (incomplete, may be stored as DD.MM.YYYY or YYYY-MM-DD)
    const tasks = await db.prepare(`
      SELECT t.id, t.title, 'task' as type, t.date, null as time, null as location,
             'task' as source, t.caseId, c.title as caseTitle, c.caseNo, c.court
      FROM tasks t
      LEFT JOIN cases c ON t.caseId = c.id
      WHERE t.userId = ? AND t.completed = 0
        AND (${normalizeDateExpr('t.date')}) >= ?
      ORDER BY (${normalizeDateExpr('t.date')}) ASC
    `).all(req.user.id, today);

    const all = [...events, ...hearings, ...tasks].sort((a: any, b: any) => {
      let dateA = a.date;
      if (dateA && dateA.includes('.')) dateA = dateA.split('.').reverse().join('-');
      let dateB = b.date;
      if (dateB && dateB.includes('.')) dateB = dateB.split('.').reverse().join('-');
      return (dateA + ' ' + (a.time || '00:00')).localeCompare(dateB + ' ' + (b.time || '00:00'));
    });

    res.json(all);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/all-hearings', async (req, res) => {
  try {
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const today = localNow.toISOString().split('T')[0];

    // Delete hearings that are strictly before today
    await db.prepare(`
      DELETE FROM hearings 
      WHERE userId = ? 
      AND (${normalizeDateExpr('date')}) < ?
    `).run(req.user.id, today);

    const hearings = await db.prepare(`
      SELECT h.id, h.title, h.date, h.time, h.location, h.caseId,
             c.title as caseTitle, c.caseNo, c.court, c.status
      FROM hearings h
      LEFT JOIN cases c ON h.caseId = c.id
      WHERE h.userId = ?
    `).all(req.user.id) as any[];

    hearings.sort((a, b) => {
      let aDate = a.date && a.date.includes('.') ? a.date.split('.').reverse().join('-') : a.date;
      let bDate = b.date && b.date.includes('.') ? b.date.split('.').reverse().join('-') : b.date;
      if (aDate !== bDate) return (aDate || '').localeCompare(bDate || '');
      return (a.time || '').localeCompare(b.time || '');
    });

    res.json(hearings);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const stmt = await db.prepare('SELECT * FROM events WHERE userId = ? ORDER BY date ASC, time ASC');
    res.json(await stmt.all(req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req, res) => {
  const { title, type, date, time, location } = req.body;
  try {
    const stmt = await db.prepare('INSERT INTO events (title, type, date, time, location, userId) VALUES (?, ?, ?, ?, ?, ?) RETURNING id');
    const info = await stmt.run(title, type, date, time, location, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const info = await db.prepare('DELETE FROM events WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
