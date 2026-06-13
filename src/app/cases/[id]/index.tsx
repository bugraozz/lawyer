import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
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
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push(`/cases/${id}/messages`)}>
          <MaterialIcons name="message" size={24} color={colors.text.primary} />
          <Text style={styles.quickBtnText}>Mesaj</Text>
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
    marginBottom: 24,
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
});
