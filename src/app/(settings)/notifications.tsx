import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function NotificationsScreen() {
  const [prefs, setPrefs] = useState({
    pushMessages: true,
    pushHearings: true,
    pushTasks: false,
    emailSummary: true,
    smsAlerts: false
  });

  const toggleSwitch = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // In a real app, this would save to backend or AsyncStorage
    Alert.alert('Başarılı', 'Bildirim tercihleriniz cihazınıza kaydedildi.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BrutalCard style={styles.card}>
        <Text style={styles.sectionTitle}>Anlık Bildirimler (Push)</Text>
        
        <View style={styles.row}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Yeni Mesajlar</Text>
            <Text style={styles.desc}>Dava içi yazışmalarda mesaj gelince bildir.</Text>
          </View>
          <Switch 
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            value={prefs.pushMessages}
            onValueChange={() => toggleSwitch('pushMessages')}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Duruşma Hatırlatıcıları</Text>
            <Text style={styles.desc}>Yaklaşan duruşmalar için 1 gün önceden bildir.</Text>
          </View>
          <Switch 
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            value={prefs.pushHearings}
            onValueChange={() => toggleSwitch('pushHearings')}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Görev Atamaları</Text>
            <Text style={styles.desc}>Yeni bir görev atandığında bildir.</Text>
          </View>
          <Switch 
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            value={prefs.pushTasks}
            onValueChange={() => toggleSwitch('pushTasks')}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Diğer İletişim Kanalları</Text>

        <View style={styles.row}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>E-posta Özeti</Text>
            <Text style={styles.desc}>Haftalık dava ve masraf özetlerini mail al.</Text>
          </View>
          <Switch 
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            value={prefs.emailSummary}
            onValueChange={() => toggleSwitch('emailSummary')}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>SMS Uyarıları</Text>
            <Text style={styles.desc}>Acil bildirimler için SMS al.</Text>
          </View>
          <Switch 
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            value={prefs.smsAlerts}
            onValueChange={() => toggleSwitch('smsAlerts')}
          />
        </View>

        <BrutalButton 
          title="TERCİHLERİ KAYDET" 
          onPress={handleSave} 
          fullWidth 
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
  sectionTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: 16,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: 4,
  },
  desc: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  divider: {
    height: 2,
    backgroundColor: colors.border,
    marginVertical: 24,
  }
});
