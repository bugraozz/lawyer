import { Router } from 'express';
import db from '../db';
import { sendPushNotification } from '../services/PushService';

const router = Router();

// Middleware: Check admin role
const checkAdmin = (req: any, res: any, next: any) => {
  console.log('checkAdmin called. User role:', req.user?.role);
  if (req.user.role !== 'admin') {
    console.log('Access denied. Expected admin, got:', req.user?.role);
    return res.status(403).json({ error: 'Yalnızca admin erişebilir' });
  }
  next();
};

// DASHBOARD - Admin overview
router.get('/dashboard', checkAdmin, async (req, res) => {
  try {
    const totalUsers = (await db.prepare('SELECT COUNT(*) as count FROM users WHERE companyId = 1').get() as any).count;
    const pendingUsers = (await db.prepare('SELECT COUNT(*) as count FROM users WHERE status = $1 AND companyId = 1').get('pending') as any).count;
    const approvedUsers = (await db.prepare('SELECT COUNT(*) as count FROM users WHERE status = $1 AND companyId = 1').get('approved') as any).count;
    const totalCases = (await db.prepare('SELECT COUNT(*) as count FROM cases WHERE userId IN (SELECT id FROM users WHERE companyId = 1)').get() as any).count;
    
    const recentActivity = await db.prepare(`
      SELECT au.action, au.details, u.name, au.timestamp
      FROM auditLog au
      JOIN users u ON au.userId = u.id
      WHERE u.companyId = 1
      ORDER BY au.timestamp DESC
      LIMIT 10
    `).all();

    res.json({
      stats: {
        totalUsers: Number(totalUsers),
        pendingUsers: Number(pendingUsers),
        approvedUsers: Number(approvedUsers),
        totalCases: Number(totalCases)
      },
      recentActivity
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

// GET all users with pagination
router.get('/users', checkAdmin, async (req, res) => {
  try {
    const status = req.query.status as string || '';
    let stmt;
    
    if (status) {
      stmt = await db.prepare(`
        SELECT id, name, email, phone, barNo, role, status, createdAt, lastLogin
        FROM users 
        WHERE companyId = 1 AND status = $1
        ORDER BY createdAt DESC
      `);
      const users = await stmt.all(status);
      res.json(users);
    } else {
      stmt = await db.prepare(`
        SELECT id, name, email, phone, barNo, role, status, createdAt, lastLogin
        FROM users 
        WHERE companyId = 1
        ORDER BY createdAt DESC
      `);
      res.json(await stmt.all());
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

// APPROVE user
router.post('/users/:userId/approve', checkAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await db.prepare('SELECT * FROM users WHERE id = $1 AND companyId = 1').get(userId) as any;
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    await db.prepare('UPDATE users SET status = $1, approvedBy = $2 WHERE id = $3').run('approved', req.user.id, userId);

    await db.prepare(`
      INSERT INTO notifications (userId, title, description, time, type, unread)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, 1) RETURNING id
    `).run(userId, 'Hesap Onaylandı', 'Hesabınız yönetici tarafından onaylanmıştır. Artık giriş yapabilirsiniz.', 'success');

    sendPushNotification(userId, 'Hesap Onaylandı', 'Hesabınız yönetici tarafından onaylanmıştır. Artık giriş yapabilirsiniz.');

    // Audit log
    await db.prepare('INSERT INTO auditLog (userId, action, details) VALUES ($1, $2, $3) RETURNING id').run(
      req.user.id, 'user_approved', `${user.name} onaylandı`
    );

    res.json({ success: true, message: 'Kullanıcı onaylandı' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

// REJECT user
router.post('/users/:userId/reject', checkAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const { reason } = req.body;

    const user = await db.prepare('SELECT * FROM users WHERE id = $1 AND companyId = 1').get(userId) as any;
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    await db.prepare('UPDATE users SET status = $1 WHERE id = $2').run('rejected', userId);

    await db.prepare(`
      INSERT INTO notifications (userId, title, description, time, type, unread)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, 1) RETURNING id
    `).run(userId, 'Hesap Reddedildi', `Hesabınız reddedilmiştir: ${reason || 'Neden belirtilmedi'}`, 'error');

    sendPushNotification(userId, 'Hesap Reddedildi', `Hesabınız reddedilmiştir: ${reason || 'Neden belirtilmedi'}`);

    // Audit log
    await db.prepare('INSERT INTO auditLog (userId, action, details) VALUES ($1, $2, $3) RETURNING id').run(
      req.user.id, 'user_rejected', `${user.name} reddedildi - Neden: ${reason}`
    );

    res.json({ success: true, message: 'Kullanıcı reddedildi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

// DELETE user
router.delete('/users/:userId', checkAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === String(req.user.id)) {
      return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
    }

    const user = await db.prepare('SELECT * FROM users WHERE id = $1 AND companyId = 1').get(userId) as any;
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    // Delete user data
    await db.prepare('DELETE FROM auditLog WHERE userId = $1').run(userId);
    await db.prepare('DELETE FROM passwordResetTokens WHERE userId = $1').run(userId);
    await db.prepare('DELETE FROM invitationCodes WHERE usedBy = $1').run(userId);
    await db.prepare('DELETE FROM notifications WHERE userId = $1').run(userId);
    await db.prepare('DELETE FROM caseActivity WHERE userId = $1').run(userId);
    await db.prepare('DELETE FROM caseShares WHERE sharedWithUserId = $1').run(userId);
    await db.prepare('DELETE FROM caseCollaborators WHERE userId = $1').run(userId);
    await db.prepare('DELETE FROM messages WHERE userId = $1').run(userId);
    await db.prepare('DELETE FROM documents WHERE userId = $1').run(userId);
    await db.prepare('DELETE FROM tasks WHERE userId = $1').run(userId);
    await db.prepare('DELETE FROM notes WHERE userId = $1').run(userId);
    await db.prepare('DELETE FROM hearings WHERE userId = $1').run(userId);
    await db.prepare('DELETE FROM expenses WHERE userId = $1').run(userId);
    await db.prepare('DELETE FROM events WHERE userId = $1').run(userId);
    await db.prepare('DELETE FROM clients WHERE userId = $1').run(userId);
    await db.prepare('DELETE FROM cases WHERE userId = $1').run(userId);
    await db.prepare('DELETE FROM users WHERE id = $1').run(userId);

    // Audit log
    await db.prepare('INSERT INTO auditLog (userId, action, details) VALUES ($1, $2, $3) RETURNING id').run(
      req.user.id, 'user_deleted', `${user.name} silindi`
    );

    res.json({ success: true, message: 'Kullanıcı silindi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

// GENERATE invitation codes
router.post('/generate-invites', checkAdmin, async (req, res) => {
  try {
    const { emails, expiryDays = 30 } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'E-mail adresleri gerekli' });
    }

    const codes = [];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    for (const email of emails) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      await db.prepare(`
        INSERT INTO invitationCodes (email, code, expiresAt)
        VALUES ($1, $2, $3) RETURNING id
      `).run(email, code, expiryDate.toISOString());

      codes.push({ email, code, expiresAt: expiryDate.toISOString() });
    }

    // Audit log
    await db.prepare('INSERT INTO auditLog (userId, action, details) VALUES ($1, $2, $3) RETURNING id').run(
      req.user.id, 'invites_generated', `${emails.length} davetiye kodu oluşturuldu`
    );

    res.json({ 
      success: true, 
      message: `${emails.length} davetiye kodu oluşturuldu`,
      invites: codes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

// GET invitation codes
router.get('/invitations', checkAdmin, async (req, res) => {
  try {
    const invites = await db.prepare(`
      SELECT id, email, code, used, usedBy, expiresAt, createdAt
      FROM invitationCodes
      ORDER BY createdAt DESC
    `).all();

    res.json(invites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

// GET audit log
router.get('/audit-log', checkAdmin, async (req, res) => {
  try {
    const logs = await db.prepare(`
      SELECT au.id, u.name, au.action, au.details, au.timestamp
      FROM auditLog au
      JOIN users u ON au.userId = u.id
      WHERE u.companyId = 1
      ORDER BY au.timestamp DESC
      LIMIT 100
    `).all();

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

// GET notifications for user
router.get('/notifications/:userId', checkAdmin, async (req, res) => {
  try {
    const notifications = await db.prepare(`
      SELECT * FROM notifications
      WHERE userId = $1
      ORDER BY id DESC
      LIMIT 50
    `).all(req.params.userId);

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

// MARK notification as read
router.put('/notifications/:notifId/read', checkAdmin, async (req, res) => {
  try {
    await db.prepare('UPDATE notifications SET unread = 0 WHERE id = $1').run(req.params.notifId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

// EXPORT activity report
router.get('/export/activity/:caseId', checkAdmin, async (req, res) => {
  try {
    const activity = await db.prepare(`
      SELECT ca.id, u.name, ca.actionType, ca.actionDesc, ca.timestamp
      FROM caseActivity ca
      JOIN users u ON ca.userId = u.id
      WHERE ca.caseId = $1
      ORDER BY ca.timestamp DESC
    `).all(req.params.caseId);

    // Format as CSV
    const csv = 'Tarih,Kullanıcı,İşlem Türü,Açıklama\n' +
      activity.map((row: any) => 
        `${row.timestamp},${row.name},${row.actionType},"${row.actionDesc}"`
      ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=activity-report.csv');
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

export default router;
