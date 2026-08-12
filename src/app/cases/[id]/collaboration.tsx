import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../../../api/client';
import { BrutalButton } from '../../../components/BrutalButton';
import { BrutalCard } from '../../../components/BrutalCard';
import { StatusBadge } from '../../../components/StatusBadge';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

const permissionLevels = [
  { value: 'view', label: 'Okuma', color: colors.accent.blue },
  { value: 'edit', label: 'Düzenleme', color: colors.accent.yellow },
  { value: 'admin', label: 'Tam Yetki', color: colors.accent.green },
];

export default function CaseCollaborationScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ekip' | 'paylasim' | 'aktivite'>('ekip');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPermission, setSelectedPermission] = useState('view');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamRes, activityRes, sharesRes, usersRes] = await Promise.all([
        apiClient.get(`/cases/${id}/collaborators`),
        apiClient.get(`/cases/${id}/collaborators/activity`),
        apiClient.get(`/cases/${id}/collaborators/shares`),
        apiClient.get('/profile/company/users'),
      ]);
      setTeamMembers(teamRes.data || []);
      setActivity(activityRes.data || []);
      setShares(sharesRes.data || []);
      setAllUsers(usersRes.data || []);
    } catch (error) {
      console.error('Failed to load collaboration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) {
      Alert.alert('Hata', 'Lütfen bir kullanıcı seçin');
      return;
    }
    try {
      await apiClient.post(`/cases/${id}/collaborators`, {
        userId: selectedUser.id,
        permissionLevel: selectedPermission,
      });
      setShowAddModal(false);
      setSelectedUser(null);
      setSelectedPermission('view');
      loadData();
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.error || 'Ekip üyesi eklenirken hata oluştu');
    }
  };

  const handleRemoveMember = async (collaboratorId: number) => {
    Alert.alert('Sil', 'Bu üyeyi davadan çıkarmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/cases/${id}/collaborators/${collaboratorId}`);
            loadData();
          } catch (error) {
            Alert.alert('Hata', 'Üye kaldırılırken hata oluştu');
          }
        },
      },
    ]);
  };

  const handleUpdatePermission = async (collaboratorId: number, newPermission: string) => {
    try {
      await apiClient.put(`/cases/${id}/collaborators/${collaboratorId}`, {
        permissionLevel: newPermission,
      });
      loadData();
    } catch (error) {
      Alert.alert('Hata', 'Yetki güncellenirken hata oluştu');
    }
  };

  const handleShareCase = async () => {
    if (!selectedUser) {
      Alert.alert('Hata', 'Lütfen bir kullanıcı seçin');
      return;
    }
    try {
      await apiClient.post(`/cases/${id}/collaborators/shares`, {
        userId: selectedUser.id,
        permissionLevel: selectedPermission,
      });
      setShowShareModal(false);
      setSelectedUser(null);
      setSelectedPermission('view');
      loadData();
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.error || 'Dava paylaşılırken hata oluştu');
    }
  };

  const handleRemoveShare = async (shareId: number) => {
    Alert.alert('Paylaşımı Kaldır', 'Bu paylaşımı kaldırmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Kaldır',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/cases/${id}/collaborators/shares/${shareId}`);
            loadData();
          } catch (error) {
            Alert.alert('Hata', 'Paylaşım kaldırılırken hata oluştu');
          }
        },
      },
    ]);
  };

  const getPermissionLabel = (level: string) => {
    return permissionLevels.find(p => p.value === level)?.label || level;
  };

  const getPermissionColor = (level: string) => {
    return permissionLevels.find(p => p.value === level)?.color || colors.text.secondary;
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ekip' && styles.activeTab]}
          onPress={() => setActiveTab('ekip')}
        >
          <Text style={[styles.tabText, activeTab === 'ekip' && styles.activeTabText]}>Ekip</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'paylasim' && styles.activeTab]}
          onPress={() => setActiveTab('paylasim')}
        >
          <Text style={[styles.tabText, activeTab === 'paylasim' && styles.activeTabText]}>Paylaşım</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'aktivite' && styles.activeTab]}
          onPress={() => setActiveTab('aktivite')}
        >
          <Text style={[styles.tabText, activeTab === 'aktivite' && styles.activeTabText]}>Aktivite</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.text.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {activeTab === 'ekip' && (
              <View>
                <BrutalButton 
                  title="EKİP ÜYESİ EKLE" 
                  fullWidth 
                  style={{ marginBottom: 24 }}
                  onPress={() => setShowAddModal(true)}
                />
                
                {teamMembers.length === 0 ? (
                  <Text style={styles.emptyText}>Henüz ekip üyesi yok</Text>
                ) : (
                  teamMembers.map(member => (
                    <BrutalCard key={member.id} style={styles.memberCard}>
                      <View style={styles.memberHeader}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{member.name}</Text>
                          <Text style={styles.memberEmail}>{member.email}</Text>
                        </View>
                      </View>
                      <View style={styles.memberActions}>
                        <StatusBadge 
                          label={getPermissionLabel(member.permissionLevel)} 
                          status={member.permissionLevel === 'admin' ? 'active' : 'default'}
                        />
                        <TouchableOpacity 
                          onPress={() => {
                            const nextLevel = member.permissionLevel === 'view' ? 'edit' : member.permissionLevel === 'edit' ? 'admin' : 'view';
                            handleUpdatePermission(member.id, nextLevel);
                          }}
                        >
                          <Text style={styles.actionLink}>Değiştir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRemoveMember(member.id)}>
                          <MaterialIcons name="delete" size={20} color={colors.accent.red} />
                        </TouchableOpacity>
                      </View>
                    </BrutalCard>
                  ))
                )}
              </View>
            )}

            {activeTab === 'paylasim' && (
              <View>
                <BrutalButton 
                  title="DAVAYI PAYLAŞ" 
                  fullWidth 
                  style={{ marginBottom: 24 }}
                  onPress={() => setShowShareModal(true)}
                />

                {shares.length === 0 ? (
                  <Text style={styles.emptyText}>Dava henüz kimse ile paylaşılmadı</Text>
                ) : (
                  shares.map(share => (
                    <BrutalCard key={share.id} style={styles.memberCard}>
                      <View style={styles.memberHeader}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{share.name.charAt(0)}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{share.name}</Text>
                          <Text style={styles.memberEmail}>{share.email}</Text>
                        </View>
                      </View>
                      <View style={styles.memberActions}>
                        <StatusBadge 
                          label={getPermissionLabel(share.permissionLevel)} 
                          status={share.permissionLevel === 'admin' ? 'active' : 'default'}
                        />
                        <TouchableOpacity onPress={() => handleRemoveShare(share.id)}>
                          <MaterialIcons name="delete" size={20} color={colors.accent.red} />
                        </TouchableOpacity>
                      </View>
                    </BrutalCard>
                  ))
                )}
              </View>
            )}

            {activeTab === 'aktivite' && (
              <View>
                {activity.length === 0 ? (
                  <Text style={styles.emptyText}>Henüz aktivite yok</Text>
                ) : (
                  activity.map((item, idx) => (
                    <BrutalCard key={item.id} style={styles.activityCard}>
                      <View style={styles.activityHeader}>
                        <View style={[styles.activityIcon, { backgroundColor: getPermissionColor(item.actionType) }]}>
                          <MaterialIcons 
                            name={
                              item.actionType.includes('upload') ? 'upload-file' :
                              item.actionType.includes('note') ? 'note-add' :
                              item.actionType.includes('team') ? 'group' : 'history'
                            } 
                            size={16} 
                            color={colors.text.inverse} 
                          />
                        </View>
                        <View style={styles.activityContent}>
                          <Text style={styles.activityText}>
                            <Text style={{ fontWeight: 'bold' }}>{item.userName}</Text> {item.actionDesc}
                          </Text>
                          <Text style={styles.activityTime}>{new Date(item.timestamp).toLocaleString('tr-TR')}</Text>
                        </View>
                      </View>
                    </BrutalCard>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>EKİP ÜYESİ EKLE</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.userList}>
              {allUsers.map(user => (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.userOption, selectedUser?.id === user.id && styles.userOptionSelected]}
                  onPress={() => setSelectedUser(user)}
                >
                  <View style={styles.userOptionAvatar}>
                    <Text style={styles.userOptionAvatarText}>{user.name?.charAt(0) || 'U'}</Text>
                  </View>
                  <View style={styles.userOptionInfo}>
                    <Text style={styles.userOptionName}>{user.name || 'Kullanıcı'}</Text>
                    <Text style={styles.userOptionEmail}>{user.email || '-'}</Text>
                  </View>
                  {selectedUser?.id === user.id && (
                    <MaterialIcons name="check-circle" size={24} color={colors.accent.green} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedUser && (
              <View style={styles.permissionSelector}>
                <Text style={styles.permissionLabel}>Yetki Seviyesi:</Text>
                <View style={styles.permissionButtons}>
                  {permissionLevels.map(perm => (
                    <TouchableOpacity
                      key={perm.value}
                      style={[
                        styles.permButton,
                        selectedPermission === perm.value && styles.permButtonActive,
                      ]}
                      onPress={() => setSelectedPermission(perm.value)}
                    >
                      <Text style={styles.permButtonText}>{perm.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <BrutalButton 
              title="EKLE" 
              fullWidth 
              onPress={handleAddMember}
              style={{ marginBottom: 12 }}
            />
            <BrutalButton 
              title="İPTAL" 
              fullWidth 
              onPress={() => setShowAddModal(false)}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showShareModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>DAVAYI PAYLAŞ</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.userList}>
              {allUsers.map(user => (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.userOption, selectedUser?.id === user.id && styles.userOptionSelected]}
                  onPress={() => setSelectedUser(user)}
                >
                  <View style={styles.userOptionAvatar}>
                    <Text style={styles.userOptionAvatarText}>{user.name?.charAt(0) || 'U'}</Text>
                  </View>
                  <View style={styles.userOptionInfo}>
                    <Text style={styles.userOptionName}>{user.name || 'Kullanıcı'}</Text>
                    <Text style={styles.userOptionEmail}>{user.email || '-'}</Text>
                  </View>
                  {selectedUser?.id === user.id && (
                    <MaterialIcons name="check-circle" size={24} color={colors.accent.green} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedUser && (
              <View style={styles.permissionSelector}>
                <Text style={styles.permissionLabel}>Yetki Seviyesi:</Text>
                <View style={styles.permissionButtons}>
                  {permissionLevels.map(perm => (
                    <TouchableOpacity
                      key={perm.value}
                      style={[
                        styles.permButton,
                        selectedPermission === perm.value && styles.permButtonActive,
                      ]}
                      onPress={() => setSelectedPermission(perm.value)}
                    >
                      <Text style={styles.permButtonText}>{perm.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <BrutalButton 
              title="PAYLAŞ" 
              fullWidth 
              onPress={handleShareCase}
              style={{ marginBottom: 12 }}
            />
            <BrutalButton 
              title="İPTAL" 
              fullWidth 
              onPress={() => setShowShareModal(false)}
            />
          </View>
        </View>
      </Modal>
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
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.text.primary,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    paddingVertical: 24,
  },
  memberCard: {
    marginBottom: 16,
    padding: 16,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.yellow,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: typography.fonts.headline,
    fontSize: 20,
    color: colors.text.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: 4,
  },
  memberEmail: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  actionLink: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.xs,
    color: colors.accent.blue,
  },
  activityCard: {
    marginBottom: 16,
    padding: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginBottom: 4,
    lineHeight: 20,
  },
  activityTime: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
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
  userList: {
    maxHeight: 300,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  userOptionSelected: {
    borderColor: colors.accent.green,
    backgroundColor: colors.surface,
  },
  userOptionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userOptionAvatarText: {
    fontFamily: typography.fonts.headline,
    fontSize: 16,
    color: colors.text.primary,
  },
  userOptionInfo: {
    flex: 1,
  },
  userOptionName: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  userOptionEmail: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  permissionSelector: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  permissionLabel: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginBottom: 8,
  },
  permissionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  permButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  permButtonActive: {
    borderColor: colors.accent.yellow,
    backgroundColor: colors.accent.yellow,
  },
  permButtonText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },
});
