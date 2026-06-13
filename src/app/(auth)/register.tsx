import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalInput } from '../../components/BrutalInput';
import { BrutalButton } from '../../components/BrutalButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [barNo, setBarNo] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Hata', 'Lütfen Ad, E-posta ve Şifre alanlarını doldurun.');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', {
        name,
        email,
        phone,
        barNo,
        password
      });
      await login(res.data.token, res.data.user);
    } catch (err: any) {
      Alert.alert('Hata', err.response?.data?.error || 'Kayıt işlemi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>YENİ KAYIT</Text>
          <Text style={styles.subtitle}>Sisteme dahil olmak için bilgilerinizi girin</Text>
        </View>

        <BrutalCard style={styles.card}>
          <BrutalInput
            label="Ad Soyad"
            icon="person"
            placeholder="Av. İsim Soyisim"
            value={name}
            onChangeText={setName}
          />
          <BrutalInput
            label="E-posta Adresi"
            icon="email"
            placeholder="ornek@hukuk.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <BrutalInput
            label="Telefon Numarası"
            icon="phone"
            placeholder="0555 555 55 55"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <BrutalInput
            label="Baro Sicil No"
            icon="badge"
            placeholder="12345"
            value={barNo}
            onChangeText={setBarNo}
            keyboardType="numeric"
          />
          <BrutalInput
            label="Şifre"
            icon="lock"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <BrutalInput
            label="Şifre Tekrar"
            icon="lock"
            placeholder="••••••••"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureTextEntry
          />

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>Kayıt olarak Kullanım Koşullarını kabul etmiş sayılırsınız.</Text>
          </View>

          <BrutalButton 
            title={loading ? "KAYIT OLUNUYOR..." : "KAYIT OL"} 
            fullWidth 
            style={styles.button}
            onPress={handleRegister}
          />
        </BrutalCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
          <Link href="/(auth)/login">
            <Text style={[styles.linkText, { fontWeight: 'bold' }]}>Giriş Yap</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 64,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontFamily: typography.fonts.headline,
    fontSize: 40,
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  card: {
    padding: 24,
  },
  termsContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  termsText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  linkText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.accent.blue,
  },
  button: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 48,
  },
  footerText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
});
