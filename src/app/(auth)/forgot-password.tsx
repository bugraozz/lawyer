import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import apiClient from '../../api/client';
import { BrutalButton } from '../../components/BrutalButton';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalInput } from '../../components/BrutalInput';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);

  const requestCode = async () => {
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/forgot-password', { email: email.trim() });
      setGeneratedCode(res.data.resetCode);
      setResetCode(res.data.resetCode);
      setCodeRequested(true);
      Alert.alert('Kod Oluşturuldu', 'Sıfırlama kodunuz üretildi. Aşağıdaki kodu kullanabilirsiniz.');
    } catch (err: any) {
      Alert.alert('Hata', err.response?.data?.error || 'Sıfırlama kodu oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim() || !resetCode.trim() || !newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        email: email.trim(),
        code: resetCode.trim(),
        newPassword,
      });

      Alert.alert('Başarılı', 'Şifreniz sıfırlandı. Şimdi giriş yapabilirsiniz.', [
        { text: 'Girişe Dön', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err: any) {
      Alert.alert('Hata', err.response?.data?.error || 'Şifre sıfırlanamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>ŞİFRE SIFIRLA</Text>
          <Text style={styles.subtitle}>E-posta adresinizi girin, kod oluşturun ve yeni şifrenizi belirleyin.</Text>
        </View>

        <BrutalCard style={styles.card}>
          <BrutalInput
            label="E-posta Adresi"
            icon="email"
            placeholder="ornek@hukuk.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <BrutalButton
            title={loading ? 'KOD OLUŞTURULUYOR...' : 'KOD OLUŞTUR'}
            fullWidth
            onPress={requestCode}
            style={styles.button}
          />

          {codeRequested && (
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Sıfırlama Kodu</Text>
              <Text style={styles.codeValue}>{generatedCode}</Text>
              <Text style={styles.codeHint}>Bu kod 30 dakika geçerlidir.</Text>
            </View>
          )}

          <BrutalInput
            label="Sıfırlama Kodu"
            icon="vpn-key"
            placeholder="Kodu girin"
            value={resetCode}
            onChangeText={setResetCode}
            autoCapitalize="characters"
          />
          <BrutalInput
            label="Yeni Şifre"
            icon="lock"
            placeholder="••••••••"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <BrutalInput
            label="Yeni Şifre Tekrar"
            icon="lock"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <BrutalButton
            title={loading ? 'SIFIRLANIYOR...' : 'ŞİFREYİ SIFIRLA'}
            fullWidth
            onPress={resetPassword}
            style={styles.button}
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
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
  button: {
    marginTop: 8,
  },
  codeBox: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceVariant,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  codeLabel: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  codeValue: {
    fontFamily: typography.fonts.headline,
    fontSize: 28,
    color: colors.text.primary,
    letterSpacing: 2,
  },
  codeHint: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 8,
  },
});