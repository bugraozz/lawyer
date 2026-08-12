import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../../api/client';
import { BrutalButton } from '../../components/BrutalButton';
import { BrutalInput } from '../../components/BrutalInput';
import { BrutalDateInput } from '../../components/BrutalDateInput';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function AddExpenseScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showCaseList, setShowCaseList] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCompanyExpense, setIsCompanyExpense] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const res = await apiClient.get('/cases');
      setCases(res.data);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title || !amount) return alert('Lütfen başlık ve tutar giriniz.');
    if (!isCompanyExpense && !selectedCase) return alert('Lütfen bir dava seçin veya şirket masrafı olarak kaydedin.');

    try {
      setSaving(true);
      await apiClient.post('/expenses', {
        title,
        amount,
        date,
        status: 'pending',
        isCompanyExpense,
        caseId: selectedCase ? selectedCase.id : null,
      });
      router.push('/expenses');
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Masraf kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const clearSelection = () => {
    setSelectedCase(null);
    setShowCaseList(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Tarih Seçin';
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
      return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
    }
    return dateStr;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '' }} />
      <View style={styles.header}>

        <Text style={styles.title}>MASRAF EKLE</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Yeni Masraf Bilgisi</Text>
        <BrutalInput
          placeholder="Masraf Başlığı (Örn: Tevzi Harcı)"
          value={title}
          onChangeText={setTitle}
        />
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <BrutalInput
              placeholder="Tutar (TL)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.halfWidth, { justifyContent: 'center', marginTop: 12 }]}>
            <BrutalDateInput
              icon="event"
              placeholder="Tarih"
              value={formatDisplayDate(date)}
              onPress={() => setShowDatePicker(true)}
            />
            {showDatePicker && (
              <DateTimePicker
                value={date ? new Date(date) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (event.type === 'set' && selectedDate) {
                    const year = selectedDate.getFullYear();
                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(selectedDate.getDate()).padStart(2, '0');
                    setDate(`${year}-${month}-${day}`);
                  }
                }}
              />
            )}
          </View>
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Şirket Masrafı Olarak Kaydet</Text>
          <TouchableOpacity
            style={[styles.toggle, isCompanyExpense ? styles.toggleOn : styles.toggleOff]}
            onPress={() => setIsCompanyExpense(!isCompanyExpense)}
          >
            <MaterialIcons
              name={isCompanyExpense ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Dava Seçimi (Opsiyonel)</Text>
        <TouchableOpacity style={styles.caseSelector} onPress={() => setShowCaseList(!showCaseList)}>
          <View>
            <Text style={styles.caseSelectorLabel}>Masrafı hangi davaya ait kaydetmek istersiniz?</Text>
            <Text style={styles.caseSelectorValue}>
              {selectedCase ? `${selectedCase.title} (${selectedCase.caseNo})` : 'Herhangi bir dava seçilmedi'}
            </Text>
          </View>
          <MaterialIcons name={showCaseList ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={28} color={colors.text.primary} />
        </TouchableOpacity>

        {showCaseList && (
          <View style={styles.caseListContainer}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : cases.length === 0 ? (
              <Text style={styles.emptyText}>Henüz dava bulunmamaktadır.</Text>
            ) : (
              <FlatList
                data={cases}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.caseItem}
                    onPress={() => {
                      setSelectedCase(item);
                      setShowCaseList(false);
                    }}
                  >
                    <Text style={styles.caseItemTitle}>{item.title}</Text>
                    <Text style={styles.caseItemSubtitle}>{item.caseNo} {item.clientName ? `- ${item.clientName}` : ''}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {selectedCase && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearSelection}>
            <MaterialIcons name="close" size={18} color={colors.accent.red} />
            <Text style={styles.clearText}>Seçimi Temizle</Text>
          </TouchableOpacity>
        )}

        <BrutalButton
          title={saving ? 'KAYDEDİLİYOR...' : 'MASRAF KAYDET'}
          onPress={handleSave}
          style={{ marginTop: 16 }}
        />
      </View>
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
  formContainer: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  toggle: {
    padding: 4,
  },
  toggleOn: {
    backgroundColor: colors.surface,
  },
  toggleOff: {
    backgroundColor: colors.surface,
  },
  caseSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 8,
  },
  caseSelectorLabel: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  caseSelectorValue: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  caseListContainer: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxHeight: 240,
    marginBottom: 8,
  },
  caseItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  datePickerButton: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    height: 52,
    justifyContent: 'center',
  },
  datePickerText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  datePickerPlaceholder: {
    color: colors.text.secondary,
  },
  caseItemTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  caseItemSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 4,
  },
  emptyText: {
    padding: 16,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  clearText: {
    marginLeft: 6,
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.sm,
    color: colors.accent.red,
  },
});
