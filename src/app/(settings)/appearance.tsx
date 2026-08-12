import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BrutalCard } from '../../components/BrutalCard';
import { AuthContext } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function AppearanceScreen() {
  const { user } = useContext(AuthContext);
  const [selectedTheme, setSelectedTheme] = useState('brutalist');
  const [loading, setLoading] = useState(true);

  const storageKey = `@appearance_theme:${user?.id ?? 'guest'}`;

  const themes = [
    { id: 'brutalist', name: 'Neo-Brutalist (Aktif)', desc: 'Kalın çizgiler, canlı renkler ve modern tasarım.' },
    { id: 'light', name: 'Standart Aydınlık', desc: 'Klasik iOS/Android aydınlık teması.' },
    { id: 'dark', name: 'Gece Modu', desc: 'Göz yormayan koyu renk paleti.' }
  ];

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(storageKey);
        if (savedTheme) {
          setSelectedTheme(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, [storageKey]);

  const handleSelect = async (id: string) => {
    setSelectedTheme(id);

    try {
      await AsyncStorage.setItem(storageKey, id);
      if (id !== 'brutalist') {
        Alert.alert('Bilgi', 'Tema seçiminiz kaydedildi. Uygulamanın genel tema motoru şu anda tek tema ile çalışıyor.');
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      Alert.alert('Hata', 'Tema tercihi kaydedilemedi.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingState]}>
        <ActivityIndicator size="large" color={colors.text.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Uygulama Teması</Text>
      <Text style={styles.headerDesc}>
        Lex Architect şu an için "Neo-Brutalist" tasarım felsefesine uygun olarak geliştirilmiştir.
      </Text>

      {themes.map(theme => (
        <TouchableOpacity 
          key={theme.id} 
          activeOpacity={0.8}
          onPress={() => handleSelect(theme.id)}
        >
          <BrutalCard 
            style={[
              styles.themeCard, 
              selectedTheme === theme.id && styles.activeCard
            ]}
          >
            <View style={styles.themeInfo}>
              <Text style={styles.themeName}>{theme.name}</Text>
              <Text style={styles.themeDesc}>{theme.desc}</Text>
            </View>
            <View style={[styles.radio, selectedTheme === theme.id && styles.radioActive]}>
              {selectedTheme === theme.id && <View style={styles.radioInner} />}
            </View>
          </BrutalCard>
        </TouchableOpacity>
      ))}

      <BrutalCard style={styles.infoCard}>
        <MaterialIcons name="info-outline" size={24} color={colors.text.primary} style={styles.infoIcon} />
        <Text style={styles.infoText}>
          Ek tema seçenekleri gelecek güncellemelerde eklenecektir. Şu anki tasarım markanızın güçlü ve kararlı duruşunu yansıtmak üzere özel olarak hazırlanmıştır.
        </Text>
      </BrutalCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingState: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
  headerTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    marginBottom: 8,
  },
  headerDesc: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 24,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
    opacity: 0.7,
  },
  activeCard: {
    opacity: 1,
    backgroundColor: colors.surfaceVariant,
  },
  themeInfo: {
    flex: 1,
    paddingRight: 16,
  },
  themeName: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: 4,
  },
  themeDesc: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.accent.blue,
    marginTop: 24,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    lineHeight: 20,
  }
});
