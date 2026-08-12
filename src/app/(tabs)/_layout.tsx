import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

export default function TabLayout() {
  const { user } = useContext(AuthContext);
  
  if (user?.role === 'admin') {
    return <Redirect href="/admin" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent.yellow,
        tabBarInactiveTintColor: colors.surfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.primary,
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Panel',
          tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'Davalar',
          tabBarIcon: ({ color }) => <MaterialIcons name="folder" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Ajanda',
          tabBarIcon: ({ color }) => <MaterialIcons name="calendar-today" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Raporlar',
          tabBarIcon: ({ color }) => <MaterialIcons name="bar-chart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
