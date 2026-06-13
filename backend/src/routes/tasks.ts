import { Router } from 'express';
import db from '../db';

const router = Router();

// Get all tasks for user
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT t.*, c.title as caseTitle 
      FROM tasks t 
      LEFT JOIN cases c ON t.caseId = c.id
      WHERE t.userId = ? 
      ORDER BY t.id DESC
    `);
    const tasks = stmt.all(req.user.id);
    res.json(tasks);
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

// Create a new task
router.post('/', (req, res) => {
  const { title, date, caseId } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO tasks (title, completed, date, caseId, userId) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(title, 0, date || new Date().toISOString(), caseId || null, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

// Update task status (completed)
router.put('/:id', (req, res) => {
  const { completed } = req.body;
  try {
    const info = db.prepare('UPDATE tasks SET completed = ? WHERE id = ? AND userId = ?').run(
      completed ? 1 : 0, 
      req.params.id, 
      req.user.id
    );
    if (info.changes === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

// Delete task
router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM tasks WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

export default router;
