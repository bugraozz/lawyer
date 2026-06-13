import { useEffect, useContext } from 'react';
import { Stack as ExpoStack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { AuthProvider, AuthContext } from '../context/AuthContext';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { token, loading } = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'index';

    if (!token && !inAuthGroup) {
      // Redirect to the login page.
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // Redirect away from the login page.
      router.replace('/(tabs)');
    }
  }, [token, segments, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.text.primary} />
      </View>
    );
  }

  return (
    <ExpoStack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <ExpoStack.Screen name="index" options={{ headerShown: false }} />
      <ExpoStack.Screen name="(auth)" options={{ headerShown: false }} />
      <ExpoStack.Screen name="(tabs)" options={{ headerShown: false }} />
      <ExpoStack.Screen name="(settings)" options={{ headerShown: false }} />
      <ExpoStack.Screen name="cases" options={{ headerShown: false }} />
    </ExpoStack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
