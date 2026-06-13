import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import { BrutalCard } from '../../../components/BrutalCard';
import { BrutalInput } from '../../../components/BrutalInput';
import { BrutalButton } from '../../../components/BrutalButton';
import { StatusBadge } from '../../../components/StatusBadge';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export default function CaseExpensesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
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
      await apiClient.post(`/cases/${id}/expenses`, { title, amount, date, status: 'pending', isCompanyExpense });
      setTitle(''); setAmount(''); setDate(''); setIsCompanyExpense(false);
      loadExpenses();
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Masraf kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <BrutalCard style={styles.card}>
      {item.isCompanyExpense === 1 && (
        <View style={styles.companyBadge}>
          <MaterialIcons name="business" size={12} color={colors.text.inverse} />
          <Text style={styles.companyBadgeText}>ŞİRKET</Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.amountText}>{item.amount} TL</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <Text style={styles.dateText}>{item.date || 'Tarih Yok'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <StatusBadge label={item.status === 'paid' ? 'ÖDENDİ' : 'BEKLİYOR'} status={item.status === 'paid' ? 'active' : 'warning'} />
          <TouchableOpacity style={{ marginLeft: 16 }} onPress={async () => {
            try {
              await apiClient.delete(`/cases/${id}/expenses/${item.id}`);
              loadExpenses();
            } catch (err) { console.error(err); }
          }}>
            <MaterialIcons name="delete" size={20} color={colors.accent.red} />
          </TouchableOpacity>
        </View>
      </View>
    </BrutalCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>MASRAFLAR</Text>
      </View>

      <FlatList
        data={expenses}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onRefresh={loadExpenses}
        refreshing={loading}
        ListEmptyComponent={!loading ? <Text style={{ textAlign: 'center', marginTop: 24 }}>Henüz masraf eklenmemiş.</Text> : null}
        ListHeaderComponent={
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Yeni Masraf Ekle</Text>
            <BrutalInput placeholder="Masraf Başlığı (Örn: Tevzi Harcı)" value={title} onChangeText={setTitle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: '48%' }}>
                <BrutalInput placeholder="Tutar (TL)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
              </View>
              <View style={{ width: '48%' }}>
                <BrutalInput placeholder="Tarih (GG.AA.YYYY)" value={date} onChangeText={setDate} />
              </View>
            </View>
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
            <View style={{ height: 24 }} />
            <Text style={styles.sectionTitle}>Masraf Listesi</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 64, paddingBottom: 16 },
  backBtn: { padding: 8, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, marginRight: 16 },
  title: { fontFamily: typography.fonts.headline, fontSize: typography.sizes.xl, color: colors.text.primary },
  listContent: { paddingHorizontal: 24, paddingBottom: 48 },
  formContainer: { marginBottom: 16 },
  sectionTitle: { fontFamily: typography.fonts.headline, fontSize: typography.sizes.lg, marginBottom: 16 },
  card: { padding: 16, marginBottom: 16 },
  cardTitle: { fontFamily: typography.fonts.headline, fontSize: typography.sizes.md, flex: 1, marginRight: 8 },
  amountText: { fontFamily: typography.fonts.headline, fontSize: typography.sizes.lg, color: colors.text.primary },
  dateText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: colors.text.secondary },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingVertical: 12, paddingHorizontal: 4, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
  switchLabel: { fontFamily: typography.fonts.headline, fontSize: typography.sizes.sm, color: colors.text.primary, marginLeft: 8 },
  companyBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8, borderWidth: 2, borderColor: colors.border },
  companyBadgeText: { fontFamily: typography.fonts.headline, fontSize: 10, color: colors.text.inverse, marginLeft: 4 },
});
