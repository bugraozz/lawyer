import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function NotificationsScreen() {
  const [filter, setFilter] = useState('Tümü');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'hearing': return { name: 'gavel', color: colors.accent.blue };
      case 'deadline': return { name: 'timer', color: colors.accent.red };
      case 'case': return { name: 'folder', color: colors.accent.yellow };
      case 'message': return { name: 'message', color: colors.accent.green };
      default: return { name: 'info', color: colors.text.secondary };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const iconData = getIcon(item.type);
    return (
      <View style={[styles.notificationItem, item.unread && styles.unreadItem]}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={iconData.name as any} size={24} color={iconData.color} />
          {item.unread ? <View style={styles.unreadDot} /> : null}
        </View>
        <View style={styles.content}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifDesc}>{item.desc}</Text>
          <Text style={styles.notifTime}>{item.time}</Text>
        </View>
      </View>
    );
  };

  const filteredNotifications = notifications.filter(item => {
    if (filter === 'Tümü') return true;
    if (filter === 'Okunmayanlar' && item.unread) return true;
    if (filter === 'Duruşma' && item.type === 'hearing') return true;
    if (filter === 'Süre' && item.type === 'deadline') return true;
    if (filter === 'Dava' && item.type === 'case') return true;
    return false;
  });

  if (loading) {
    return <ActivityIndicator size="large" color={colors.text.primary} style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BİLDİRİMLER</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.readAllText}>Tümünü Okundu İşaretle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {['Tümü', 'Okunmayanlar', 'Duruşma', 'Süre', 'Dava'].map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterChip, filter === f && styles.activeFilter]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredNotifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 24,
    paddingTop: 64,
    paddingBottom: 16,
  },
  title: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
  },
  readAllText: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.sm,
    color: colors.accent.blue,
  },
  filtersWrapper: {
    marginBottom: 16,
  },
  filters: {
    paddingHorizontal: 24,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  activeFilter: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  activeFilterText: {
    color: colors.text.inverse,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  unreadItem: {
    backgroundColor: colors.background,
  },
  iconContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent.yellow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
  },
  notifTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: 4,
  },
  notifDesc: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  notifTime: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
});
