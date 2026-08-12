import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../api/client';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  activeCases: number;
  totalCases: number;
}

export default function ClientPortalScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  const loadClients = async () => {
    try {
      const res = await apiClient.get('/clients');
      setClients(res.data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Müvekkili Sil',
      `${name} müvekkil kaydı silinecektir. Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/clients/${id}`);
              setClients(prev => prev.filter(c => c.id !== id));
            } catch (err) {
              Alert.alert('Hata', 'Müvekkil silinemedi.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Client }) => (
    <View style={styles.clientCard}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: stringToColor(item.name) }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toLocaleUpperCase('tr-TR')}</Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.name}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? colors.accent.green : colors.text.secondary }]} />
            <Text style={styles.statusLabel}>{item.status === 'active' ? 'Aktif' : 'Pasif'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}>
          <MaterialIcons name="delete-outline" size={20} color={colors.accent.red} />
        </TouchableOpacity>
      </View>

      {/* Contact Info */}
      <View style={styles.contactSection}>
        {item.phone ? (
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
            <MaterialIcons name="phone" size={16} color={colors.accent.blue} />
            <Text style={[styles.contactText, { color: colors.accent.blue }]}>{item.phone}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.contactRow}>
            <MaterialIcons name="phone" size={16} color={colors.text.secondary} />
            <Text style={styles.contactTextEmpty}>Telefon eklenmemiş</Text>
          </View>
        )}
        {item.email ? (
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${item.email}`)}>
            <MaterialIcons name="email" size={16} color={colors.accent.blue} />
            <Text style={[styles.contactText, { color: colors.accent.blue }]}>{item.email}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Case Stats Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.activeCases ?? 0}</Text>
          <Text style={styles.statLabel}>Aktif Dava</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.totalCases ?? 0}</Text>
          <Text style={styles.statLabel}>Toplam Dava</Text>
        </View>
      </View>
    </View>
  );

  const activeCount = clients.filter(c => c.status === 'active').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>MÜVEKKİLLER</Text>
          <Text style={styles.subtitle}>{activeCount} aktif müvekkil</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.text.primary} style={{ marginTop: 60 }} />
      ) : clients.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="people-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>Müvekkil Bulunamadı</Text>
          <Text style={styles.emptyDesc}>Dava eklediğinizde veya mevcut bir davaya müvekkil bilgisi girdiğinizde burada görünecektir.</Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onRefresh={loadClients}
          refreshing={loading}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

/** Generates a consistent color from a string (for avatar background) */
function stringToColor(str: string): string {
  const palette = [
    '#F4C430', '#4A90D9', '#E8845C', '#5BB98C', '#A78BFA', '#F87171', '#34D399',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backBtn: {
    padding: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 16,
  },
  title: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  listContent: {
    padding: 20,
    paddingBottom: 48,
  },
  clientCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontFamily: typography.fonts.headline,
    fontSize: 20,
    color: '#1a1a1a',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  deleteBtn: {
    padding: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  contactSection: {
    padding: 14,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    textDecorationLine: 'underline',
  },
  contactTextEmpty: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statDivider: {
    width: 2,
    backgroundColor: colors.border,
  },
  statNumber: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
  },
  statLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
