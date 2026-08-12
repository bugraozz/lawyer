import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../api/client';
import { BrutalButton } from '../components/BrutalButton';
import { BrutalCard } from '../components/BrutalCard';
import { BrutalInput } from '../components/BrutalInput';
import { StatusBadge } from '../components/StatusBadge';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function AdminPanelScreen() {
  const router = useRouter();
  const { logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'invites' | 'audit'>('dashboard');
  const [dashboard, setDashboard] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectUserId, setRejectUserId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [expiryDays, setExpiryDays] = useState('30');
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const res = await apiClient.get('/admin/dashboard');
        setDashboard(res.data);
      } else if (activeTab === 'users') {
        const res = await apiClient.get('/admin/users');
        setUsers(res.data);
      } else if (activeTab === 'invites') {
        const res = await apiClient.get('/admin/invitations');
        setInvites(res.data);
      } else if (activeTab === 'audit') {
        const res = await apiClient.get('/admin/audit-log');
        setAuditLog(res.data);
      }
    } catch (error) {
      console.error('Admin loadData error:', error);
      const status = (error as any)?.response?.status;
      const message = (error as any)?.response?.data?.error;

      if (status === 403 && message === 'Yalnızca admin erişebilir') {
        setAccessDenied(true);
        return;
      }

      Alert.alert('Hata', 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: number) => {
    try {
      await apiClient.post(`/admin/users/${userId}/approve`);
      Alert.alert('Başarılı', 'Kullanıcı onaylandı');
      loadData();
    } catch (error) {
      Alert.alert('Hata', 'İşlem başarısız');
    }
  };

  const handleRejectUser = (userId: number) => {
    setRejectUserId(userId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmRejectUser = async () => {
    if (rejectUserId === null) return;
    try {
      await apiClient.post(`/admin/users/${rejectUserId}/reject`, { reason: rejectReason });
      Alert.alert('Başarılı', 'Kullanıcı reddedildi');
      loadData();
    } catch (error) {
      Alert.alert('Hata', 'İşlem başarısız');
    } finally {
      setShowRejectModal(false);
      setRejectUserId(null);
      setRejectReason('');
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    Alert.alert('Sil', `${userName} silinecek. Devam etmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/admin/users/${userId}`);
            Alert.alert('Başarılı', 'Kullanıcı silindi');
            loadData();
          } catch (error) {
            Alert.alert('Hata', 'İşlem başarısız');
          }
        },
      },
    ]);
  };

  const handleGenerateInvites = async () => {
    if (emails.length === 0) {
      Alert.alert('Hata', 'En az bir e-mail adresi girin');
      return;
    }

    try {
      const res = await apiClient.post('/admin/generate-invites', {
        emails,
        expiryDays: parseInt(expiryDays),
      });
      Alert.alert('Başarılı', `${emails.length} davetiye oluşturuldu`);
      setEmails([]);
      setEmailInput('');
      loadData();
      setShowInviteModal(false);
    } catch (error) {
      Alert.alert('Hata', 'Davetiye oluşturulurken hata oluştu');
    }
  };

  const addEmail = () => {
    if (emailInput.trim() && !emails.includes(emailInput.trim())) {
      setEmails([...emails, emailInput.trim()]);
      setEmailInput('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return colors.accent.green;
      case 'pending': return colors.accent.yellow;
      case 'rejected': return colors.accent.red;
      default: return colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Onaylı';
      case 'pending': return 'Beklemede';
      case 'rejected': return 'Reddedildi';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      {accessDenied ? (
        <View style={styles.deniedState}>
          <BrutalCard style={styles.deniedCard}>
            <Text style={styles.deniedTitle}>Erişim Yetkiniz Yok</Text>
            <Text style={styles.deniedText}>Bu sayfa yalnızca admin kullanıcılar için kullanılabilir.</Text>
            <BrutalButton title="GERİ DÖN" fullWidth onPress={() => router.back()} style={{ marginTop: 16 }} />
          </BrutalCard>
        </View>
      ) : (
      <>
      <View style={styles.header}>
        {/*
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        */}
        <Text style={styles.title}>ADMIN PANELİ</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={logout} style={styles.logoutBtnTop}>
          <MaterialIcons name="logout" size={24} color={colors.accent.red} />
          <Text style={styles.logoutText}>ÇIKIŞ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {(['dashboard', 'users', 'invites', 'audit'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'dashboard' ? 'Gösterge' : tab === 'users' ? 'Kullanıcılar' : tab === 'invites' ? 'Davetiyeler' : 'Denetim'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.text.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {activeTab === 'dashboard' && dashboard && (
              <View>
                <View style={styles.statsGrid}>
                  <BrutalCard style={styles.statCard}>
                    <View style={styles.statRow}>
                      <View style={styles.statRowLeft}>
                        <Text style={styles.statRowLabel}>Toplam Kullanıcı</Text>
                        <Text style={styles.statRowValue}>{dashboard.stats.totalUsers}</Text>
                      </View>
                      <View style={[styles.statRowIcon, { backgroundColor: colors.accent.blue + '15' }]} />
                    </View>
                  </BrutalCard>

                  <BrutalCard style={styles.statCard}>
                    <View style={styles.statRow}>
                      <View style={styles.statRowLeft}>
                        <Text style={styles.statRowLabel}>Beklemede</Text>
                        <Text style={[styles.statRowValue, { color: colors.accent.yellow }]}>{dashboard.stats.pendingUsers}</Text>
                      </View>
                      <View style={[styles.statRowIcon, { backgroundColor: colors.accent.yellow + '15' }]} />
                    </View>
                  </BrutalCard>

                  <BrutalCard style={styles.statCard}>
                    <View style={styles.statRow}>
                      <View style={styles.statRowLeft}>
                        <Text style={styles.statRowLabel}>Onaylı</Text>
                        <Text style={[styles.statRowValue, { color: colors.accent.green }]}>{dashboard.stats.approvedUsers}</Text>
                      </View>
                      <View style={[styles.statRowIcon, { backgroundColor: colors.accent.green + '15' }]} />
                    </View>
                  </BrutalCard>

                  <BrutalCard style={styles.statCard}>
                    <View style={styles.statRow}>
                      <View style={styles.statRowLeft}>
                        <Text style={styles.statRowLabel}>Davalar</Text>
                        <Text style={styles.statRowValue}>{dashboard.stats.totalCases}</Text>
                      </View>
                      <View style={[styles.statRowIcon, { backgroundColor: colors.accent.blue + '15' }]} />
                    </View>
                  </BrutalCard>
                </View>

                <Text style={styles.sectionTitle}>SON AKTİVİTELER</Text>
                {dashboard.recentActivity.map((act: any, idx: number) => (
                  <BrutalCard key={`${act.timestamp}-${idx}`} style={styles.activityItem}>
                    <View style={styles.activityHeader}>
                      <View>
                        <Text style={styles.activityUser}>{act.name}</Text>
                        <Text style={styles.activityAction}>{act.action}</Text>
                      </View>
                      <Text style={styles.activityTime}>{new Date(act.timestamp.replace(' ', 'T')).toLocaleString('tr-TR')}</Text>
                    </View>
                    <Text style={styles.activityDetails}>{act.details}</Text>
                  </BrutalCard>
                ))}
              </View>
            )}

            {activeTab === 'users' && (
              <View>
                <BrutalButton title="DAVETIYE OLUSTUR" fullWidth style={{ marginBottom: 20 }} onPress={() => setShowInviteModal(true)} />
                
                {users.length === 0 ? (
                  <Text style={styles.emptyText}>Kullanıcı bulunamadı</Text>
                ) : (
                  users.map(user => (
                    <BrutalCard key={user.id} style={styles.userCard}>
                      <View style={styles.userHeader}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>{user.name}</Text>
                          <Text style={styles.userEmail}>{user.email}</Text>
                          <Text style={styles.userBar}>{user.barNo || 'Baro no yok'}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.userMeta}>
                        <StatusBadge label={getStatusLabel(user.status)} status={user.status === 'approved' ? 'active' : 'default'} />
                        <Text style={styles.userDate}>{new Date(user.createdAt).toLocaleDateString('tr-TR')}</Text>
                      </View>

                      {user.status === 'pending' && (
                        <View style={styles.userActions}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.approveBtn]}
                            onPress={() => handleApproveUser(user.id)}
                          >
                            <MaterialIcons name="check-circle" size={20} color={colors.text.inverse} />
                            <Text style={styles.actionBtnText}>Onayla</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.rejectBtn]}
                            onPress={() => handleRejectUser(user.id)}
                          >
                            <MaterialIcons name="cancel" size={20} color={colors.text.inverse} />
                            <Text style={styles.actionBtnText}>Reddet</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {user.role !== 'admin' && (
                        <TouchableOpacity onPress={() => handleDeleteUser(user.id, user.name)}>
                          <Text style={styles.deleteLink}>Sil</Text>
                        </TouchableOpacity>
                      )}
                    </BrutalCard>
                  ))
                )}
              </View>
            )}

            {activeTab === 'invites' && (
              <View>
                <BrutalButton title="YENI DAVETIYE OLUSTUR" fullWidth style={{ marginBottom: 20 }} onPress={() => setShowInviteModal(true)} />
                
                {invites.length === 0 ? (
                  <Text style={styles.emptyText}>Davetiye bulunamadı</Text>
                ) : (
                  invites.map(invite => (
                    <BrutalCard key={invite.id} style={styles.inviteCard}>
                      <View style={styles.inviteHeader}>
                        <View>
                          <Text style={styles.inviteEmail}>{invite.email}</Text>
                          <Text style={styles.inviteCode}>{invite.code}</Text>
                        </View>
                        <StatusBadge label={invite.used ? 'Kullanılmış' : 'Aktif'} status={invite.used ? 'inactive' : 'active'} />
                      </View>
                      <Text style={styles.inviteExpiry}>Sona eriş: {new Date(invite.expiresAt).toLocaleDateString('tr-TR')}</Text>
                    </BrutalCard>
                  ))
                )}
              </View>
            )}

            {activeTab === 'audit' && (
              <View>
                {auditLog.length === 0 ? (
                  <Text style={styles.emptyText}>Denetim kaydı bulunamadı</Text>
                ) : (
                  auditLog.map(log => (
                    <BrutalCard key={log.id} style={styles.auditItem}>
                      <View style={styles.auditHeader}>
                        <View>
                          <Text style={styles.auditUser}>{log.name}</Text>
                          <Text style={styles.auditAction}>{log.action}</Text>
                        </View>
                        <Text style={styles.auditTime}>{new Date(log.timestamp).toLocaleString('tr-TR')}</Text>
                      </View>
                      <Text style={styles.auditDetails}>{log.details}</Text>
                    </BrutalCard>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showInviteModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>DAVETIYE OLUSTUR</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>E-mail Adresleri</Text>
              <View style={styles.emailInput}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <BrutalInput
                    placeholder="Email girin"
                    value={emailInput}
                    onChangeText={setEmailInput}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <BrutalButton title="Ekle" onPress={addEmail} />
              </View>

              {emails.length > 0 && (
                <View style={styles.emailList}>
                  {emails.map((email, idx) => (
                    <View key={idx} style={styles.emailTag}>
                      <Text style={styles.emailTagText}>{email}</Text>
                      <TouchableOpacity onPress={() => setEmails(emails.filter((_, i) => i !== idx))}>
                        <MaterialIcons name="close" size={16} color={colors.text.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.inputLabel}>Geçerlilik (gün)</Text>
              <BrutalInput
                placeholder="30"
                value={expiryDays}
                onChangeText={setExpiryDays}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <BrutalButton
                title="OLUŞTUR"
                fullWidth
                onPress={handleGenerateInvites}
                style={{ marginBottom: 12 }}
              />
              <BrutalButton title="İPTAL" fullWidth onPress={() => setShowInviteModal(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>RED SEBEBİ</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Neden reddettiniz?</Text>
              <BrutalInput
                placeholder="Red sebebini girin"
                value={rejectReason}
                onChangeText={setRejectReason}
              />
            </View>

            <View style={styles.modalActions}>
              <BrutalButton
                title="REDDET"
                variant="danger"
                fullWidth
                onPress={confirmRejectUser}
                style={{ marginBottom: 12 }}
              />
              <BrutalButton title="İPTAL" fullWidth onPress={() => setShowRejectModal(false)} />
            </View>
          </View>
        </View>
      </Modal>
      </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 64,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 16,
  },
  title: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
  },
  logoutBtnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: colors.accent.red,
    backgroundColor: colors.surface,
  },
  logoutText: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.xs,
    color: colors.accent.red,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 3,
    borderBottomColor: colors.border,
    paddingHorizontal: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 4,
    borderBottomColor: colors.accent.yellow,
  },
  tabText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.text.primary,
    fontFamily: typography.fonts.bodyBold,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  deniedState: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  deniedCard: {
    padding: 24,
  },
  deniedTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: 8,
  },
  deniedText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    paddingVertical: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 0,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  statRowLeft: {
    flex: 1,
  },
  statRowLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  statRowValue: {
    fontFamily: typography.fonts.headline,
    fontSize: 28,
    color: colors.accent.blue,
    fontWeight: '700',
  },
  statRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginLeft: 8,
  },
  statCardContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  statValue: {
    fontFamily: typography.fonts.headline,
    fontSize: 32,
    color: colors.accent.blue,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: '100%',
  },
  sectionTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: 16,
  },
  activityItem: {
    marginBottom: 12,
    padding: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activityUser: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  activityAction: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  activityTime: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  activityDetails: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },
  userCard: {
    marginBottom: 16,
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.blue,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: typography.fonts.headline,
    fontSize: 20,
    color: colors.text.inverse,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  userEmail: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  userBar: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    marginBottom: 12,
  },
  userDate: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 2,
    borderRadius: 0,
  },
  approveBtn: {
    backgroundColor: colors.accent.green,
    borderColor: colors.accent.green,
  },
  rejectBtn: {
    backgroundColor: colors.accent.red,
    borderColor: colors.accent.red,
  },
  actionBtnText: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.xs,
    color: colors.text.inverse,
    marginLeft: 4,
  },
  deleteLink: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.xs,
    color: colors.accent.red,
    paddingTop: 8,
  },
  inviteCard: {
    marginBottom: 12,
    padding: 12,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inviteEmail: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  inviteCode: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.accent.yellow,
  },
  inviteExpiry: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  auditItem: {
    marginBottom: 12,
    padding: 12,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  auditUser: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  auditAction: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  auditTime: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  auditDetails: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
  },
  modalBody: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginBottom: 8,
  },
  emailInput: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  emailList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  emailTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  emailTagText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },
  modalActions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
