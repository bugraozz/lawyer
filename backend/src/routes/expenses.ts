import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT e.*, c.title as caseTitle, c.caseNo, u.name as uploaderName
      FROM expenses e
      LEFT JOIN cases c ON e.caseId = c.id
      LEFT JOIN users u ON e.userId = u.id
      WHERE e.userId = ? 
         OR (e.isCompanyExpense = 1 AND u.companyId = (SELECT companyId FROM users WHERE id = ?))
      ORDER BY e.id DESC
    `);
    res.json(stmt.all(req.user.id, req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', (req, res) => {
  const { status } = req.body;
  try {
    const info = db.prepare('UPDATE expenses SET status = ? WHERE id = ? AND userId = ?').run(status, req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM expenses WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
