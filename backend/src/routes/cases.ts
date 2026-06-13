import { Router } from 'express';
import db from '../db';

const router = Router();

// Get all cases (with client name)
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT c.*, cl.name as clientName 
      FROM cases c 
      LEFT JOIN clients cl ON c.clientId = cl.id
      WHERE c.userId = ?
      ORDER BY c.id DESC
    `);
    const cases = stmt.all(req.user.id);
    res.json(cases);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// Get single case
router.get('/:id', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT c.*, cl.name as clientName 
      FROM cases c 
      LEFT JOIN clients cl ON c.clientId = cl.id
      WHERE c.id = ? AND c.userId = ?
    `);
    const caseItem = stmt.get(req.params.id, req.user.id);
    if (!caseItem) return res.status(404).json({ error: 'Case not found' });
    res.json(caseItem);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// Create case
router.post('/', (req, res) => {
  const { caseNo, title, court, clientId, type, clientName } = req.body;
  try {
    let finalClientId = clientId;
    if (!clientId && clientName) {
      const clientStmt = db.prepare('INSERT INTO clients (name, userId) VALUES (?, ?)');
      const info = clientStmt.run(clientName, req.user.id);
      finalClientId = info.lastInsertRowid;
    }

    const stmt = db.prepare('INSERT INTO cases (caseNo, title, court, clientId, type, userId) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(caseNo, title, court, finalClientId, type, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// Delete a case
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM expenses WHERE caseId = ? AND userId = ?').run(id, req.user.id);
    db.prepare('DELETE FROM hearings WHERE caseId = ? AND userId = ?').run(id, req.user.id);
    db.prepare('DELETE FROM notes WHERE caseId = ? AND userId = ?').run(id, req.user.id);
    db.prepare('DELETE FROM tasks WHERE caseId = ? AND userId = ?').run(id, req.user.id);
    db.prepare('DELETE FROM documents WHERE caseId = ? AND userId = ?').run(id, req.user.id);
    db.prepare('DELETE FROM messages WHERE caseId = ? AND userId = ?').run(id, req.user.id);
    const info = db.prepare('DELETE FROM cases WHERE id = ? AND userId = ?').run(id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Case not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// Update a case
router.put('/:id', (req, res) => {
  const { status } = req.body;
  try {
    const info = db.prepare('UPDATE cases SET status = ? WHERE id = ? AND userId = ?').run(status, req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Case not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// HEARINGS
router.get('/:id/hearings', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM hearings WHERE caseId = ? AND userId = ? ORDER BY date ASC, time ASC');
    res.json(stmt.all(req.params.id, req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/:id/hearings', (req, res) => {
  const { title, date, time, location } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO hearings (caseId, title, date, time, location, userId) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(req.params.id, title, date, time, location, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:caseId/hearings/:hearingId', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM hearings WHERE id = ? AND caseId = ? AND userId = ?').run(req.params.hearingId, req.params.caseId, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Hearing not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// EXPENSES
router.get('/:id/expenses', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM expenses WHERE caseId = ? AND userId = ? ORDER BY id DESC');
    res.json(stmt.all(req.params.id, req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/:id/expenses', (req, res) => {
  const { title, amount, date, status, isCompanyExpense } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO expenses (caseId, title, amount, date, status, isCompanyExpense, userId) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(req.params.id, title, amount, date, status || 'pending', isCompanyExpense ? 1 : 0, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:caseId/expenses/:expenseId', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM expenses WHERE id = ? AND caseId = ? AND userId = ?').run(req.params.expenseId, req.params.caseId, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// NOTES
router.get('/:id/notes', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM notes WHERE caseId = ? AND userId = ? ORDER BY id DESC');
    res.json(stmt.all(req.params.id, req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/:id/notes', (req, res) => {
  const { title, content, date } = req.body;
  try {
    const info = db.prepare('INSERT INTO notes (caseId, title, content, date, userId) VALUES (?, ?, ?, ?, ?)').run(req.params.id, title, content, date, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:caseId/notes/:noteId', (req, res) => {
  try {
    db.prepare('DELETE FROM notes WHERE id = ? AND caseId = ? AND userId = ?').run(req.params.noteId, req.params.caseId, req.user.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// TASKS
router.get('/:id/tasks', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM tasks WHERE caseId = ? AND userId = ? ORDER BY id DESC');
    res.json(stmt.all(req.params.id, req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/:id/tasks', (req, res) => {
  const { title, date } = req.body;
  try {
    const info = db.prepare('INSERT INTO tasks (caseId, title, completed, date, userId) VALUES (?, ?, ?, ?, ?)').run(req.params.id, title, 0, date, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:caseId/tasks/:taskId', (req, res) => {
  const { completed } = req.body;
  try {
    db.prepare('UPDATE tasks SET completed = ? WHERE id = ? AND caseId = ? AND userId = ?').run(completed ? 1 : 0, req.params.taskId, req.params.caseId, req.user.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:caseId/tasks/:taskId', (req, res) => {
  try {
    db.prepare('DELETE FROM tasks WHERE id = ? AND caseId = ? AND userId = ?').run(req.params.taskId, req.params.caseId, req.user.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// DOCUMENTS
router.get('/:id/documents', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM documents WHERE caseId = ? AND userId = ? ORDER BY id DESC');
    res.json(stmt.all(req.params.id, req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/:id/documents', upload.single('file'), (req, res) => {
  const { title, size, type, date, uploaderName } = req.body;
  const filePath = req.file ? req.file.filename : null;

  try {
    const info = db.prepare('INSERT INTO documents (caseId, title, size, type, date, uploaderName, filePath, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      req.params.id, title, size, type, date, uploaderName, filePath, req.user.id
    );
    res.json({ id: info.lastInsertRowid, filePath });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:caseId/documents/:docId', (req, res) => {
  try {
    db.prepare('DELETE FROM documents WHERE id = ? AND caseId = ? AND userId = ?').run(req.params.docId, req.params.caseId, req.user.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// MESSAGES
router.get('/:id/messages', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM messages WHERE caseId = ? AND userId = ? ORDER BY id ASC');
    res.json(stmt.all(req.params.id, req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/:id/messages', (req, res) => {
  const { sender, text, time, type, isMe } = req.body;
  try {
    const info = db.prepare('INSERT INTO messages (caseId, sender, text, time, type, isMe, userId) VALUES (?, ?, ?, ?, ?, ?, ?)').run(req.params.id, sender, text, time, type, isMe ? 1 : 0, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
