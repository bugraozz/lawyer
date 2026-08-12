import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';

const router = Router();
const JWT_SECRET = 'super_secret_lex_architect_key_change_in_prod';

// Helper: Generate invitation code
const generateCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const generateResetCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// REGISTER with invitation code
router.post('/register', async (req, res) => {
  const { name, email, phone, barNo, password, invitationCode } = req.body;
  try {
    // Check invitation code
    // Check invitation code
    const inviteStmt = await db.prepare("SELECT * FROM invitationCodes WHERE code = ? AND used = 0 AND email = ? AND expiresAt > ?");
    const invite = await inviteStmt.get(invitationCode, email, new Date().toISOString()) as any;
    
    if (!invite) {
      return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş davetiye kodu' });
    }

    // Check if email already registered
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Bu email zaten kayıtlı' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = await db.prepare(`
      INSERT INTO users (name, email, phone, barNo, password, role, status, companyId, createdAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) RETURNING id
    `);
    const info = await stmt.run(name, email, phone, barNo, hashedPassword, 'lawyer', 'pending', 1);
    
    // Mark invitation as used
    await db.prepare('UPDATE invitationCodes SET used = 1, usedBy = ? WHERE id = ?').run(info.lastInsertRowid, invite.id);

    // Log audit
    await db.prepare('INSERT INTO auditLog (userId, action, details) VALUES (?, ?, ?) RETURNING id').run(
      info.lastInsertRowid, 'user_registered', `Kayıt yapıldı: ${name}`
    );

    res.json({ 
      message: 'Hesap oluşturuldu, admin onayı bekleniyor',
      userId: info.lastInsertRowid,
      status: 'pending'
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

// LOGIN - only approved users
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const stmt = await db.prepare('SELECT * FROM users WHERE email = ?');
    const user = await stmt.get(email) as any;
    
    if (!user) {
      return res.status(400).json({ error: 'Geçersiz kimlik bilgileri' });
    }

    // Check if approved
    if (user.status !== 'approved') {
      return res.status(403).json({ error: `Hesap durumu: ${user.status}. Admin onayı beklemektedir.` });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Geçersiz kimlik bilgileri' });
    }
    
    // Update lastLogin
    await db.prepare("UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);

    // Log audit
    await db.prepare('INSERT INTO auditLog (userId, action, details) VALUES (?, ?, ?) RETURNING id').run(
      user.id, 'login', `Giriş yapıldı`
    );

    const token = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      companyId: user.companyId,
      role: user.role 
    }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        companyId: user.companyId,
        role: user.role
      } 
    });
  } catch (error) {
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

// REQUEST password reset code
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'E-posta adresi gerekli' });
  }

  try {
    const user = await db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email) as any;

    if (!user) {
      return res.status(404).json({ error: 'Bu e-posta ile kayıtlı kullanıcı bulunamadı' });
    }

    await db.prepare('DELETE FROM passwordResetTokens WHERE userId = ?').run(user.id);

    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await db.prepare(`
      INSERT INTO passwordResetTokens (userId, code, expiresAt)
      VALUES (?, ?, ?) RETURNING id
    `).run(user.id, code, expiresAt);

    res.json({
      success: true,
      message: 'Şifre sıfırlama kodu oluşturuldu.',
      resetCode: code,
      expiresAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

// RESET password with code
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalıdır' });
  }

  try {
    const user = await db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;

    if (!user) {
      return res.status(404).json({ error: 'Bu e-posta ile kayıtlı kullanıcı bulunamadı' });
    }

    const resetToken = await db.prepare(`
      SELECT id, code, expiresAt, used
      FROM passwordResetTokens
      WHERE userId = ? AND code = ? AND used = 0 AND expiresAt > ?
      ORDER BY id DESC
      LIMIT 1
    `).get(user.id, code, new Date().toISOString()) as any;

    if (!resetToken) {
      return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş sıfırlama kodu' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);
    await db.prepare('UPDATE passwordResetTokens SET used = 1 WHERE id = ?').run(resetToken.id);
    await db.prepare('DELETE FROM passwordResetTokens WHERE userId = ? AND used = 1').run(user.id);

    await db.prepare('INSERT INTO auditLog (userId, action, details) VALUES (?, ?, ?) RETURNING id').run(
      user.id,
      'password_reset',
      'Şifre sıfırlandı'
    );

    res.json({ success: true, message: 'Şifreniz güncellendi' });
  } catch (error) {
    res.status(500).json({ error: 'İç sunucu hatası' });
  }
});

export default router;
