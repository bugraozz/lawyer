import { Router } from 'express';
import db from '../db';

const router = Router();

// GET all clients with active case count
router.get('/', async (req, res) => {
  try {
    const stmt = await db.prepare(`
      SELECT 
        cl.*,
        COUNT(CASE WHEN c.status = 'active' THEN 1 END) as activeCases,
        COUNT(c.id) as totalCases
      FROM clients cl
      LEFT JOIN cases c ON cl.id = c.clientId AND c.userId = cl.userId
      WHERE cl.userId = ?
      GROUP BY cl.id
      ORDER BY cl.id DESC
    `);
    res.json(await stmt.all(req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// GET single client
router.get('/:id', async (req, res) => {
  try {
    const client = await db.prepare('SELECT * FROM clients WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// POST create client
router.post('/', async (req, res) => {
  const { name, email, phone, status } = req.body;
  try {
    const stmt = await db.prepare('INSERT INTO clients (name, email, phone, status, userId) VALUES (?, ?, ?, ?, ?) RETURNING id');
    const info = await stmt.run(name, email, phone, status || 'active', req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// PUT update client info
router.put('/:id', async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const info = await db.prepare(
      'UPDATE clients SET name = ?, email = ?, phone = ? WHERE id = ? AND userId = ?'
    ).run(name, email || null, phone || null, req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// DELETE client
router.delete('/:id', async (req, res) => {
  try {
    const info = await db.prepare('DELETE FROM clients WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
    if (info.changes > 0) {
      await db.prepare('UPDATE cases SET clientId = NULL WHERE clientId = ? AND userId = ?').run(req.params.id, req.user.id);
    }
    if (info.changes === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;

