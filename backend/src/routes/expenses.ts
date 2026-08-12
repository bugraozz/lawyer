import { Router } from 'express';
import db from '../db';
import { validate } from '../middleware/validate';
import { createExpenseSchema } from '../schemas';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const stmt = await db.prepare(`
      SELECT e.*, c.title as caseTitle, c.caseNo, u.name as uploaderName
      FROM expenses e
      LEFT JOIN cases c ON e.caseId = c.id
      LEFT JOIN users u ON e.userId = u.id
      WHERE e.userId = ? 
         OR (e.isCompanyExpense = 1 AND u.companyId = (SELECT companyId FROM users WHERE id = ?))
      ORDER BY e.id DESC
    `);
    res.json(await stmt.all(req.user.id, req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', validate(createExpenseSchema), async (req, res) => {
  const { title, amount, date, status, isCompanyExpense, caseId } = req.body;
  try {
    const parsedCaseId = caseId ? Number(caseId) : null;
    if (parsedCaseId) {
      const caseStmt = await db.prepare('SELECT id FROM cases WHERE id = ? AND userId = ?');
      const caseItem = caseStmt.get(parsedCaseId, req.user.id);
      if (!caseItem) return res.status(404).json({ error: 'Case not found' });
    }
    const stmt = await db.prepare('INSERT INTO expenses (caseId, title, amount, date, status, isCompanyExpense, userId) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id');
    const info = await stmt.run(parsedCaseId, title, amount, date, status || 'pending', isCompanyExpense ? 1 : 0, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', async (req, res) => {
  const { status } = req.body;
  try {
    const info = await db.prepare('UPDATE expenses SET status = ? WHERE id = ? AND userId = ?').run(status, req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const info = await db.prepare('DELETE FROM expenses WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
