import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import apiClient from '../../../api/client';
import { BrutalCard } from '../../../components/BrutalCard';
import { StatusBadge } from '../../../components/StatusBadge';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { MaterialIcons } from '@expo/vector-icons';

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [savingClient, setSavingClient] = useState(false);

  useEffect(() => {
    loadCase();
  }, [id]);

  const loadCase = async () => {
    try {
      const res = await apiClient.get(`/cases/${id}`);
      setCaseData(res.data);
    } catch (error) {
      console.error('Failed to load case:', error);
    } finally {
      setLoading(false);
    }
  };

  const openClientModal = () => {
    setClientName(caseData?.clientName || '');
    setClientPhone(caseData?.clientPhone || '');
    setClientEmail(caseData?.clientEmail || '');
    setClientModalVisible(true);
  };

  const handleSaveClient = async () => {
    if (!clientName.trim()) {
      Alert.alert('Hata', 'İsim alanı zorunludur.');
      return;
    }
    setSavingClient(true);
    try {
      await apiClient.put(`/cases/${id}/client`, {
        name: clientName.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
      });
      setClientModalVisible(false);
      loadCase();
    } catch (error) {
      console.error('Failed to save client:', error);
      Alert.alert('Hata', 'Müvekkil bilgileri kaydedilemedi.');
    } finally {
      setSavingClient(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.text.primary} />
      </View>
    );
  }

  if (!caseData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.title}>Dava bulunamadı.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerInfo}>
          <Text style={styles.caseNo}>Dava No: {caseData.caseNo}</Text>
          <StatusBadge label={caseData.status === 'active' ? 'DEVAM EDİYOR' : 'DİKKAT'} status={caseData.status} />
        </View>
        
        <Text style={styles.title}>{caseData.title}</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Mahkeme</Text>
            <Text style={styles.infoValue}>{caseData.court || '-'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Dava Türü</Text>
            <Text style={styles.infoValue}>{caseData.type || '-'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Başlangıç</Text>
            <Text style={styles.infoValue}>{caseData.createdAt?.split(' ')[0] || '-'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Müvekkil</Text>
            <Text style={styles.infoValue}>{caseData.clientName || '-'}</Text>
          </View>
        </View>

        {/* Müvekkil Bilgileri Kartı */}
        <TouchableOpacity onPress={openClientModal} activeOpacity={0.85}>
          <BrutalCard style={styles.clientCard}>
            <View style={styles.clientCardHeader}>
              <View style={styles.clientIconWrap}>
                <MaterialIcons name="person" size={22} color={colors.text.primary} />
              </View>
              <Text style={styles.clientCardTitle}>MÜVEKKİL BİLGİLERİ</Text>
              <MaterialIcons name="edit" size={20} color={colors.text.secondary} />
            </View>
            {caseData.clientName ? (
              <View style={styles.clientDetails}>
                <View style={styles.clientDetailRow}>
                  <MaterialIcons name="badge" size={16} color={colors.text.secondary} />
                  <Text style={styles.clientDetailText}>{caseData.clientName}</Text>
                </View>
                {caseData.clientPhone ? (
                  <View style={styles.clientDetailRow}>
                    <MaterialIcons name="phone" size={16} color={colors.text.secondary} />
                    <Text style={styles.clientDetailText}>{caseData.clientPhone}</Text>
                  </View>
                ) : null}
                {caseData.clientEmail ? (
                  <View style={styles.clientDetailRow}>
                    <MaterialIcons name="email" size={16} color={colors.text.secondary} />
                    <Text style={styles.clientDetailText}>{caseData.clientEmail}</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <Text style={styles.clientEmptyText}>Müvekkil bilgisi eklenmemiş. Düzenlemek için tıklayın.</Text>
            )}
          </BrutalCard>
        </TouchableOpacity>

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Özet', 'Belgeler', 'Notlar', 'Görevler', 'Duruşmalar', 'Masraflar'].map((tab, i) => (
              <TouchableOpacity 
                key={i} 
                style={[styles.tab, i === 0 && styles.activeTab]}
                onPress={() => {
                  if (tab === 'Belgeler') router.push(`/cases/${id}/documents`);
                  if (tab === 'Notlar' || tab === 'Görevler') router.push(`/cases/${id}/notes`);
                  if (tab === 'Duruşmalar') router.push(`/cases/${id}/hearings`);
                  if (tab === 'Masraflar') router.push(`/cases/${id}/expenses`);
                }}
              >
                <Text style={[styles.tabText, i === 0 && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <BrutalCard style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>DAVA ÖZETİ</Text>
          <Text style={styles.desc}>
            {caseData.type} konulu davanın takip süreci. (Bu alan daha sonra detaylandırılabilir).
          </Text>
        </BrutalCard>

        <Text style={styles.sectionTitle}>HIZLI ERİŞİM</Text>
        <View style={styles.quickAccessRow}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push(`/cases/${id}/notes`)}>
            <MaterialIcons name="note-add" size={24} color={colors.text.primary} />
            <Text style={styles.quickBtnText}>Not Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push(`/cases/${id}/documents`)}>
            <MaterialIcons name="upload-file" size={24} color={colors.text.primary} />
            <Text style={styles.quickBtnText}>Belge Yükle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push(`/cases/${id}/collaboration`)}>
            <MaterialIcons name="group" size={24} color={colors.text.primary} />
            <Text style={styles.quickBtnText}>Ekip</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 32 }}>
          <TouchableOpacity 
            style={[styles.quickBtn, { width: '100%', backgroundColor: caseData.status === 'active' ? colors.surfaceVariant : colors.accent.blue }]} 
            onPress={async () => {
              try {
                const newStatus = caseData.status === 'active' ? 'closed' : 'active';
                await apiClient.put(`/cases/${id}`, { status: newStatus });
                setCaseData({ ...caseData, status: newStatus });
              } catch (err) {
                console.error(err);
              }
            }}>
            <MaterialIcons name={caseData.status === 'active' ? "check-circle" : "restore"} size={24} color={colors.text.primary} />
            <Text style={styles.quickBtnText}>{caseData.status === 'active' ? 'Davayı Kapat' : 'Davayı Yeniden Aç'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickBtn, { width: '100%', backgroundColor: colors.accent.red, borderColor: colors.border }]} 
            onPress={async () => {
              try {
                await apiClient.delete(`/cases/${id}`);
                router.replace('/(tabs)/cases');
              } catch (err) {
                console.error(err);
              }
            }}>
            <MaterialIcons name="delete" size={24} color={colors.text.inverse} />
            <Text style={[styles.quickBtnText, { color: colors.text.inverse }]}>Davayı Sil</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Müvekkil Düzenleme Modalı */}
      <Modal visible={clientModalVisible} animationType="slide" transparent onRequestClose={() => setClientModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>MÜVEKKİL BİLGİLERİ</Text>
              <TouchableOpacity onPress={() => setClientModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>İSİM SOYİSİM *</Text>
            <TextInput
              style={styles.modalInput}
              value={clientName}
              onChangeText={setClientName}
              placeholder="Müvekkil Adı Soyadı"
              placeholderTextColor={colors.text.secondary}
            />

            <Text style={styles.modalLabel}>CEP TELEFONU</Text>
            <TextInput
              style={styles.modalInput}
              value={clientPhone}
              onChangeText={setClientPhone}
              placeholder="0555 555 55 55"
              placeholderTextColor={colors.text.secondary}
              keyboardType="phone-pad"
            />

            <Text style={styles.modalLabel}>E-POSTA</Text>
            <TextInput
              style={styles.modalInput}
              value={clientEmail}
              onChangeText={setClientEmail}
              placeholder="ornek@mail.com"
              placeholderTextColor={colors.text.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.modalSaveBtn, savingClient && { opacity: 0.6 }]}
              onPress={handleSaveClient}
              disabled={savingClient}
            >
              <Text style={styles.modalSaveBtnText}>
                {savingClient ? 'KAYDEDİLİYOR...' : 'KAYDET'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  caseNo: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  title: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    marginBottom: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  infoCol: {
    width: '50%',
    padding: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    borderRightWidth: 2,
    borderRightColor: colors.border,
  },
  infoLabel: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  clientCard: {
    marginBottom: 24,
    padding: 16,
  },
  clientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  clientCardTitle: {
    flex: 1,
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  clientDetails: {
    gap: 8,
  },
  clientDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientDetailText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  clientEmptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  tabsContainer: {
    marginBottom: 24,
    borderBottomWidth: 3,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 4,
    borderBottomColor: colors.accent.yellow,
  },
  tabText: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.text.primary,
  },
  summaryCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: 12,
  },
  desc: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    lineHeight: 24,
  },
  quickAccessRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceVariant,
    marginBottom: 16,
  },
  quickBtnText: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginLeft: 8,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    padding: 24,
    paddingBottom: 48,
    borderTopWidth: 3,
    borderTopColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
  },
  modalLabel: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: 6,
    marginTop: 16,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  modalSaveBtn: {
    marginTop: 24,
    backgroundColor: colors.accent.yellow,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
});
