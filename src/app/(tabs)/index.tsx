import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../../api/client';
import { BrutalCard } from '../../components/BrutalCard';
import { StatusBadge } from '../../components/StatusBadge';
import { AuthContext } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { registerForPushNotificationsAsync, syncUpcomingNotifications } from '../../utils/notifications';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ activeCases: 0, upcomingHearings: 0, clientsCount: 0, tasksCount: 0 });
  const [nextHearing, setNextHearing] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, upcomingRes] = await Promise.all([
        apiClient.get('/dashboard'),
        apiClient.get('/events/upcoming')
      ]);
      setStats(dashRes.data.stats);
      setNextHearing(dashRes.data.nextHearing);
      setRecentActivity(dashRes.data.recentActivity);

      // Setup push notifications
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await syncUpcomingNotifications(upcomingRes.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba,</Text>
          <Text style={styles.title}>{user ? user.name : 'Avukat'}</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <MaterialIcons name="notifications-none" size={28} color={colors.text.primary} />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.text.primary} style={{ marginBottom: 32 }} />
      ) : (
        <View style={styles.statsGrid}>
          <TouchableOpacity style={{ width: '48%' }} onPress={() => router.push('/cases')}>
            <BrutalCard style={styles.statCard}>
              <MaterialIcons name="folder-open" size={32} color={colors.accent.blue} />
              <Text style={styles.statValue}>{stats.activeCases}</Text>
              <Text style={styles.statLabel}>Aktif Davalar</Text>
            </BrutalCard>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: '48%' }} onPress={() => router.push('/calendar')}>
            <BrutalCard style={styles.statCard}>
              <MaterialIcons name="gavel" size={32} color={colors.accent.red} />
              <Text style={styles.statValue}>{stats.upcomingHearings}</Text>
              <Text style={styles.statLabel}>Duruşmalar</Text>
            </BrutalCard>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: '48%' }} onPress={() => router.push('/tasks')}>
            <BrutalCard style={styles.statCard}>
              <MaterialIcons name="assignment" size={32} color={colors.accent.yellow} />
              <Text style={styles.statValue}>{stats.tasksCount}</Text>
              <Text style={styles.statLabel}>Görevler</Text>
            </BrutalCard>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: '48%' }} onPress={() => router.push('/client-portal')}>
            <BrutalCard style={styles.statCard}>
              <MaterialIcons name="people" size={32} color={colors.text.primary} />
              <Text style={styles.statValue}>{stats.clientsCount}</Text>
              <Text style={styles.statLabel}>Müvekkiller</Text>
            </BrutalCard>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>HIZLI İŞLEMLER</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/cases/add')}>
          <MaterialIcons name="add" size={24} color={colors.text.primary} />
          <Text style={styles.actionText}>Yeni Dava</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/calendar/add')}>
          <MaterialIcons name="event" size={24} color={colors.text.primary} />
          <Text style={styles.actionText}>Randevu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/expenses')}>
          <MaterialIcons name="receipt" size={24} color={colors.text.primary} />
          <Text style={styles.actionText}>Masraflar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/client-portal')}>
          <MaterialIcons name="people" size={24} color={colors.text.primary} />
          <Text style={styles.actionText}>Müvekkil</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Hearings */}
      <Text style={styles.sectionTitle}>YAKLAŞAN DURUŞMALAR</Text>
      {nextHearing ? (
        <BrutalCard style={styles.hearingCard}>
          <View style={styles.hearingHeader}>
            <Text style={styles.hearingDate}>{nextHearing.date}{nextHearing.time ? `, ${nextHearing.time}` : ''}</Text>
            <StatusBadge label="YAKLAŞIYOR" status="warning" />
          </View>
          <Text style={styles.hearingTitle}>{nextHearing.title}</Text>
          <Text style={styles.hearingSubtitle}>{nextHearing.location || 'Konum belirtilmedi'}</Text>
          <TouchableOpacity 
            style={styles.detailBtn}
            onPress={() => router.push(`/cases/${nextHearing.caseId}`)}
          >
            <Text style={styles.detailBtnText}>DETAY</Text>
          </TouchableOpacity>
        </BrutalCard>
      ) : (
        <Text style={{ color: colors.text.secondary, marginBottom: 32, fontFamily: typography.fonts.body }}>Yaklaşan duruşmanız bulunmuyor.</Text>
      )}

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>SON AKTİVİTELER</Text>
      <View style={styles.activityList}>
        {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: activity.type === 'document' ? colors.accent.blue : colors.accent.green }]}>
              <MaterialIcons name={activity.type === 'document' ? "picture-as-pdf" : "check"} size={20} color={colors.text.inverse} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>{activity.text}</Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          </View>
        )) : (
          <Text style={{ color: colors.text.secondary, marginBottom: 24, fontFamily: typography.fonts.body }}>Henüz bir aktivite bulunmuyor.</Text>
        )}
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
    paddingTop: 64,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  title: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
  },
  notificationBtn: {
    padding: 8,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent.red,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '68%',
    marginBottom: 16,
    
  },
  statValue: {
    fontFamily: typography.fonts.headline,
    fontSize: 32,
    color: colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: 16,
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionBtn: {
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: colors.border,
    width: '23%',
    backgroundColor: colors.surface,
  },
  actionText: {
    fontFamily: typography.fonts.label,
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
  },
  hearingCard: {
    marginBottom: 32,
  },
  hearingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hearingDate: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  hearingTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: 4,
  },
  hearingSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  detailBtn: {
    backgroundColor: colors.accent.yellow,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  detailBtnText: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  activityList: {
    marginBottom: 24,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginBottom: 4,
  },
  activityTime: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
});
