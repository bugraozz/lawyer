import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import apiClient from '../../api/client';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalInput } from '../../components/BrutalInput';
import { BrutalButton } from '../../components/BrutalButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function AddEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(params.date || '');
  const [time, setTime] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      return Alert.alert('Uyarı', 'Lütfen etkinlik başlığı giriniz.');
    }
    if (!date.trim()) {
      return Alert.alert('Uyarı', 'Lütfen tarih giriniz.');
    }
    try {
      setLoading(true);
      await apiClient.post('/events', { title, date, time, type, location });
      Alert.alert('Başarılı', 'Etkinlik kaydedildi.', [
        { text: 'Tamam', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Failed to save event:', error);
      Alert.alert('Hata', 'Etkinlik kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>YENİ ETKİNLİK EKLE</Text>
        
        <BrutalCard style={styles.card}>
          <BrutalInput 
            label="Etkinlik Başlığı" 
            icon="title" 
            placeholder="Örn: Müvekkil Görüşmesi" 
            value={title}
            onChangeText={setTitle}
          />
          <BrutalInput 
            label="Tarih" 
            icon="event" 
            placeholder="YYYY-AA-GG (Örn: 2026-06-15)" 
            value={date}
            onChangeText={setDate}
          />
          <BrutalInput 
            label="Saat" 
            icon="schedule" 
            placeholder="SS:DD (Örn: 14:00)" 
            value={time}
            onChangeText={setTime}
          />
          <BrutalInput 
            label="Tür" 
            icon="category" 
            placeholder="Duruşma, Toplantı, Keşif vb." 
            value={type}
            onChangeText={setType}
          />
          <BrutalInput 
            label="Konum/Mahkeme" 
            icon="place" 
            placeholder="Örn: Çağlayan Adliyesi" 
            value={location}
            onChangeText={setLocation}
          />

          <BrutalButton 
            title={loading ? "KAYDEDİLİYOR..." : "ETKİNLİĞİ KAYDET"} 
            fullWidth 
            style={styles.btn} 
            onPress={handleSave} 
          />
        </BrutalCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  title: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    marginBottom: 24,
  },
  card: {
    padding: 24,
  },
  btn: {
    marginTop: 16,
  },
});
