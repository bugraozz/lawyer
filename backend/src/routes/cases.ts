import { Router } from 'express';
import db from '../db';
import path from 'path';
import multer from 'multer';
import { sendPushNotification, sendPushNotificationToCaseTeam } from '../services/PushService';
import { validate } from '../middleware/validate';
import { createCaseSchema, updateCaseStatusSchema, createHearingSchema, createExpenseSchema, createNoteSchema, createTaskSchema } from '../schemas';

const router = Router();

const parseRouteId = (value: string | string[] | undefined) => {
  const normalized = Array.isArray(value) ? value[0] : value;
  const id = Number(normalized);
  return Number.isInteger(id) ? id : null;
};

// Get all cases (with client name + phone)
router.get('/', async (req, res) => {
  try {
    const stmt = await db.prepare(`
      SELECT c.*, cl.name as clientName, cl.phone as clientPhone, cl.email as clientEmail
      FROM cases c 
      LEFT JOIN clients cl ON c.clientId = cl.id
      WHERE c.userId = ?
      ORDER BY c.id DESC
    `);
    const cases = await stmt.all(req.user.id);
    res.json(cases);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// COLLABORATION ROUTES (MUST come before /:id route)
// GET case collaborators
router.get('/:caseId/collaborators', async (req, res) => {
  try {
    const { caseId } = req.params;
    const stmt = await db.prepare(`
      SELECT cc.id, u.id as userId, u.name, u.email, cc.permissionLevel, cc.dateAdded
      FROM caseCollaborators cc
      JOIN users u ON cc.userId = u.id
      WHERE cc.caseId = ?
      ORDER BY cc.dateAdded ASC
    `);
    const collaborators = await stmt.all(caseId);
    res.json(collaborators);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADD collaborator to case
router.post('/:caseId/collaborators', async (req, res) => {
  const caseId = parseRouteId(req.params.caseId);
  const userId = Number(req.body.userId);
  const permissionLevel = req.body.permissionLevel || 'view';
  if (caseId === null || !Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Invalid case or user ID' });
  }
  try {
    // Check if case exists and belongs to user's company
    const caseStmt = await db.prepare(`
      SELECT c.id FROM cases c
      JOIN users u ON c.userId = u.id
      WHERE c.id = ? AND u.companyId = (SELECT companyId FROM users WHERE id = ?)
    `);
    const caseItem = await caseStmt.get(caseId, req.user.id);
    if (!caseItem) return res.status(404).json({ error: 'Case not found' });

    // Check if user is in same company
    const userStmt = await db.prepare(`
      SELECT id FROM users WHERE id = ? AND companyId = (SELECT companyId FROM users WHERE id = ?)
    `);
    const userItem = await userStmt.get(userId, req.user.id);
    if (!userItem) return res.status(404).json({ error: 'User not found in your company' });

    // Add collaborator
    const insertStmt = await db.prepare(`
      INSERT INTO caseCollaborators (caseId, userId, permissionLevel)
      VALUES (?, ?, ?) RETURNING id
    `);
    const info = await insertStmt.run(caseId, userId, permissionLevel);

    // Log activity
    const addedUser = await db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;
    await db.prepare(`
      INSERT INTO caseActivity (caseId, userId, actionType, actionDesc)
      VALUES (?, ?, ?, ?) RETURNING id
    `).run(caseId, req.user.id, 'team_add', `Ekip üyesi eklendi: ${addedUser?.name || 'Kullanıcı'}`);

    // Notify the added user
    const caseInfo = await db.prepare('SELECT title FROM cases WHERE id = ?').get(caseId) as any;
    sendPushNotification(userId, 'Yeni Ekip Üyeliği', `${caseInfo?.title || 'Bir'} davasına ekip üyesi olarak eklendiniz.`);

    res.json({ id: info.lastInsertRowid });
  } catch (error: any) {
    if (error.code === '23505' || (error.message && error.message.includes('UNIQUE'))) {
      return res.status(400).json({ error: 'Bu kullanıcı zaten ekip üyesi' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE collaborator permission
router.put('/:caseId/collaborators/:collaboratorId', async (req, res) => {
  const { caseId, collaboratorId } = req.params;
  const { permissionLevel } = req.body;
  try {
    // Check if case belongs to user's company
    const caseStmt = await db.prepare(`
      SELECT c.id FROM cases c
      JOIN users u ON c.userId = u.id
      WHERE c.id = ? AND u.companyId = (SELECT companyId FROM users WHERE id = ?)
    `);
    const caseItem = await caseStmt.get(caseId, req.user.id);
    if (!caseItem) return res.status(404).json({ error: 'Case not found' });

    // Get collaborator info before update
    const collab = await db.prepare(`
      SELECT cc.userId, u.name FROM caseCollaborators cc
      JOIN users u ON cc.userId = u.id
      WHERE cc.id = ? AND cc.caseId = ?
    `).get(collaboratorId, caseId) as { name: string } | undefined;
    if (!collab) return res.status(404).json({ error: 'Collaborator not found' });

    // Update permission
    const updateStmt = await db.prepare(`
      UPDATE caseCollaborators SET permissionLevel = ?
      WHERE id = ? AND caseId = ?
    `);
    const info = await updateStmt.run(permissionLevel, collaboratorId, caseId);
    if (info.changes === 0) return res.status(404).json({ error: 'Collaborator not found' });

    // Log activity
    await db.prepare(`
      INSERT INTO caseActivity (caseId, userId, actionType, actionDesc)
      VALUES (?, ?, ?, ?) RETURNING id
    `).run(caseId, req.user.id, 'team_perm_change', `${collab.name} yetkisi değiştirildi: ${permissionLevel}`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// REMOVE collaborator
router.delete('/:caseId/collaborators/:collaboratorId', async (req, res) => {
  const { caseId, collaboratorId } = req.params;
  try {
    // Check if case belongs to user's company
    const caseStmt = await db.prepare(`
      SELECT c.id FROM cases c
      JOIN users u ON c.userId = u.id
      WHERE c.id = ? AND u.companyId = (SELECT companyId FROM users WHERE id = ?)
    `);
    const caseItem = await caseStmt.get(caseId, req.user.id);
    if (!caseItem) return res.status(404).json({ error: 'Case not found' });

    // Get collaborator info before delete
    const collab = await db.prepare(`
      SELECT cc.userId, u.name FROM caseCollaborators cc
      JOIN users u ON cc.userId = u.id
      WHERE cc.id = ? AND cc.caseId = ?
    `).get(collaboratorId, caseId) as { name: string } | undefined;
    if (!collab) return res.status(404).json({ error: 'Collaborator not found' });

    // Delete
    const deleteStmt = await db.prepare(`
      DELETE FROM caseCollaborators WHERE id = ? AND caseId = ?
    `);
    const info = await deleteStmt.run(collaboratorId, caseId);
    if (info.changes === 0) return res.status(404).json({ error: 'Collaborator not found' });

    // Log activity
    await db.prepare(`
      INSERT INTO caseActivity (caseId, userId, actionType, actionDesc)
      VALUES (?, ?, ?, ?) RETURNING id
    `).run(caseId, req.user.id, 'team_remove', `Ekip üyesi kaldırıldı: ${collab.name}`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET case activity
router.get('/:caseId/collaborators/activity', async (req, res) => {
  try {
    const { caseId } = req.params;
    const stmt = await db.prepare(`
      SELECT ca.id, u.name as userName, ca.actionType, ca.actionDesc, ca.timestamp
      FROM caseActivity ca
      JOIN users u ON ca.userId = u.id
      WHERE ca.caseId = ?
      ORDER BY ca.timestamp DESC
      LIMIT 50
    `);
    const activity = await stmt.all(caseId);
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET case shares
router.get('/:caseId/collaborators/shares', async (req, res) => {
  try {
    const { caseId } = req.params;
    const stmt = await db.prepare(`
      SELECT cs.id, u.id as userId, u.name, u.email, cs.permissionLevel, cs.dateShared
      FROM caseShares cs
      JOIN users u ON cs.sharedWithUserId = u.id
      WHERE cs.caseId = ?
      ORDER BY cs.dateShared DESC
    `);
    const shares = await stmt.all(caseId);
    res.json(shares);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE case share
router.post('/:caseId/collaborators/shares', async (req, res) => {
  const { caseId } = req.params;
  const { userId, permissionLevel = 'view' } = req.body;
  try {
    // Check if case exists and belongs to user
    const caseStmt = await db.prepare(`
      SELECT c.id FROM cases c WHERE c.id = ? AND c.userId = ?
    `);
    const caseItem = await caseStmt.get(caseId, req.user.id);
    if (!caseItem) return res.status(404).json({ error: 'Case not found' });

    // Check if user exists
    const userStmt = await db.prepare(`SELECT id, name FROM users WHERE id = ?`);
    const userItem = await userStmt.get(userId) as any;
    if (!userItem) return res.status(404).json({ error: 'User not found' });

    // Add share
    const insertStmt = await db.prepare(`
      INSERT INTO caseShares (caseId, sharedWithUserId, permissionLevel)
      VALUES (?, ?, ?) RETURNING id
    `);
    const info = await insertStmt.run(caseId, userId, permissionLevel);

    // Log activity
    await db.prepare(`
      INSERT INTO caseActivity (caseId, userId, actionType, actionDesc)
      VALUES (?, ?, ?, ?) RETURNING id
    `).run(caseId, req.user.id, 'case_shared', `Dava paylaşıldı: ${userItem.name}`);

    // Notify the user it was shared with
    const caseInfo = await db.prepare('SELECT title FROM cases WHERE id = ?').get(caseId) as any;
    sendPushNotification(userId, 'Dava Paylaşıldı', `${caseInfo?.title || 'Bir'} davası sizinle paylaşıldı.`);

    res.json({ id: info.lastInsertRowid });
  } catch (error: any) {
    if (error.code === '23505' || (error.message && error.message.includes('UNIQUE'))) {
      return res.status(400).json({ error: 'Bu dava zaten bu kullanıcı ile paylaşılmış' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// REMOVE share
router.delete('/:caseId/collaborators/shares/:shareId', async (req, res) => {
  const { caseId, shareId } = req.params;
  try {
    // Check if case exists and belongs to user
    const caseStmt = await db.prepare(`
      SELECT c.id FROM cases c WHERE c.id = ? AND c.userId = ?
    `);
    const caseItem = await caseStmt.get(caseId, req.user.id);
    if (!caseItem) return res.status(404).json({ error: 'Case not found' });

    // Get share info before delete
    const share = await db.prepare(`
      SELECT cs.sharedWithUserId, u.name FROM caseShares cs
      JOIN users u ON cs.sharedWithUserId = u.id
      WHERE cs.id = ? AND cs.caseId = ?
    `).get(shareId, caseId) as any;
    if (!share) return res.status(404).json({ error: 'Share not found' });

    // Delete share
    const deleteStmt = await db.prepare(`
      DELETE FROM caseShares WHERE id = ? AND caseId = ?
    `);
    const info = await deleteStmt.run(shareId, caseId);
    if (info.changes === 0) return res.status(404).json({ error: 'Share not found' });

    // Log activity
    await db.prepare(`
      INSERT INTO caseActivity (caseId, userId, actionType, actionDesc)
      VALUES (?, ?, ?, ?) RETURNING id
    `).run(caseId, req.user.id, 'case_share_revoked', `Dava paylaşımı kaldırıldı: ${share.name}`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single case (with client name + phone)
router.get('/:id', async (req, res) => {
  try {
    const stmt = await db.prepare(`
      SELECT c.*, cl.name as clientName, cl.phone as clientPhone, cl.email as clientEmail
      FROM cases c 
      LEFT JOIN clients cl ON c.clientId = cl.id
      WHERE c.id = ? AND c.userId = ?
    `);
    const caseItem = await stmt.get(req.params.id, req.user.id);
    if (!caseItem) return res.status(404).json({ error: 'Case not found' });
    res.json(caseItem);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// Assign or update client on a case
router.put('/:id/client', async (req, res) => {
  const caseId = parseRouteId(req.params.id);
  if (caseId === null) return res.status(400).json({ error: 'Invalid case ID' });
  const { name, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Client name is required' });
  try {
    // Get current case to see if a client already exists
    const caseItem = await db.prepare('SELECT clientId FROM cases WHERE id = ? AND userId = ?').get(caseId, req.user.id) as any;
    if (!caseItem) return res.status(404).json({ error: 'Case not found' });

    let clientId = caseItem.clientId;
    if (clientId) {
      // Update existing client
      const updateInfo = await db.prepare('UPDATE clients SET name = ?, phone = ?, email = ? WHERE id = ? AND userId = ?')
        .run(name, phone || null, email || null, clientId, req.user.id);
      
      // If the client was deleted but case still references it, create a new one
      if (updateInfo.changes === 0) {
        const info = await db.prepare('INSERT INTO clients (name, phone, email, userId, status) VALUES (?, ?, ?, ?, ?) RETURNING id') 
          .run(name, phone || null, email || null, req.user.id, 'active');
        clientId = info.lastInsertRowid;
        await db.prepare('UPDATE cases SET clientId = ? WHERE id = ? AND userId = ?').run(clientId, caseId, req.user.id);
      }
    } else {
      // Create new client and link to case
      const info = await db.prepare('INSERT INTO clients (name, phone, email, userId, status) VALUES (?, ?, ?, ?, ?) RETURNING id') 
        .run(name, phone || null, email || null, req.user.id, 'active');
      clientId = info.lastInsertRowid;
      await db.prepare('UPDATE cases SET clientId = ? WHERE id = ? AND userId = ?').run(clientId, caseId, req.user.id);
    }
    res.json({ success: true, clientId });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// Create case
router.post('/', validate(createCaseSchema), async (req, res) => {
  const { caseNo, title, court, clientId, type, clientName } = req.body;
  try {
    let finalClientId = clientId;
    if (!clientId && clientName) {
      const clientStmt = await db.prepare('INSERT INTO clients (name, userId) VALUES (?, ?) RETURNING id');
      const info = await clientStmt.run(clientName, req.user.id);
      finalClientId = info.lastInsertRowid;
    }

    const stmt = await db.prepare('INSERT INTO cases (caseNo, title, court, clientId, type, userId) VALUES (?, ?, ?, ?, ?, ?) RETURNING id');
    const info = await stmt.run(caseNo, title, court, finalClientId, type, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// Delete a case
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM caseActivity WHERE caseId = ?').run(id);
    await db.prepare('DELETE FROM caseShares WHERE caseId = ?').run(id);
    await db.prepare('DELETE FROM caseCollaborators WHERE caseId = ?').run(id);
    await db.prepare('DELETE FROM expenses WHERE caseId = ? AND userId = ?').run(id, req.user.id);
    await db.prepare('DELETE FROM hearings WHERE caseId = ? AND userId = ?').run(id, req.user.id);
    await db.prepare('DELETE FROM notes WHERE caseId = ? AND userId = ?').run(id, req.user.id);
    await db.prepare('DELETE FROM tasks WHERE caseId = ? AND userId = ?').run(id, req.user.id);
    await db.prepare('DELETE FROM documents WHERE caseId = ? AND userId = ?').run(id, req.user.id);
    await db.prepare('DELETE FROM messages WHERE caseId = ? AND userId = ?').run(id, req.user.id);
    const info = await db.prepare('DELETE FROM cases WHERE id = ? AND userId = ?').run(id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Case not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// Update a case
router.put('/:id', validate(updateCaseStatusSchema), async (req, res) => {
  const { status } = req.body;
  try {
    const info = await db.prepare('UPDATE cases SET status = ? WHERE id = ? AND userId = ?').run(status, req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Case not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// HEARINGS
router.get('/:id/hearings', async (req, res) => {
  try {
    const stmt = await db.prepare('SELECT * FROM hearings WHERE caseId = ? AND userId = ? ORDER BY date ASC, time ASC');
    res.json(await stmt.all(req.params.id, req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/:id/hearings', validate(createHearingSchema), async (req, res) => {
  const { title, date, time, location } = req.body;
  try {
    const stmt = await db.prepare('INSERT INTO hearings (caseId, title, date, time, location, userId) VALUES (?, ?, ?, ?, ?, ?) RETURNING id');
    const info = await stmt.run(req.params.id, title, date, time, location, req.user.id);
    // Log activity
    await db.prepare(`INSERT INTO caseActivity (caseId, userId, actionType, actionDesc) VALUES (?, ?, ?, ?) RETURNING id`).run(req.params.id, req.user.id, 'hearing_added', `Duruşma eklendi: ${title}`);
    const caseIdValue = parseRouteId(req.params.id);
    if (caseIdValue === null) return res.status(400).json({ error: 'Invalid case ID' });

    sendPushNotificationToCaseTeam(caseIdValue, 'Yeni Duruşma', `${title} başlıklı duruşma eklendi.`, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:caseId/hearings/:hearingId', async (req, res) => {
  try {
    const info = await db.prepare('DELETE FROM hearings WHERE id = ? AND caseId = ? AND userId = ?').run(req.params.hearingId, req.params.caseId, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Hearing not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// EXPENSES
router.get('/:id/expenses', async (req, res) => {
  try {
    const stmt = await db.prepare('SELECT * FROM expenses WHERE caseId = ? AND userId = ? ORDER BY id DESC');
    res.json(await stmt.all(req.params.id, req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/:id/expenses', validate(createExpenseSchema), async (req, res) => {
  const { title, amount, date, status, isCompanyExpense } = req.body;
  try {
    const stmt = await db.prepare('INSERT INTO expenses (caseId, title, amount, date, status, isCompanyExpense, userId) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id');
    const info = await stmt.run(req.params.id, title, amount, date, status || 'pending', isCompanyExpense ? 1 : 0, req.user.id);
    // Log activity
    await db.prepare(`INSERT INTO caseActivity (caseId, userId, actionType, actionDesc) VALUES (?, ?, ?, ?) RETURNING id`).run(req.params.id, req.user.id, 'expense_added', `Masraf eklendi: ${title} (₺${amount})`);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:caseId/expenses/:expenseId', async (req, res) => {
  try {
    const info = await db.prepare('DELETE FROM expenses WHERE id = ? AND caseId = ? AND userId = ?').run(req.params.expenseId, req.params.caseId, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// NOTES
router.get('/:id/notes', async (req, res) => {
  try {
    const stmt = await db.prepare('SELECT * FROM notes WHERE caseId = ? AND userId = ? ORDER BY id DESC');
    res.json(await stmt.all(req.params.id, req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/:id/notes', validate(createNoteSchema), async (req, res) => {
  const { title, content, date } = req.body;
  try {
    const info = await db.prepare('INSERT INTO notes (caseId, title, content, date, userId) VALUES (?, ?, ?, ?, ?) RETURNING id').run(req.params.id, title, content, date, req.user.id);
    // Log activity
    await db.prepare(`INSERT INTO caseActivity (caseId, userId, actionType, actionDesc) VALUES (?, ?, ?, ?) RETURNING id`).run(req.params.id, req.user.id, 'note_added', `Not eklendi: ${title}`);
    const caseIdValue = parseRouteId(req.params.id);
    if (caseIdValue === null) return res.status(400).json({ error: 'Invalid case ID' });

    sendPushNotificationToCaseTeam(caseIdValue, 'Yeni Not', `${title} başlıklı not eklendi.`, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:caseId/notes/:noteId', async (req, res) => {
  try {
    await db.prepare('DELETE FROM notes WHERE id = ? AND caseId = ? AND userId = ?').run(req.params.noteId, req.params.caseId, req.user.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// TASKS
router.get('/:id/tasks', async (req, res) => {
  try {
    // Delete tasks that were completed more than 12 hours ago
    await db.prepare(`
      DELETE FROM tasks 
      WHERE caseId = ? AND userId = ? 
        AND completed = 1 
        AND completedAt <= NOW() - INTERVAL '12 hours'
    `).run(req.params.id, req.user.id);
    
    // Delete overdue tasks that expired > 12 hours ago (i.e. next day at 12:00 PM)
    await db.prepare(`
      DELETE FROM tasks 
      WHERE caseId = ? AND userId = ? 
        AND completed = 0 
        AND date IS NOT NULL AND date != '' 
        AND NOW() >= (
          CASE 
            WHEN date ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$' 
            THEN (substr(date,7,4)||'-'||substr(date,4,2)||'-'||substr(date,1,2))::timestamp + INTERVAL '36 hours'
            ELSE date::timestamp + INTERVAL '36 hours'
          END
        )
    `).run(req.params.id, req.user.id);

    const stmt = await db.prepare('SELECT * FROM tasks WHERE caseId = ? AND userId = ? ORDER BY id DESC');
    res.json(await stmt.all(req.params.id, req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/:id/tasks', validate(createTaskSchema), async (req, res) => {
  const { title, date, priority } = req.body;
  try {
    const info = await db.prepare('INSERT INTO tasks (caseId, title, completed, date, priority, userId) VALUES (?, ?, ?, ?, ?, ?) RETURNING id').run(req.params.id, title, 0, date, priority || 'normal', req.user.id);
    // Log activity
    await db.prepare(`INSERT INTO caseActivity (caseId, userId, actionType, actionDesc) VALUES (?, ?, ?, ?) RETURNING id`).run(req.params.id, req.user.id, 'task_added', `Görev eklendi: ${title}`);
    const caseIdValue = parseRouteId(req.params.id);
    if (caseIdValue === null) return res.status(400).json({ error: 'Invalid case ID' });

    sendPushNotificationToCaseTeam(caseIdValue, 'Yeni Görev', `${title} başlıklı görev eklendi.`, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:caseId/tasks/:taskId', async (req, res) => {
  const { completed } = req.body;
  try {
    const taskInfo = await db.prepare('SELECT title FROM tasks WHERE id = ? AND caseId = ? AND userId = ?').get(req.params.taskId, req.params.caseId, req.user.id) as any;
    
    if (completed) {
      await db.prepare('UPDATE tasks SET completed = 1, completedAt = CURRENT_TIMESTAMP WHERE id = ? AND caseId = ? AND userId = ?').run(req.params.taskId, req.params.caseId, req.user.id);
    } else {
      await db.prepare('UPDATE tasks SET completed = 0, completedAt = NULL WHERE id = ? AND caseId = ? AND userId = ?').run(req.params.taskId, req.params.caseId, req.user.id);
    }

    // Log activity
    const action = completed ? 'Görev tamamlandı' : 'Görev açıldı';
    await db.prepare(`INSERT INTO caseActivity (caseId, userId, actionType, actionDesc) VALUES (?, ?, ?, ?) RETURNING id`).run(req.params.caseId, req.user.id, 'task_updated', `${action}: ${taskInfo?.title || 'Görev'}`);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:caseId/tasks/:taskId', async (req, res) => {
  try {
    await db.prepare('DELETE FROM tasks WHERE id = ? AND caseId = ? AND userId = ?').run(req.params.taskId, req.params.caseId, req.user.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    // Convert from latin1 to utf8 to support Turkish characters properly in multer
    const utf8Name = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeName = utf8Name.replace(/[^a-zA-Z0-9.\-_]/g, '_'); // Extra safety against weird characters
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + safeName);
  }
});
const upload = multer({ storage });

// DOCUMENTS
router.get('/:id/documents', async (req, res) => {
  try {
    const stmt = await db.prepare('SELECT * FROM documents WHERE caseId = ? AND userId = ? ORDER BY id DESC');
    res.json(await stmt.all(req.params.id, req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/:id/documents', upload.single('file'), async (req, res) => {
  const { title, size, type, date, uploaderName } = req.body;
  const filePath = req.file ? req.file.filename : null;

  try {
    const info = await db.prepare('INSERT INTO documents (caseId, title, size, type, date, uploaderName, filePath, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id').run(
      req.params.id, title, size, type, date, uploaderName, filePath, req.user.id
    );
    // Log activity
    await db.prepare(`INSERT INTO caseActivity (caseId, userId, actionType, actionDesc) VALUES (?, ?, ?, ?) RETURNING id`).run(req.params.id, req.user.id, 'document_uploaded', `Belge yüklendi: ${title}`);
    const caseIdValue = parseRouteId(req.params.id);
    if (caseIdValue === null) return res.status(400).json({ error: 'Invalid case ID' });

    sendPushNotificationToCaseTeam(caseIdValue, 'Yeni Belge', `${title} adlı belge eklendi.`, req.user.id);
    res.json({ id: info.lastInsertRowid, filePath });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:caseId/documents/:docId', async (req, res) => {
  try {
    await db.prepare('DELETE FROM documents WHERE id = ? AND caseId = ? AND userId = ?').run(req.params.docId, req.params.caseId, req.user.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// MESSAGES
router.get('/:id/messages', async (req, res) => {
  try {
    const stmt = await db.prepare('SELECT * FROM messages WHERE caseId = ? AND userId = ? ORDER BY id ASC');
    res.json(await stmt.all(req.params.id, req.user.id));
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/:id/messages', async (req, res) => {
  const { sender, text, time, type, isMe } = req.body;
  try {
    const info = await db.prepare('INSERT INTO messages (caseId, sender, text, time, type, isMe, userId) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id').run(req.params.id, sender, text, time, type, isMe ? 1 : 0, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
