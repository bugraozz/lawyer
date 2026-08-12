import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import apiClient from '../../api/client';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalInput } from '../../components/BrutalInput';
import { BrutalDateInput } from '../../components/BrutalDateInput';
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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

          <BrutalDateInput
            label="Tarih"
            icon="event"
            placeholder="Tarih Seçin"
            value={date}
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

          <BrutalDateInput
            label="Saat"
            icon="schedule"
            placeholder="Saat Seçin"
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
  label: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 8,
    marginTop: 8,
  },
  pickerButton: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 16,
  },
  pickerButtonText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
});
