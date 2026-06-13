import { Router } from 'express';
import db from '../db';

const router = Router();

// Dashboard Stats
router.get('/', (req, res) => {
  try {
    const activeCases = db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'active' AND userId = ?").get(req.user.id) as any;
    const upcomingHearings = db.prepare("SELECT COUNT(*) as count FROM hearings WHERE date >= date('now') AND userId = ?").get(req.user.id) as any;
    const clientsCount = db.prepare("SELECT COUNT(*) as count FROM clients WHERE userId = ?").get(req.user.id) as any;
    const tasksData = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE completed = 0 AND userId = ?").get(req.user.id) as any;
    const tasksCount = tasksData ? tasksData.count : 0;

    const nextHearing = db.prepare("SELECT * FROM hearings WHERE date >= date('now') AND userId = ? ORDER BY date ASC, time ASC LIMIT 1").get(req.user.id) as any;

    // Gerçek veri tabanından son aktiviteleri çekebiliriz, şimdilik mock datayı kaldırıyoruz.
    const recentActivity: any[] = [];

    res.json({
      stats: {
        activeCases: activeCases.count,
        upcomingHearings: upcomingHearings.count,
        clientsCount: clientsCount.count,
        tasksCount
      },
      nextHearing: nextHearing || null,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reports', (req, res) => {
  try {
    const expenses = db.prepare(`
      SELECT strftime('%m', date) as month, SUM(amount) as total 
      FROM expenses 
      WHERE userId = ? AND date >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month ASC
    `).all(req.user.id) as any[];

    const caseStatus = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM cases 
      WHERE userId = ?
      GROUP BY status
    `).all(req.user.id) as any[];

    res.json({
      expenses: expenses.map(e => ({ month: e.month, total: e.total })),
      caseStatus: caseStatus.map(c => ({ status: c.status, count: c.count }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
