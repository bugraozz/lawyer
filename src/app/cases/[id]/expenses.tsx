import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import apiClient from '../../../api/client';
import { BrutalButton } from '../../../components/BrutalButton';
import { BrutalCard } from '../../../components/BrutalCard';
import { BrutalInput } from '../../../components/BrutalInput';
import { StatusBadge } from '../../../components/StatusBadge';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export default function CaseExpensesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isCompanyExpense, setIsCompanyExpense] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [id]);

  const loadExpenses = async () => {
    try {
      const res = await apiClient.get(`/cases/${id}/expenses`);
      setExpenses(res.data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title || !amount) return alert('Lütfen başlık ve tutar giriniz.');
    try {
      setSaving(true);
      const now = new Date();
      const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
      await apiClient.post(`/cases/${id}/expenses`, { title, amount, date: formattedDate, status: 'pending', isCompanyExpense });
      setTitle(''); setAmount(''); setIsCompanyExpense(false);
      loadExpenses();
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Masraf kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: any) => {
    try {
      const newStatus = item.status === 'paid' ? 'pending' : 'paid';
      await apiClient.put(`/cases/${id}/expenses/${item.id}`, { status: newStatus });
      setExpenses(prev => prev.map(e => e.id === item.id ? { ...e, status: newStatus } : e));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await apiClient.delete(`/cases/${id}/expenses/${itemId}`);
      setExpenses(prev => prev.filter(e => e.id !== itemId));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  // Computed summary stats
  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const paid = expenses.reduce((sum, e) => e.status === 'paid' ? sum + Number(e.amount) : sum, 0);
    const pending = total - paid;
    const company = expenses.reduce((sum, e) => e.isCompanyExpense === 1 ? sum + Number(e.amount) : sum, 0);
    const personal = total - company;
    return { total, paid, pending, company, personal, count: expenses.length, paidCount: expenses.filter(e => e.status === 'paid').length };
  }, [expenses]);

  const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Apply search + status filter
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = !searchQuery ||
        e.title?.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR'));
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [expenses, searchQuery, statusFilter]);

  const renderItem = ({ item }: { item: any }) => (
    <BrutalCard style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.dateText}>{item.date || 'Tarih Yok'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amountText}>₺{fmt(Number(item.amount))}</Text>
          {item.isCompanyExpense === 1 && (
            <View style={styles.companyBadge}>
              <MaterialIcons name="business" size={10} color={colors.text.inverse} />
              <Text style={styles.companyBadgeText}>ŞİRKET</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.statusBtn, item.status === 'paid' && styles.statusBtnPaid]} onPress={() => handleToggleStatus(item)}>
          <MaterialIcons name={item.status === 'paid' ? 'check-circle' : 'radio-button-unchecked'} size={16} color={item.status === 'paid' ? colors.text.inverse : colors.text.secondary} />
          <Text style={[styles.statusBtnText, item.status === 'paid' && styles.statusBtnTextPaid]}>
            {item.status === 'paid' ? 'ÖDENDİ' : 'BEKLİYOR'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <MaterialIcons name="delete-outline" size={20} color={colors.accent.red} />
        </TouchableOpacity>
      </View>
    </BrutalCard>
  );

  const ListHeader = () => (
    <>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        {/* Total row */}
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>TOPLAM MASRAF</Text>
            <Text style={styles.summaryTotal}>₺{fmt(stats.total)}</Text>
            <Text style={styles.summaryCount}>{stats.count} kayıt</Text>
          </View>
          <View style={styles.summaryProgressWrap}>
            <Text style={styles.summaryProgressLabel}>{stats.count > 0 ? Math.round((stats.paidCount / stats.count) * 100) : 0}% ödendi</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stats.count > 0 ? (stats.paidCount / stats.count) * 100 : 0}%` as any }]} />
            </View>
          </View>
        </View>

        {/* 4-cell grid */}
        <View style={styles.statGrid}>
          <View style={[styles.statCell, styles.statCellBorderRight]}>
            <MaterialIcons name="check-circle" size={18} color={colors.accent.green} />
            <Text style={styles.statCellValue}>₺{fmt(stats.paid)}</Text>
            <Text style={styles.statCellLabel}>Ödenen</Text>
          </View>
          <View style={styles.statCell}>
            <MaterialIcons name="schedule" size={18} color={colors.accent.red} />
            <Text style={styles.statCellValue}>₺{fmt(stats.pending)}</Text>
            <Text style={styles.statCellLabel}>Bekleyen</Text>
          </View>
          <View style={[styles.statCell, styles.statCellBorderTop, styles.statCellBorderRight]}>
            <MaterialIcons name="business" size={18} color={colors.accent.blue} />
            <Text style={styles.statCellValue}>₺{fmt(stats.company)}</Text>
            <Text style={styles.statCellLabel}>Şirket</Text>
          </View>
          <View style={[styles.statCell, styles.statCellBorderTop]}>
            <MaterialIcons name="person" size={18} color={colors.text.secondary} />
            <Text style={styles.statCellValue}>₺{fmt(stats.personal)}</Text>
            <Text style={styles.statCellLabel}>Kişisel</Text>
          </View>
        </View>
      </View>

      {/* Add form */}
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>YENİ MASRAF EKLE</Text>
        <BrutalInput placeholder="Masraf Başlığı (Örn: Tevzi Harcı)" value={title} onChangeText={setTitle} />
        <BrutalInput placeholder="Tutar (₺)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Şirket Masrafı Olarak Kaydet</Text>
          <Switch
            value={isCompanyExpense}
            onValueChange={setIsCompanyExpense}
            trackColor={{ false: colors.surfaceVariant, true: colors.accent.yellow }}
            thumbColor={isCompanyExpense ? colors.text.primary : colors.surface}
          />
        </View>
        <BrutalButton title={saving ? "EKLENİYOR..." : "MASRAF EKLE"} onPress={handleSave} style={{ marginTop: 8 }} />
      </View>

      <Text style={styles.sectionTitle}>MASRAF LİSTESİ</Text>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={colors.text.secondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Masraf ara..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter */}
      <View style={styles.statusFilterRow}>
        {([['all', 'Tümü'], ['pending', 'Bekleyen'], ['paid', 'Ödendi']] as [string, string][]).map(([val, label]) => (
          <TouchableOpacity
            key={val}
            onPress={() => setStatusFilter(val as any)}
            style={[styles.filterChip, statusFilter === val && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, statusFilter === val && styles.filterChipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredExpenses}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onRefresh={loadExpenses}
        refreshing={loading}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>Henüz masraf eklenmemiş.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 64,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 8, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, marginRight: 16 },
  headerTitle: { fontFamily: typography.fonts.headline, fontSize: typography.sizes.xl, color: colors.text.primary },
  listContent: { padding: 20, paddingBottom: 48 },

  // Summary card
  summaryCard: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 24,
    overflow: 'hidden',
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    backgroundColor: colors.accent.yellow,
  },
  summaryLabel: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xs,
    color: '#333',
    marginBottom: 4,
  },
  summaryTotal: {
    fontFamily: typography.fonts.headline,
    fontSize: 32,
    color: colors.text.primary,
    lineHeight: 36,
  },
  summaryCount: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: '#555',
    marginTop: 2,
  },
  summaryProgressWrap: {
    alignItems: 'flex-end',
  },
  summaryProgressLabel: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: '#333',
    marginBottom: 6,
  },
  progressBar: {
    width: 100,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.text.primary,
    borderRadius: 4,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCell: {
    width: '50%',
    alignItems: 'center',
    padding: 16,
    gap: 4,
  },
  statCellBorderRight: {
    borderRightWidth: 2,
    borderRightColor: colors.border,
  },
  statCellBorderTop: {
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  statCellValue: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  statCellLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },

  // Form
  formContainer: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  switchLabel: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },

  // Item card
  card: { padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontFamily: typography.fonts.headline, fontSize: typography.sizes.md, color: colors.text.primary },
  dateText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: colors.text.secondary, marginTop: 2 },
  amountText: { fontFamily: typography.fonts.headline, fontSize: typography.sizes.lg, color: colors.text.primary },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceVariant,
  },
  statusBtnPaid: {
    backgroundColor: colors.accent.green,
    borderColor: colors.border,
  },
  statusBtnText: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  statusBtnTextPaid: {
    color: colors.text.inverse,
  },
  deleteBtn: {
    padding: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.accent.blue,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 4,
    gap: 4,
  },
  companyBadgeText: {
    fontFamily: typography.fonts.headline,
    fontSize: 9,
    color: colors.text.inverse,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  statusFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  filterChipTextActive: {
    color: colors.text.inverse,
  },
});

