import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import apiClient from '../../api/client';
import { AuthContext } from '../../context/AuthContext';

export default function AccountScreen() {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    barNo: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/profile');
      setForm({
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        barNo: res.data.barNo || ''
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Hata', 'Profil bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name) {
      Alert.alert('Hata', 'İsim alanı boş bırakılamaz.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put('/profile', {
        name: form.name,
        phone: form.phone,
        barNo: form.barNo
      });
      // Update global context user name
      if (user) {
        setUser({ ...user, name: form.name });
      }
      Alert.alert('Başarılı', 'Hesap bilgileri güncellendi.');
    } catch (err) {
      console.error(err);
      Alert.alert('Hata', 'Güncelleme sırasında bir sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BrutalCard style={styles.card}>
        <Text style={styles.label}>E-posta Adresi (Değiştirilemez)</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text.secondary }]}
          value={form.email}
          editable={false}
        />

        <Text style={styles.label}>Ad Soyad</Text>
        <TextInput 
          style={styles.input}
          value={form.name}
          onChangeText={(txt) => setForm({...form, name: txt})}
          placeholder="Av. İsim Soyisim"
        />

        <Text style={styles.label}>Telefon Numarası</Text>
        <TextInput 
          style={styles.input}
          value={form.phone}
          onChangeText={(txt) => setForm({...form, phone: txt})}
          placeholder="05XX XXX XX XX"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Baro Sicil Numarası</Text>
        <TextInput 
          style={styles.input}
          value={form.barNo}
          onChangeText={(txt) => setForm({...form, barNo: txt})}
          placeholder="Örn: 12345"
          keyboardType="numeric"
        />

        <BrutalButton 
          title={saving ? "Kaydediliyor..." : "DEĞİŞİKLİKLERİ KAYDET"} 
          onPress={handleSave} 
          disabled={saving}
          fullWidth 
          style={{ marginTop: 16 }}
        />
      </BrutalCard>
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
  },
  card: {
    padding: 24,
  },
  label: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
});
