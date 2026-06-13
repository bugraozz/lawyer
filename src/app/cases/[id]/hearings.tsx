import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import { BrutalCard } from '../../../components/BrutalCard';
import { BrutalInput } from '../../../components/BrutalInput';
import { BrutalButton } from '../../../components/BrutalButton';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export default function CaseHearingsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [hearings, setHearings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

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
        <Text style={styles.cardText}>{item.date} - {item.time}</Text>
      </View>
      <View style={styles.row}>
        <MaterialIcons name="place" size={16} color={colors.text.secondary} />
        <Text style={styles.cardText}>{item.location}</Text>
      </View>
    </BrutalCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>DURUŞMALAR</Text>
      </View>

      <FlatList
        data={hearings}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onRefresh={loadHearings}
        refreshing={loading}
        ListEmptyComponent={!loading ? <Text style={{ textAlign: 'center', marginTop: 24 }}>Henüz duruşma eklenmemiş.</Text> : null}
        ListHeaderComponent={
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Yeni Duruşma Ekle</Text>
            <BrutalInput placeholder="Duruşma Başlığı" value={title} onChangeText={setTitle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: '48%' }}>
                <BrutalInput placeholder="Tarih (GG.AA.YYYY)" value={date} onChangeText={setDate} />
              </View>
              <View style={{ width: '48%' }}>
                <BrutalInput placeholder="Saat (SS:DD)" value={time} onChangeText={setTime} />
              </View>
            </View>
            <BrutalInput placeholder="Konum / Mahkeme" value={location} onChangeText={setLocation} />
            <BrutalButton title={saving ? "EKLENİYOR..." : "DURUŞMA EKLE"} onPress={handleSave} style={{ marginTop: 8 }} />
            <View style={{ height: 24 }} />
            <Text style={styles.sectionTitle}>Duruşma Listesi</Text>
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
  cardTitle: { fontFamily: typography.fonts.headline, fontSize: typography.sizes.md, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: colors.text.secondary, marginLeft: 8 },
});
