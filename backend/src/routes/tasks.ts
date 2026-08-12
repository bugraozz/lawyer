import { Router } from 'express';
import db from '../db';
import { validate } from '../middleware/validate';
import { createTaskSchema } from '../schemas';

const router = Router();

// Get all tasks for user
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const localTimeStr = localNow.toISOString().replace('T', ' ').substring(0, 19);

    // Delete tasks that were completed more than 12 hours ago
    await db.prepare(`
      DELETE FROM tasks 
      WHERE userId = ? 
        AND completed = 1 
        AND completedAt <= NOW() - INTERVAL '12 hours'
    `).run(req.user.id);
    
    // Delete overdue tasks that expired > 12 hours ago (i.e. next day at 12:00 PM)
    await db.prepare(`
      DELETE FROM tasks 
      WHERE userId = ? 
        AND completed = 0 
        AND date IS NOT NULL AND date != '' 
        AND NOW() >= (
          CASE 
            WHEN date ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$' 
            THEN (substr(date,7,4)||'-'||substr(date,4,2)||'-'||substr(date,1,2))::timestamp + INTERVAL '36 hours'
            ELSE date::timestamp + INTERVAL '36 hours'
          END
        )
    `).run(req.user.id);

    const stmt = await db.prepare(`
      SELECT t.*, c.title as caseTitle 
      FROM tasks t 
      LEFT JOIN cases c ON t.caseId = c.id
      WHERE t.userId = ? 
      ORDER BY t.id DESC
    `);
    const tasks = await stmt.all(req.user.id);
    res.json(tasks);
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

// Create a new task
router.post('/', validate(createTaskSchema), async (req, res) => {
  const { title, date, priority, caseId } = req.body;
  try {
    const stmt = await db.prepare('INSERT INTO tasks (title, completed, date, priority, caseId, userId) VALUES (?, ?, ?, ?, ?, ?) RETURNING id');
    const info = await stmt.run(title, 0, date || new Date().toISOString().split('T')[0], priority || 'normal', caseId || null, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

// Update task status (completed)
router.put('/:id', async (req, res) => {
  const { completed } = req.body;
  try {
    let info;
    if (completed) {
      info = await db.prepare('UPDATE tasks SET completed = 1, completedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
    } else {
      info = await db.prepare('UPDATE tasks SET completed = 0, completedAt = NULL WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
    }
    if (info.changes === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const info = await db.prepare('DELETE FROM tasks WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

export default router;
