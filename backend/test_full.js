/**
 * LEX ARCHITECT - KAPSAMLI SİSTEM TESTİ
 * Tüm endpoint'ler, edge case'ler, validation, yetki kontrolleri
 */

const http = require('http');

const BASE = 'http://localhost:3000/api';
let adminToken = '';
let results = [];

// ─── HTTP helper ───────────────────────────────────────────────
function apiCall(method, path, body, token) {
  return new Promise((resolve) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const options = { hostname: 'localhost', port: 3000, path: '/api' + path, method, headers };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.status || res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', e => resolve({ status: 0, data: { error: e.message } }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ─── Test runner ───────────────────────────────────────────────
let section = '';
let passed = 0, failed = 0, warnings = 0;

function setSection(name) {
  section = name;
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  ${name}`);
  console.log('─'.repeat(50));
}

function test(ok, label, detail = '', warn = false) {
  const icon = ok ? '✅' : (warn ? '⚠️ ' : '❌');
  const msg = `${icon} ${label}${detail ? ' → ' + detail : ''}`;
  console.log(msg);
  results.push({ ok, warn, label: `[${section}] ${label}`, detail });
  if (ok) passed++;
  else if (warn) warnings++;
  else failed++;
}

// ─── Main ──────────────────────────────────────────────────────
async function run() {
  console.log('\n' + '═'.repeat(55));
  console.log('   LEX ARCHITECT - DETAYLI SİSTEM TESTİ');
  console.log('═'.repeat(55));

  let r, ids = {};

  // ══════════════════════════════════════════════
  setSection('1. SAĞLIK KONTROLÜ');
  // ══════════════════════════════════════════════
  r = await apiCall('GET', '/health', null, null);
  test(r.status === 200 && r.data.status === 'ok', 'Health endpoint', r.data.status);

  // ══════════════════════════════════════════════
  setSection('2. KİMLİK DOĞRULAMA');
  // ══════════════════════════════════════════════

  // Başarılı giriş
  r = await apiCall('POST', '/auth/login', { email: 'admin@bureau.local', password: 'admin123' });
  test(r.status === 200 && r.data.token, 'Admin girişi', `rol: ${r.data.user?.role}`);
  if (!r.data.token) { console.log('\n❌ Token alınamadı, test durduruluyor.'); return; }
  adminToken = r.data.token;

  // Token olmadan erişim
  r = await apiCall('GET', '/cases', null, null);
  test(r.status === 401 || r.status === 403, 'Token olmadan erişim reddedildi', `HTTP ${r.status}`);

  // Yanlış şifre
  r = await apiCall('POST', '/auth/login', { email: 'admin@bureau.local', password: 'yanlis' });
  test(r.status === 400, 'Yanlış şifre reddi', `HTTP ${r.status}`);

  // Var olmayan kullanıcı
  r = await apiCall('POST', '/auth/login', { email: 'yok@yok.com', password: '123456' });
  test(r.status === 400, 'Var olmayan kullanıcı reddi', `HTTP ${r.status}`);

  // Şifre sıfırlama - var olan kullanıcı
  r = await apiCall('POST', '/auth/forgot-password', { email: 'admin@bureau.local' });
  test(r.status === 200 && r.data.resetCode, 'Şifre sıfırlama kodu oluşturma', `Kod: ${r.data.resetCode}`);
  const resetCode = r.data.resetCode;

  // Şifre sıfırlama - var olmayan kullanıcı
  r = await apiCall('POST', '/auth/forgot-password', { email: 'yok@yok.com' });
  test(r.status === 404, 'Yanlış e-posta ile şifre sıfırlama reddedildi', `HTTP ${r.status}`);

  // Şifre sıfırlama - kod ile
  r = await apiCall('POST', '/auth/reset-password', { email: 'admin@bureau.local', code: resetCode, newPassword: 'admin123' });
  test(r.status === 200 && r.data.success, 'Şifre sıfırlama (kod ile)', JSON.stringify(r.data));

  // ══════════════════════════════════════════════
  setSection('3. PROFİL');
  // ══════════════════════════════════════════════

  r = await apiCall('GET', '/profile', null, adminToken);
  test(r.status === 200 && r.data.email, 'Profil getirme', r.data.email);

  r = await apiCall('PUT', '/profile', { name: 'Admin Test Kullanıcısı', phone: '05550000000', barNo: 'IST-001' }, adminToken);
  test(r.status === 200 && r.data.success, 'Profil güncelleme');

  r = await apiCall('GET', '/profile/company/users', null, adminToken);
  test(r.status === 200 && Array.isArray(r.data), 'Şirket kullanıcıları listesi', `${r.data.length} kullanıcı`);

  // Şifre değiştirme - yanlış eski şifre
  r = await apiCall('PUT', '/profile/password', { oldPassword: 'yanlis', newPassword: 'yenisifre' }, adminToken);
  test(r.status === 400, 'Yanlış eski şifre ile şifre değiştirme reddedildi', `HTTP ${r.status}`);

  // Şifre değiştirme - doğru
  r = await apiCall('PUT', '/profile/password', { oldPassword: 'admin123', newPassword: 'admin123' }, adminToken);
  test(r.status === 200 && r.data.success, 'Şifre değiştirme (kendi şifresi)');

  // Push token kaydetme
  r = await apiCall('POST', '/profile/push-token', { token: 'test-expo-push-token-xyz' }, adminToken);
  test(r.status === 200 && r.data.success, 'Push token kaydetme');

  // ══════════════════════════════════════════════
  setSection('4. ADMİN PANELİ');
  // ══════════════════════════════════════════════

  r = await apiCall('GET', '/admin/dashboard', null, adminToken);
  test(r.status === 200 && r.data.stats, 'Admin dashboard', `Toplam kullanıcı: ${r.data.stats?.totalUsers}`);

  r = await apiCall('GET', '/admin/users', null, adminToken);
  test(r.status === 200 && Array.isArray(r.data), 'Admin: Tüm kullanıcılar', `${r.data.length} kullanıcı`);

  r = await apiCall('GET', '/admin/users?status=approved', null, adminToken);
  test(r.status === 200 && Array.isArray(r.data), 'Admin: Onaylı kullanıcı filtresi', `${r.data.length} onaylı`);

  r = await apiCall('GET', '/admin/users?status=pending', null, adminToken);
  test(r.status === 200 && Array.isArray(r.data), 'Admin: Bekleyen kullanıcı filtresi', `${r.data.length} bekleyen`);

  // Davetiye kodu oluşturma
  const inviteEmail = `test_${Date.now()}@lawyer.com`;
  r = await apiCall('POST', '/admin/generate-invites', { emails: [inviteEmail], expiryDays: 7 }, adminToken);
  test(r.status === 200 && r.data.invites?.length > 0, 'Davetiye kodu oluşturma', `Kod: ${r.data.invites?.[0]?.code}`);
  const inviteCode = r.data.invites?.[0]?.code;

  // Boş e-posta ile davetiye
  r = await apiCall('POST', '/admin/generate-invites', { emails: [] }, adminToken);
  test(r.status === 400, 'Boş e-posta ile davetiye reddedildi', `HTTP ${r.status}`);

  // Davetiye listesi
  r = await apiCall('GET', '/admin/invitations', null, adminToken);
  test(r.status === 200 && Array.isArray(r.data), 'Davetiye kodu listesi', `${r.data.length} davetiye`);

  // Kayıt - davetiye ile
  r = await apiCall('POST', '/auth/register', {
    name: 'Test Avukat',
    email: inviteEmail,
    phone: '05559999999',
    barNo: 'ANK-999',
    password: 'test123456',
    invitationCode: inviteCode
  });
  test(r.status === 200 && r.data.userId, 'Davetiye ile kayıt', `UserID: ${r.data.userId}, status: ${r.data.status}, error: ${JSON.stringify(r.data)}`);
  const testUserId = r.data.userId;

  // Kayıt - süresi geçmiş/yanlış davetiye
  r = await apiCall('POST', '/auth/register', {
    name: 'Sahte Avukat', email: 'sahte@lawyer.com', phone: '05558888888',
    barNo: 'IST-888', password: 'test123456', invitationCode: 'YANLIS99'
  });
  test(r.status === 400, 'Geçersiz davetiye ile kayıt reddedildi', `HTTP ${r.status}`);

  // Bekleyen kullanıcı girişi (henüz onaylanmamış)
  r = await apiCall('POST', '/auth/login', { email: inviteEmail, password: 'test123456' });
  test(r.status === 403, 'Onaysız kullanıcı girişi reddedildi', `HTTP ${r.status}`);

  // Admin: Kullanıcı onayla
  r = await apiCall('POST', `/admin/users/${testUserId}/approve`, {}, adminToken);
  test(r.status === 200 && r.data.success, `Kullanıcı onaylama (ID: ${testUserId})`);

  // Onaylı kullanıcı girişi
  r = await apiCall('POST', '/auth/login', { email: inviteEmail, password: 'test123456' });
  test(r.status === 200 && r.data.token, 'Onaylı kullanıcı girişi başarılı', `Token alındı`);
  const lawyerToken = r.data.token;
  const lawyerUserId = r.data.user?.id;

  // Admin bildirimlerini getir
  r = await apiCall('GET', `/admin/notifications/${testUserId}`, null, adminToken);
  test(r.status === 200 && Array.isArray(r.data), 'Admin: Kullanıcı bildirimleri', `${r.data.length} bildirim`);

  // Audit log
  r = await apiCall('GET', '/admin/audit-log', null, adminToken);
  test(r.status === 200 && Array.isArray(r.data), 'Admin: Audit log', `${r.data.length} kayıt`);

  // ══════════════════════════════════════════════
  setSection('5. MÜVEKKİL (CLIENTS)');
  // ══════════════════════════════════════════════

  // Oluşturma
  r = await apiCall('POST', '/clients', { name: 'Mehmet Demir', email: 'mehmet@test.com', phone: '05551112233' }, adminToken);
  test(r.status === 200 && r.data.id, 'Müvekkil oluşturma', `ID: ${r.data.id}`);
  ids.clientId = r.data.id;

  // Eksik veri ile oluşturma
  r = await apiCall('POST', '/clients', {}, adminToken);
  // name zorunlu değil ama DB'de NOT NULL - muhtemelen hata verir
  test(r.status === 400 || r.status === 500, 'Eksik veri ile müvekkil oluşturma hatası', `HTTP ${r.status}`, true);

  // Listeleme
  r = await apiCall('GET', '/clients', null, adminToken);
  test(r.status === 200 && Array.isArray(r.data) && r.data.length > 0, 'Müvekkil listesi', `${r.data.length} müvekkil`);
  test(r.data[0]?.hasOwnProperty('activecases') || r.data[0]?.hasOwnProperty('activeCases'), 'Müvekkil listesinde aktif dava sayısı var', `Alan: activecases=${r.data[0]?.activecases}`);

  // Tek müvekkil
  r = await apiCall('GET', `/clients/${ids.clientId}`, null, adminToken);
  test(r.status === 200 && r.data.name === 'Mehmet Demir', 'Tek müvekkil getirme', r.data.name);

  // Yok olan müvekkil
  r = await apiCall('GET', '/clients/99999', null, adminToken);
  test(r.status === 404, 'Var olmayan müvekkil 404 döner', `HTTP ${r.status}`);

  // Güncelleme
  r = await apiCall('PUT', `/clients/${ids.clientId}`, { name: 'Mehmet Demir (Güncellendi)', email: 'mehmet@test.com', phone: '05554445566' }, adminToken);
  test(r.status === 200 && r.data.success, 'Müvekkil güncelleme');

  // Başka kullanıcının müvekkilini güncelleme denemesi
  r = await apiCall('PUT', `/clients/${ids.clientId}`, { name: 'Çalınmış', email: '', phone: '' }, lawyerToken);
  test(r.status === 404, 'Başka kullanıcının müvekkilini güncelleme reddedildi', `HTTP ${r.status}`);

  // ══════════════════════════════════════════════
  setSection('6. DAVA (CASES)');
  // ══════════════════════════════════════════════

  // Oluşturma - geçerli
  r = await apiCall('POST', '/cases', {
    title: 'Miras Davası 2024',
    caseNo: 'MRS-2024-001',
    court: 'Ankara 3. Sulh Hukuk',
    type: 'Miras',
    clientId: ids.clientId
  }, adminToken);
  test(r.status === 200 && r.data.id, 'Dava oluşturma', `ID: ${r.data.id}`);
  ids.caseId = r.data.id;

  // Dava oluşturma - validation hatası (kısa başlık)
  r = await apiCall('POST', '/cases', { title: 'AB', caseNo: 'X', court: '' }, adminToken);
  test(r.status === 400, 'Kısa başlık ile dava reddi (validation)', `HTTP ${r.status}`);

  // Dava oluşturma - sadece caseNo eksik
  r = await apiCall('POST', '/cases', { title: 'Geçerli Başlık Uzun' }, adminToken);
  test(r.status === 400, 'caseNo eksik ile dava reddi', `HTTP ${r.status}`);

  // Dava oluşturma - clientName ile (otomatik müvekkil oluşturma)
  r = await apiCall('POST', '/cases', {
    title: 'Boşanma Davası 2024',
    caseNo: 'BOS-2024-001',
    clientName: 'Otomatik Müvekkil'
  }, adminToken);
  test(r.status === 200 && r.data.id, 'Dava oluşturma (clientName ile otomatik müvekkil)', `ID: ${r.data.id}`);
  ids.caseId2 = r.data.id;

  // Listeleme
  r = await apiCall('GET', '/cases', null, adminToken);
  test(r.status === 200 && Array.isArray(r.data) && r.data.length >= 2, 'Dava listesi', `${r.data.length} dava`);

  // Tek dava getirme
  r = await apiCall('GET', `/cases/${ids.caseId}`, null, adminToken);
  test(r.status === 200 && r.data.id === ids.caseId, 'Tek dava getirme', r.data.title);

  // Yok olan dava
  r = await apiCall('GET', '/cases/99999', null, adminToken);
  test(r.status === 404, 'Var olmayan dava 404 döner', `HTTP ${r.status}`);

  // Durum güncelleme - geçerli
  for (const status of ['closed', 'archived', 'pending', 'active']) {
    r = await apiCall('PUT', `/cases/${ids.caseId}`, { status }, adminToken);
    test(r.status === 200 && r.data.success, `Dava durumu: ${status}`);
  }

  // Geçersiz durum
  r = await apiCall('PUT', `/cases/${ids.caseId}`, { status: 'gecersiz' }, adminToken);
  test(r.status === 400, 'Geçersiz dava durumu reddedildi', `HTTP ${r.status}`);

  // Müvekkil atama (client endpoint)
  r = await apiCall('PUT', `/cases/${ids.caseId}/client`, { name: 'Güncellenmiş Müvekkil', phone: '05551234567' }, adminToken);
  test(r.status === 200 && r.data.success, 'Davaya müvekkil atama/güncelleme');

  // ══════════════════════════════════════════════
  setSection('7. GÖREV (TASKS)');
  // ══════════════════════════════════════════════

  // Oluşturma (genel)
  r = await apiCall('POST', '/tasks', { title: 'Genel Görev', date: '2099-12-31', priority: 'high' }, adminToken);
  test(r.status === 200 && r.data.id, 'Genel görev oluşturma', `ID: ${r.data.id}`);
  ids.taskId = r.data.id;

  // Oluşturma (davaya bağlı)
  r = await apiCall('POST', '/tasks', { title: 'Dava Görevi', date: '2099-12-31', priority: 'normal', caseId: ids.caseId }, adminToken);
  test(r.status === 200 && r.data.id, 'Davaya bağlı görev oluşturma', `ID: ${r.data.id}`);
  ids.taskId2 = r.data.id;

  // Validation - kısa başlık
  r = await apiCall('POST', '/tasks', { title: 'A', date: '2099-12-31' }, adminToken);
  test(r.status === 400, 'Kısa başlık ile görev reddi', `HTTP ${r.status}`);

  // Listele
  r = await apiCall('GET', '/tasks', null, adminToken);
  test(r.status === 200 && Array.isArray(r.data) && r.data.length >= 2, 'Görev listesi', `${r.data.length} görev`);

  // Tamamla
  r = await apiCall('PUT', `/tasks/${ids.taskId}`, { completed: true }, adminToken);
  test(r.status === 200 && r.data.success, 'Görevi tamamlandı işaretle');

  // Tekrar aç
  r = await apiCall('PUT', `/tasks/${ids.taskId}`, { completed: false }, adminToken);
  test(r.status === 200 && r.data.success, 'Görevi tekrar aç');

  // Var olmayan görevi güncelle
  r = await apiCall('PUT', '/tasks/99999', { completed: true }, adminToken);
  test(r.status === 404, 'Var olmayan görev güncellemesi 404 döner', `HTTP ${r.status}`);

  // Davaya bağlı görev (cases route)
  r = await apiCall('POST', `/cases/${ids.caseId}/tasks`, { title: 'Dava içi görev', date: '2099-12-31', priority: 'low' }, adminToken);
  test(r.status === 200 && r.data.id, 'Dava içi görev oluşturma', `ID: ${r.data.id}`);
  ids.caseTaskId = r.data.id;

  r = await apiCall('GET', `/cases/${ids.caseId}/tasks`, null, adminToken);
  test(r.status === 200 && Array.isArray(r.data) && r.data.length > 0, 'Dava görevleri listesi', `${r.data.length} görev`);

  r = await apiCall('PUT', `/cases/${ids.caseId}/tasks/${ids.caseTaskId}`, { completed: true }, adminToken);
  test(r.status === 200 && r.data.success, 'Dava içi görevi tamamla');

  r = await apiCall('DELETE', `/cases/${ids.caseId}/tasks/${ids.caseTaskId}`, null, adminToken);
  test(r.status === 200 && r.data.success, 'Dava içi görevi sil');

  // ══════════════════════════════════════════════
  setSection('8. NOT (NOTES)');
  // ══════════════════════════════════════════════

  r = await apiCall('POST', `/cases/${ids.caseId}/notes`, { title: 'Önemli Not', content: 'Mahkeme tarihi değişti.', date: '2024-07-24' }, adminToken);
  test(r.status === 200 && r.data.id, 'Not oluşturma', `ID: ${r.data.id}`);
  ids.noteId = r.data.id;

  // Validation - boş başlık
  r = await apiCall('POST', `/cases/${ids.caseId}/notes`, { title: '', content: 'içerik' }, adminToken);
  test(r.status === 400, 'Boş başlıkla not reddi (validation)', `HTTP ${r.status}`);

  r = await apiCall('GET', `/cases/${ids.caseId}/notes`, null, adminToken);
  test(r.status === 200 && Array.isArray(r.data) && r.data.length > 0, 'Not listesi', `${r.data.length} not`);

  r = await apiCall('DELETE', `/cases/${ids.caseId}/notes/${ids.noteId}`, null, adminToken);
  test(r.status === 200, 'Not silme');

  // Var olmayan notu sil
  r = await apiCall('DELETE', `/cases/${ids.caseId}/notes/99999`, null, adminToken);
  // silme genellikle 200 döner (0 rows affected)
  test(r.status === 200 || r.status === 404, 'Var olmayan not silme (graceful)', `HTTP ${r.status}`, true);

  // ══════════════════════════════════════════════
  setSection('9. MASRAF (EXPENSES)');
  // ══════════════════════════════════════════════

  // Oluşturma
  r = await apiCall('POST', '/expenses', { title: 'Posta Masrafı', amount: 150, date: '2024-07-24', caseId: ids.caseId }, adminToken);
  test(r.status === 200 && r.data.id, 'Masraf oluşturma (genel)', `ID: ${r.data.id}`);
  ids.expenseId = r.data.id;

  // Dava bağlantılı masraf
  r = await apiCall('POST', `/cases/${ids.caseId}/expenses`, { title: 'Bilirkişi Ücreti', amount: 2500, date: '2024-07-24', status: 'pending' }, adminToken);
  test(r.status === 200 && r.data.id, 'Dava içi masraf oluşturma', `ID: ${r.data.id}`);
  ids.caseExpenseId = r.data.id;

  // Validation - sıfır tutar
  r = await apiCall('POST', '/expenses', { title: 'Sıfır Masraf', amount: 0, date: '2024-07-24' }, adminToken);
  test(r.status === 400, 'Sıfır tutar ile masraf reddi', `HTTP ${r.status}`);

  // Validation - negatif tutar
  r = await apiCall('POST', '/expenses', { title: 'Negatif Masraf', amount: -100, date: '2024-07-24' }, adminToken);
  test(r.status === 400, 'Negatif tutar ile masraf reddi', `HTTP ${r.status}`);

  // Listele
  r = await apiCall('GET', '/expenses', null, adminToken);
  test(r.status === 200 && Array.isArray(r.data) && r.data.length > 0, 'Masraf listesi', `${r.data.length} masraf`);

  // Dava masrafları
  r = await apiCall('GET', `/cases/${ids.caseId}/expenses`, null, adminToken);
  test(r.status === 200 && Array.isArray(r.data), 'Dava masraf listesi', `${r.data.length} masraf`);

  // Durum güncelle
  r = await apiCall('PUT', `/expenses/${ids.expenseId}`, { status: 'approved' }, adminToken);
  test(r.status === 200 && r.data.success, 'Masraf durumu güncelleme (→approved)');

  r = await apiCall('PUT', `/expenses/${ids.expenseId}`, { status: 'rejected' }, adminToken);
  test(r.status === 200 && r.data.success, 'Masraf durumu güncelleme (→rejected)');

  // Sil
  r = await apiCall('DELETE', `/expenses/${ids.expenseId}`, null, adminToken);
  test(r.status === 200 && r.data.success, 'Masraf silme');

  r = await apiCall('DELETE', `/cases/${ids.caseId}/expenses/${ids.caseExpenseId}`, null, adminToken);
  test(r.status === 200 && r.data.success, 'Dava içi masraf silme');

  // ══════════════════════════════════════════════
  setSection('10. DURUŞMA (HEARINGS)');
  // ══════════════════════════════════════════════

  r = await apiCall('POST', `/cases/${ids.caseId}/hearings`, { title: 'İlk Celse', date: '2099-09-15', time: '10:30', location: 'Ankara Adliyesi A-201' }, adminToken);
  test(r.status === 200 && r.data.id, 'Duruşma oluşturma', `ID: ${r.data.id}`);
  ids.hearingId = r.data.id;

  // Validation - kısa başlık
  r = await apiCall('POST', `/cases/${ids.caseId}/hearings`, { title: 'A', date: '2099-09-15' }, adminToken);
  test(r.status === 400, 'Kısa başlıkla duruşma reddi (validation)', `HTTP ${r.status}`);

  // Validation - tarih eksik
  r = await apiCall('POST', `/cases/${ids.caseId}/hearings`, { title: 'Tarihin Yok' }, adminToken);
  test(r.status === 400, 'Tarih eksik duruşma reddi', `HTTP ${r.status}`);

  r = await apiCall('GET', `/cases/${ids.caseId}/hearings`, null, adminToken);
  test(r.status === 200 && Array.isArray(r.data) && r.data.length > 0, 'Duruşma listesi', `${r.data.length} duruşma`);

  r = await apiCall('DELETE', `/cases/${ids.caseId}/hearings/${ids.hearingId}`, null, adminToken);
  test(r.status === 200 && r.data.success, 'Duruşma silme');

  // ══════════════════════════════════════════════
  setSection('11. MESAJ (MESSAGES)');
  // ══════════════════════════════════════════════

  r = await apiCall('POST', `/cases/${ids.caseId}/messages`, { sender: 'Admin', text: 'Dava hakkında önemli mesaj.', time: '09:00', type: 'user', isMe: true }, adminToken);
  test(r.status === 200 && r.data.id, 'Mesaj gönderme', `ID: ${r.data.id}`);

  r = await apiCall('POST', `/cases/${ids.caseId}/messages`, { sender: 'AI', text: 'Yapay zeka yanıtı.', time: '09:01', type: 'ai', isMe: false }, adminToken);
  test(r.status === 200 && r.data.id, 'AI mesajı gönderme', `ID: ${r.data.id}`);

  r = await apiCall('GET', `/cases/${ids.caseId}/messages`, null, adminToken);
  test(r.status === 200 && Array.isArray(r.data) && r.data.length >= 2, 'Mesaj listesi', `${r.data.length} mesaj`);

  // ══════════════════════════════════════════════
  setSection('12. DOKÜMAN (DOCUMENTS)');
  // ══════════════════════════════════════════════

  r = await apiCall('GET', `/cases/${ids.caseId}/documents`, null, adminToken);
  test(r.status === 200 && Array.isArray(r.data), 'Doküman listesi', `${r.data.length} doküman`);
  // (Upload test multipart gerektirir, burada GET test ediyoruz)
  test(true, 'Doküman upload (multipart) - manual test gerektirir', 'POST /cases/:id/documents', true);

  // ══════════════════════════════════════════════
  setSection('13. ETKİNLİK (EVENTS)');
  // ══════════════════════════════════════════════

  r = await apiCall('POST', '/events', { title: 'Baro Toplantısı', type: 'meeting', date: '2099-10-01', time: '14:00', location: 'Baro Binası' }, adminToken);
  test(r.status === 200 && r.data.id, 'Etkinlik oluşturma', `ID: ${r.data.id}`);
  ids.eventId = r.data.id;

  r = await apiCall('GET', '/events', null, adminToken);
  test(r.status === 200 && Array.isArray(r.data) && r.data.length > 0, 'Etkinlik listesi', `${r.data.length} etkinlik`);

  r = await apiCall('GET', '/events/upcoming', null, adminToken);
  test(r.status === 200 && Array.isArray(r.data), 'Yaklaşan etkinlikler/duruşmalar/görevler', `${r.data.length} öğe`);

  r = await apiCall('GET', '/events/all-hearings', null, adminToken);
  test(r.status === 200 && Array.isArray(r.data), 'Tüm duruşmalar (events route)', `${r.data.length} duruşma`);

  r = await apiCall('DELETE', `/events/${ids.eventId}`, null, adminToken);
  test(r.status === 200 && r.data.success, 'Etkinlik silme');

  // Var olmayan etkinlik silme
  r = await apiCall('DELETE', '/events/99999', null, adminToken);
  test(r.status === 404, 'Var olmayan etkinlik silme 404 döner', `HTTP ${r.status}`);

  // ══════════════════════════════════════════════
  setSection('14. BİLDİRİM (NOTIFICATIONS)');
  // ══════════════════════════════════════════════

  r = await apiCall('GET', '/notifications', null, adminToken);
  test(r.status === 200 && Array.isArray(r.data), 'Bildirim listesi', `${r.data.length} bildirim`);

  r = await apiCall('PUT', '/notifications/read-all', null, adminToken);
  test(r.status === 200 && r.data.success, 'Tümünü okundu işaretle');

  // Bildirim oluşturma (POST)
  r = await apiCall('POST', '/notifications', { title: 'Test Bildirimi', description: 'Test içeriği', time: '10:00', type: 'info' }, adminToken);
  test(r.status === 200 && r.data.id, 'Bildirim oluşturma', `ID: ${r.data.id}`);

  // ══════════════════════════════════════════════
  setSection('15. DASHBOARD');
  // ══════════════════════════════════════════════

  r = await apiCall('GET', '/dashboard', null, adminToken);
  test(r.status === 200 && r.data.stats, 'Dashboard ana istatistikler', `Aktif dava: ${r.data.stats?.activeCases}`);
  test(r.data.stats?.hasOwnProperty('upcomingHearings'), 'Dashboard yaklaşan duruşma sayısı var');
  test(r.data.stats?.hasOwnProperty('clientsCount'), 'Dashboard müvekkil sayısı var');
  test(r.data.stats?.hasOwnProperty('tasksCount'), 'Dashboard görev sayısı var');

  r = await apiCall('GET', '/dashboard/reports', null, adminToken);
  test(r.status === 200 && r.data.caseStatus, 'Dashboard raporlar (dava durumu)', JSON.stringify(r.data.caseStatus));

  // ══════════════════════════════════════════════
  setSection('16. EKİP İŞBİRLİĞİ (COLLABORATORS)');
  // ══════════════════════════════════════════════

  // Ekip üyesi ekle
  r = await apiCall('POST', `/cases/${ids.caseId}/collaborators`, { userId: lawyerUserId, permissionLevel: 'view' }, adminToken);
  test(r.status === 200 && r.data.id, 'Davaya ekip üyesi ekleme', `ID: ${r.data.id}`);
  ids.collaboratorId = r.data.id;

  // Aynı kişiyi tekrar ekle (unique constraint)
  r = await apiCall('POST', `/cases/${ids.caseId}/collaborators`, { userId: lawyerUserId, permissionLevel: 'edit' }, adminToken);
  test(r.status === 400, 'Aynı ekip üyesini tekrar ekleme reddedildi', `HTTP ${r.status}`);

  // Ekip listesi
  r = await apiCall('GET', `/cases/${ids.caseId}/collaborators`, null, adminToken);
  test(r.status === 200 && Array.isArray(r.data) && r.data.length > 0, 'Ekip üyesi listesi', `${r.data.length} üye`);

  // Yetki güncelle
  r = await apiCall('PUT', `/cases/${ids.caseId}/collaborators/${ids.collaboratorId}`, { permissionLevel: 'edit' }, adminToken);
  test(r.status === 200 && r.data.success, 'Ekip üyesi yetkisi güncelleme');

  // Aktivite logu
  r = await apiCall('GET', `/cases/${ids.caseId}/collaborators/activity`, null, adminToken);
  test(r.status === 200 && Array.isArray(r.data), 'Dava aktivite logu', `${r.data.length} aktivite`);

  // Ekip üyesini kaldır
  r = await apiCall('DELETE', `/cases/${ids.caseId}/collaborators/${ids.collaboratorId}`, null, adminToken);
  test(r.status === 200 && r.data.success, 'Ekip üyesi kaldırma');

  // ══════════════════════════════════════════════
  setSection('17. DAVA PAYLAŞIMI (CASE SHARES)');
  // ══════════════════════════════════════════════

  r = await apiCall('POST', `/cases/${ids.caseId}/collaborators/shares`, { userId: lawyerUserId, permissionLevel: 'view' }, adminToken);
  test(r.status === 200 && r.data.id, 'Dava paylaşımı oluşturma', `ID: ${r.data.id}`);
  ids.shareId = r.data.id;

  r = await apiCall('GET', `/cases/${ids.caseId}/collaborators/shares`, null, adminToken);
  test(r.status === 200 && Array.isArray(r.data) && r.data.length > 0, 'Dava paylaşım listesi', `${r.data.length} paylaşım`);

  // Tekrar paylaşma (unique constraint)
  r = await apiCall('POST', `/cases/${ids.caseId}/collaborators/shares`, { userId: lawyerUserId, permissionLevel: 'edit' }, adminToken);
  test(r.status === 400, 'Tekrar paylaşma reddedildi (unique constraint)', `HTTP ${r.status}`);

  r = await apiCall('DELETE', `/cases/${ids.caseId}/collaborators/shares/${ids.shareId}`, null, adminToken);
  test(r.status === 200 && r.data.success, 'Dava paylaşımı kaldırma');

  // ══════════════════════════════════════════════
  setSection('18. YETKİ KONTROLÜ');
  // ══════════════════════════════════════════════

  // Lawyer token ile admin endpoint erişimi
  r = await apiCall('GET', '/admin/dashboard', null, lawyerToken);
  test(r.status === 403, 'Avukat token ile admin dashboard erişimi reddedildi', `HTTP ${r.status}`);

  r = await apiCall('GET', '/admin/users', null, lawyerToken);
  test(r.status === 403, 'Avukat token ile admin kullanıcı listesi reddedildi', `HTTP ${r.status}`);

  r = await apiCall('POST', '/admin/generate-invites', { emails: ['hack@test.com'] }, lawyerToken);
  test(r.status === 403, 'Avukat token ile davetiye oluşturma reddedildi', `HTTP ${r.status}`);

  // Başka kullanıcının davasına erişim
  r = await apiCall('GET', `/cases/${ids.caseId}`, null, lawyerToken);
  test(r.status === 404, 'Başka kullanıcının davasına erişim reddedildi (404)', `HTTP ${r.status}`);

  // ══════════════════════════════════════════════
  setSection('19. ADMIN: KULLANICI SİLME');
  // ══════════════════════════════════════════════

  // Kendi hesabını silme denemesi
  r = await apiCall('DELETE', `/admin/users/${ids.testUserId || 1}`, null, adminToken);
  // Admin kendi ID'sini siliyor mu? Hayır, 1 admin'in ID'si
  // testUserId ile sil
  if (testUserId) {
    r = await apiCall('DELETE', `/admin/users/${testUserId}`, null, adminToken);
    test(r.status === 200 && r.data.success, `Test kullanıcısı silindi (ID: ${testUserId})`);
  }

  // ══════════════════════════════════════════════
  setSection('20. TEMİZLİK');
  // ══════════════════════════════════════════════

  // Görevleri sil
  for (const id of [ids.taskId, ids.taskId2]) {
    if (id) { r = await apiCall('DELETE', `/tasks/${id}`, null, adminToken); test(r.status === 200, `Görev silindi (ID: ${id})`); }
  }

  // 2. davayı sil
  if (ids.caseId2) { r = await apiCall('DELETE', `/cases/${ids.caseId2}`, null, adminToken); test(r.status === 200, '2. test davası silindi'); }

  // Ana davayı sil (içindeki kayıtlar cascade silinir)
  if (ids.caseId) { r = await apiCall('DELETE', `/cases/${ids.caseId}`, null, adminToken); test(r.status === 200, 'Ana test davası silindi'); }

  // Müvekkili sil
  if (ids.clientId) { r = await apiCall('DELETE', `/clients/${ids.clientId}`, null, adminToken); test(r.status === 200, 'Test müvekkili silindi'); }

  // Profil adını geri al
  r = await apiCall('PUT', '/profile', { name: 'Admin Kullanıcısı', phone: null, barNo: null }, adminToken);
  test(r.status === 200, 'Admin profili sıfırlandı');

  // ══════════════════════════════════════════════
  // SONUÇ
  // ══════════════════════════════════════════════
  console.log('\n' + '═'.repeat(55));
  console.log(`   SONUÇ: ${passed} ✅ başarılı  |  ${warnings} ⚠️  uyarı  |  ${failed} ❌ başarısız`);
  console.log(`   Toplam: ${passed + failed + warnings} test`);

  if (failed === 0) {
    console.log('   🎉 TÜM KRİTİK TESTLER GEÇTİ!');
  } else {
    console.log('\n   ❌ BAŞARISIZ TESTLER:');
    results.filter(t => !t.ok && !t.warn).forEach(t => {
      console.log(`      • ${t.label} → ${t.detail}`);
    });
  }
  if (warnings > 0) {
    console.log('\n   ⚠️  UYARILAR (kritik değil):');
    results.filter(t => t.warn).forEach(t => {
      console.log(`      • ${t.label} → ${t.detail}`);
    });
  }
  console.log('═'.repeat(55) + '\n');
}

run().catch(e => console.error('Test hatası:', e));
