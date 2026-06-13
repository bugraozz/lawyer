import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import apiClient from '../../api/client';

export default function SecurityScreen() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSave = async () => {
    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }

    if (form.newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put('/profile/password', {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      });
      Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi.');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 400) {
        Alert.alert('Hata', err.response.data.error || 'Eski şifre yanlış.');
      } else {
        Alert.alert('Hata', 'Şifre değiştirilirken bir sorun oluştu.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BrutalCard style={styles.card}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Güvenliğiniz için şifrenizi kimseyle paylaşmayın. Şifre değişikliğinden sonra mevcut oturumunuz açık kalacaktır.
          </Text>
        </View>

        <Text style={styles.label}>Eski Şifre</Text>
        <TextInput 
          style={styles.input}
          value={form.oldPassword}
          onChangeText={(txt) => setForm({...form, oldPassword: txt})}
          secureTextEntry
          placeholder="Mevcut şifreniz"
        />

        <Text style={styles.label}>Yeni Şifre</Text>
        <TextInput 
          style={styles.input}
          value={form.newPassword}
          onChangeText={(txt) => setForm({...form, newPassword: txt})}
          secureTextEntry
          placeholder="Yeni şifreniz (En az 6 karakter)"
        />

        <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
        <TextInput 
          style={styles.input}
          value={form.confirmPassword}
          onChangeText={(txt) => setForm({...form, confirmPassword: txt})}
          secureTextEntry
          placeholder="Yeni şifrenizi tekrar girin"
        />

        <BrutalButton 
          title={saving ? "GÜNCELLENİYOR..." : "ŞİFREYİ GÜNCELLE"} 
          onPress={handleSave} 
          disabled={saving}
          fullWidth 
          variant="secondary"
          style={{ marginTop: 24 }}
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
  infoBox: {
    backgroundColor: colors.surfaceVariant,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 24,
  },
  infoText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
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
