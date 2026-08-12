import { Router } from 'express';
import db from '../db';

const router = Router();

// Dashboard Stats
router.get('/', async (req, res) => {
  try {
    const activeCases = await db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'active' AND userId = ?").get(req.user.id) as any;
    const clientsCount = await db.prepare("SELECT COUNT(*) as count FROM clients WHERE userId = ?").get(req.user.id) as any;
    const normalizeDateExpr = (col: string) =>
      `CASE WHEN ${col} LIKE '__.__.____' THEN substr(${col},7,4)||'-'||substr(${col},4,2)||'-'||substr(${col},1,2) ELSE ${col} END`;

    // YYYY-MM-DD formatında bugünün tarihi
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today.getTime() - offset)).toISOString().split('T')[0] || '';

    const tasksData = await db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE completed = 0 AND userId = ? AND (date IS NULL OR date = '' OR (${normalizeDateExpr('date')}) >= ?)`).get(req.user.id, localISOTime) as any;
    const tasksCount = tasksData ? tasksData.count : 0;

    const allHearings = await db.prepare("SELECT * FROM hearings WHERE userId = ?").all(req.user.id) as any[];

    const upcomingHearingsList = allHearings.filter(h => {
      let hDateStr = h.date;
      if (hDateStr && hDateStr.includes('.')) {
        const parts = hDateStr.split('.');
        if (parts.length === 3) hDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return hDateStr >= localISOTime;
    }).sort((a, b) => {
      let aDateStr = a.date && a.date.includes('.') ? a.date.split('.').reverse().join('-') : a.date;
      let bDateStr = b.date && b.date.includes('.') ? b.date.split('.').reverse().join('-') : b.date;
      if (aDateStr !== bDateStr) return (aDateStr || '').localeCompare(bDateStr || '');
      return (a.time || '').localeCompare(b.time || '');
    });

    const upcomingHearingsCount = upcomingHearingsList.length;
    const nextHearing = upcomingHearingsList.length > 0 ? upcomingHearingsList[0] : null;

    // Gerçek veri tabanından son aktiviteleri çekiyoruz
    const rawActivity = await db.prepare(`
      SELECT actionType, actionDesc, timestamp
      FROM caseActivity 
      WHERE userId = ? 
      ORDER BY timestamp DESC 
      LIMIT 5
    `).all(req.user.id) as any[];

    const recentActivity = rawActivity.map(act => {
      const d = new Date(act.timestamp);
      // Eğer timestamp UTC olarak geldiyse, doğrudan gösteriyoruz (ya da locale formatta)
      const timeStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      return {
        type: (act.actionType || '').includes('document') ? 'document' : 'action',
        text: act.actionDesc,
        time: timeStr
      };
    });

    res.json({
      stats: {
        activeCases: activeCases.count,
        upcomingHearings: upcomingHearingsCount,
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

router.get('/reports', async (req, res) => {
  try {
    const expenses = await db.prepare(`
      SELECT substring(date from 6 for 2) as month, SUM(amount) as total 
      FROM expenses 
      WHERE userId = ? 
        AND date >= to_char(NOW() - INTERVAL '6 months', 'YYYY-MM-DD')
        AND date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      GROUP BY substring(date from 6 for 2)
      ORDER BY month ASC
    `).all(req.user.id) as any[];

    const caseStatus = await db.prepare(`
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
