import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { BrutalCard } from '../components/BrutalCard';
import { BrutalButton } from '../components/BrutalButton';
import { StatusBadge } from '../components/StatusBadge';
import { FAB } from '../components/FAB';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function ExpensesScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const res = await apiClient.get('/expenses');
      setExpenses(res.data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <BrutalCard style={styles.expenseCard}>
      {item.isCompanyExpense === 1 && (
        <View style={styles.companyBadge}>
          <MaterialIcons name="business" size={12} color={colors.text.inverse} />
          <Text style={styles.companyBadgeText}>ŞİRKET</Text>
        </View>
      )}
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseTitle}>{item.title} {item.caseTitle ? `(${item.caseTitle})` : ''}</Text>
        <Text style={styles.expenseAmount}>{item.amount} TL</Text>
      </View>
      <View style={styles.expenseFooter}>
        <View>
          <Text style={styles.expenseDate}>{item.date || '-'}</Text>
          {item.uploaderName && item.isCompanyExpense === 1 && (
            <Text style={styles.uploaderText}>Ekleyen: {item.uploaderName}</Text>
          )}
        </View>
        <StatusBadge 
          label={item.status === 'paid' ? 'ÖDENDİ' : 'BEKLİYOR'} 
          status={item.status === 'paid' ? 'active' : 'warning'} 
        />
      </View>
      <View style={styles.actionRow}>
        {item.status !== 'paid' && (
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={async () => {
              try {
                await apiClient.put(`/expenses/${item.id}`, { status: 'paid' });
                loadExpenses();
              } catch (e) { console.error(e); }
            }}>
            <Text style={styles.actionBtnText}>Ödendi İşaretle</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.actionBtn, { borderColor: colors.accent.red }]}
          onPress={async () => {
            try {
              await apiClient.delete(`/expenses/${item.id}`);
              loadExpenses();
            } catch (e) { console.error(e); }
          }}>
          <MaterialIcons name="delete" size={20} color={colors.accent.red} />
        </TouchableOpacity>
      </View>
    </BrutalCard>
  );

  const totalAmount = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const pendingAmount = expenses.filter(i => i.status !== 'paid').reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>MASRAF YÖNETİMİ</Text>
      </View>

      <View style={styles.statsRow}>
        <BrutalCard style={styles.statCard}>
          <Text style={styles.statLabel}>Bu Ay Toplam</Text>
          <Text style={styles.statValue}>{totalAmount} TL</Text>
        </BrutalCard>
        <BrutalCard style={[styles.statCard, { backgroundColor: colors.accent.yellow }]}>
          <Text style={styles.statLabel}>Bekleyenler</Text>
          <Text style={styles.statValue}>{pendingAmount} TL</Text>
        </BrutalCard>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.text.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onRefresh={loadExpenses}
          refreshing={loading}
          ListHeaderComponent={() => <Text style={styles.sectionTitle}>SON İŞLEMLER</Text>}
          ListEmptyComponent={<Text style={{ textAlign: 'center' }}>Masraf bulunmuyor.</Text>}
        />
      )}

      <FAB icon="add" onPress={() => alert('Genel masraf ekleme yapım aşamasındadır. Dava detaylarından masraf ekleyebilirsiniz.')} />
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
  },
  statLabel: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  statValue: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  expenseCard: {
    marginBottom: 16,
    padding: 16,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    flex: 1,
    marginRight: 16,
  },
  expenseAmount: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  expenseDate: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.surfaceVariant,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnText: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  companyBadgeText: {
    fontFamily: typography.fonts.headline,
    fontSize: 10,
    color: colors.text.inverse,
    marginLeft: 4,
  },
  uploaderText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
