import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../api/client';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalInput } from '../../components/BrutalInput';
import { BrutalButton } from '../../components/BrutalButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function AddCaseScreen() {
  const router = useRouter();
  const [caseNo, setCaseNo] = useState('');
  const [title, setTitle] = useState('');
  const [court, setCourt] = useState('');
  const [client, setClient] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await apiClient.post('/cases', {
        caseNo,
        title,
        court,
        clientName: client,
        type,
      });
      router.push('/(tabs)/cases');
    } catch (error) {
      console.error('Failed to save case:', error);
      alert('Dava kaydedilirken bir hata oluştu.');
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
        <Text style={styles.title}>YENİ DAVA EKLE</Text>
        
        <BrutalCard style={styles.card}>
          <BrutalInput 
            label="Dava No (Esas)" 
            icon="tag" 
            placeholder="Örn: 2024/123" 
            value={caseNo}
            onChangeText={setCaseNo}
          />
          <BrutalInput 
            label="Dava Başlığı" 
            icon="title" 
            placeholder="Örn: Yılmaz vs. Kaya" 
            value={title}
            onChangeText={setTitle}
          />
          <BrutalInput 
            label="Mahkeme" 
            icon="account-balance" 
            placeholder="Örn: İstanbul 3. Asliye Ticaret Mahkemesi" 
            value={court}
            onChangeText={setCourt}
          />
          <BrutalInput 
            label="Müvekkil" 
            icon="person" 
            placeholder="Müvekkil Adı" 
            value={client}
            onChangeText={setClient}
          />
          <BrutalInput 
            label="Dava Türü" 
            icon="category" 
            placeholder="Örn: Ticaret, İş, İcra" 
            value={type}
            onChangeText={setType}
          />

          <BrutalButton 
            title={loading ? "KAYDEDİLİYOR..." : "DAVAYI KAYDET"} 
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
