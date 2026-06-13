import { Stack } from 'expo-router';
import { colors } from '../../theme/colors';

export default function CasesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="[id]/index" 
        options={{ title: 'Dava Detayı' }} 
      />
      <Stack.Screen 
        name="[id]/notes" 
        options={{ title: 'Notlar & Görevler' }} 
      />
      <Stack.Screen 
        name="[id]/documents" 
        options={{ title: 'Belge Yönetimi' }} 
      />
      <Stack.Screen 
        name="[id]/collaboration" 
        options={{ title: 'İş Birliği' }} 
      />
      <Stack.Screen 
        name="[id]/messages" 
        options={{ title: 'Mesajlaşma' }} 
      />
    </Stack>
  );
}
