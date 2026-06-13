import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BrutalCard } from '../../components/BrutalCard';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function HelpScreen() {

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("URL açılamadı:", err));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <MaterialIcons name="support-agent" size={64} color={colors.primary} />
        <Text style={styles.title}>Nasıl Yardımcı Olabiliriz?</Text>
        <Text style={styles.desc}>
          Lex Architect kullanımıyla ilgili sorun yaşıyorsanız veya özellik isteğinde bulunmak istiyorsanız destek ekibimizle iletişime geçebilirsiniz.
        </Text>
      </View>

      <TouchableOpacity onPress={() => openLink('mailto:destek@lexarchitect.com')} activeOpacity={0.8}>
        <BrutalCard style={styles.contactCard}>
          <View style={styles.iconBox}>
            <MaterialIcons name="mail-outline" size={28} color={colors.text.inverse} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>E-Posta Desteği</Text>
            <Text style={styles.contactValue}>destek@lexarchitect.com</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={24} color={colors.text.primary} />
        </BrutalCard>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => openLink('tel:+905555555555')} activeOpacity={0.8}>
        <BrutalCard style={styles.contactCard}>
          <View style={[styles.iconBox, { backgroundColor: colors.accent.green }]}>
            <MaterialIcons name="phone" size={28} color={colors.text.primary} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Telefon Desteği (VIP)</Text>
            <Text style={styles.contactValue}>+90 555 555 55 55</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={24} color={colors.text.primary} />
        </BrutalCard>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.8}>
        <BrutalCard style={styles.contactCard}>
          <View style={[styles.iconBox, { backgroundColor: colors.accent.yellow }]}>
            <MaterialIcons name="menu-book" size={28} color={colors.text.primary} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Kullanım Kılavuzu</Text>
            <Text style={styles.contactValue}>Uygulama dökümantasyonu</Text>
          </View>
          <MaterialIcons name="open-in-new" size={24} color={colors.text.primary} />
        </BrutalCard>
      </TouchableOpacity>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Lex Architect v1.0.0</Text>
        <Text style={styles.copyrightText}>© 2026 Tüm hakları saklıdır.</Text>
      </View>
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
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 16,
  },
  title: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  contactValue: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 4,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  versionText: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  copyrightText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 4,
  }
});
