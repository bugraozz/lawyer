import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../theme/colors';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontFamily: 'Inter-Bold',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="account" options={{ title: 'Hesap Bilgileri' }} />
      <Stack.Screen name="notifications" options={{ title: 'Bildirim Tercihleri' }} />
      <Stack.Screen name="security" options={{ title: 'Güvenlik ve Şifre' }} />
      <Stack.Screen name="appearance" options={{ title: 'Görünüm' }} />
      <Stack.Screen name="help" options={{ title: 'Yardım ve Destek' }} />
    </Stack>
  );
}
