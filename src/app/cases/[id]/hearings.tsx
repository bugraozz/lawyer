import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../../../api/client';
import { BrutalButton } from '../../../components/BrutalButton';
import { BrutalCard } from '../../../components/BrutalCard';
import { BrutalInput } from '../../../components/BrutalInput';
import { BrutalDateInput } from '../../../components/BrutalDateInput';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export default function CaseHearingsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [hearings, setHearings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadHearings();
  }, [id]);

  const loadHearings = async () => {
    try {
      const res = await apiClient.get(`/cases/${id}/hearings`);
      setHearings(res.data);
    } catch (error) {
      console.error('Failed to load hearings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title || !date) return alert('Lütfen başlık ve tarih giriniz.');
    try {
      setSaving(true);
      await apiClient.post(`/cases/${id}/hearings`, { title, date, time, location });
      setTitle(''); setDate(''); setTime(''); setLocation('');
      loadHearings();
    } catch (error) {
      console.error('Failed to save hearing:', error);
      alert('Duruşma kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
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

  // Apply search filter
  const filteredHearings = hearings.filter(h => {
    if (!searchQuery) return true;
    const q = searchQuery.toLocaleLowerCase('tr-TR');
    return (
      h.title?.toLocaleLowerCase('tr-TR').includes(q) ||
      h.location?.toLocaleLowerCase('tr-TR').includes(q) ||
      formatDisplayDate(h.date).toLocaleLowerCase('tr-TR').includes(q)
    );
  });

  const renderItem = ({ item }: { item: any }) => (
    <BrutalCard style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <TouchableOpacity onPress={async () => {
          try {
            await apiClient.delete(`/cases/${id}/hearings/${item.id}`);
            loadHearings();
          } catch (err) { console.error(err); }
        }}>
          <MaterialIcons name="delete" size={20} color={colors.accent.red} />
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <MaterialIcons name="event" size={16} color={colors.text.secondary} />
        <Text style={styles.cardText}>{formatDisplayDate(item.date)}{item.time ? ` - ${item.time}` : ''}</Text>
      </View>
      {item.location ? (
        <View style={styles.row}>
          <MaterialIcons name="place" size={16} color={colors.text.secondary} />
          <Text style={styles.cardText}>{item.location}</Text>
        </View>
      ) : null}
    </BrutalCard>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredHearings}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onRefresh={loadHearings}
        refreshing={loading}
        ListEmptyComponent={!loading ? <Text style={{ textAlign: 'center', marginTop: 24, color: colors.text.secondary }}>
          {searchQuery ? 'Arama kriterine uygun duruşma bulunamadı.' : 'Henüz duruşma eklenmemiş.'}
        </Text> : null}
        ListHeaderComponent={
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Yeni Duruşma Ekle</Text>
            <BrutalInput placeholder="Duruşma Başlığı (örn: Keşif, Beyan)" value={title} onChangeText={setTitle} />

            {/* Date Picker */}
            <BrutalDateInput
              icon="event"
              placeholder="Tarih Seçin"
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

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <View style={{ width: '48%', marginTop: -12 }}>
                <BrutalDateInput
                  icon="schedule"
                  placeholder="Saat"
                  value={time}
                  onPress={() => setShowTimePicker(true)}
                />

                {showTimePicker && (
                  <DateTimePicker
                    value={time ? (() => {
                      const d = new Date();
                      const [h, m] = time.split(':');
                      d.setHours(Number(h), Number(m));
                      return d;
                    })() : new Date()}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      setShowTimePicker(Platform.OS === 'ios');
                      if (event.type === 'set' && selectedDate) {
                        const hours = String(selectedDate.getHours()).padStart(2, '0');
                        const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
                        setTime(`${hours}:${minutes}`);
                      }
                    }}
                  />
                )}
              </View>
              <View style={{ width: '48%' }}>
                <BrutalInput placeholder="Mahkeme / Konum" value={location} onChangeText={setLocation} />
              </View>
            </View>

            <BrutalButton title={saving ? "EKLENİYOR..." : "DURUŞMA EKLE"} onPress={handleSave} style={{ marginTop: 8 }} />
            <View style={{ height: 24 }} />

            {/* Search Bar */}
            <Text style={styles.sectionTitle}>Duruşma Listesi</Text>
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color={colors.text.secondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Duruşma ara (başlık, yer, tarih)..."
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
            {searchQuery.length > 0 && (
              <Text style={styles.resultCount}>{filteredHearings.length} duruşma bulundu</Text>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingHorizontal: 24, paddingBottom: 48 },
  formContainer: { marginBottom: 16 },
  sectionTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: 16,
  },
  card: { padding: 16, marginBottom: 16 },
  cardTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: 8,
    flex: 1,
    marginRight: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginLeft: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    marginBottom: 12,
  },
  datePickerText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginLeft: 12,
  },
  datePickerPlaceholder: { color: colors.text.secondary },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  resultCount: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 12,
  },
});
