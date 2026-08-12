import { Link, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import apiClient from '../../api/client';
import { BrutalButton } from '../../components/BrutalButton';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalInput } from '../../components/BrutalInput';
import { AuthContext } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      await login(res.data.token, res.data.user);
    } catch (err: any) {
      Alert.alert('Hata', err.response?.data?.error || 'Giriş yapılamadı.');
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
          <Text style={styles.title}>AVUKAT{'\n'}GİRİŞİ</Text>
          <Text style={styles.subtitle}>Hukuk bürosu yönetim sisteminize giriş yapın</Text>
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
          <BrutalInput
            label="Şifre"
            icon="lock"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View style={styles.forgotPasswordContainer}>
            <Link href="/(auth)/forgot-password">
              <Text style={styles.linkText}>Şifremi Unuttum</Text>
            </Link>
          </View>

          <BrutalButton 
            title={loading ? "GİRİŞ YAPILIYOR..." : "GİRİŞ YAP"} 
            fullWidth 
            style={styles.button}
            onPress={handleLogin}
          />
        </BrutalCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Henüz hesabınız yok mu? </Text>
          <Link href="/(auth)/register">
            <Text style={[styles.linkText, { fontWeight: 'bold' }]}>Kayıt Ol</Text>
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
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontFamily: typography.fonts.headline,
    fontSize: 48,
    color: colors.text.primary,
    lineHeight: 48,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  card: {
    padding: 24,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
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
  },
  footerText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
});
