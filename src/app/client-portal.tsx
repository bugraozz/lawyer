import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { BrutalCard } from '../components/BrutalCard';
import { StatusBadge } from '../components/StatusBadge';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function ClientPortalScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

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

  const renderItem = ({ item }: { item: any }) => (
    <BrutalCard style={styles.clientCard}>
      <View style={styles.clientHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.name}</Text>
          <Text style={styles.clientMeta}>Aktif Dava: {item.activeCases || 0}</Text>
        </View>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>YÖNET</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, { marginLeft: 8, borderColor: colors.accent.red }]}
          onPress={async () => {
            try {
              await apiClient.delete(`/clients/${item.id}`);
              loadClients();
            } catch (err) { console.error(err); }
          }}
        >
          <MaterialIcons name="delete" size={16} color={colors.accent.red} />
        </TouchableOpacity>
      </View>
      <View style={styles.clientFooter}>
        <Text style={styles.lastLogin}>Son Giriş: {item.lastLogin || 'Giriş Yapmadı'}</Text>
        <StatusBadge label={item.status === 'active' ? 'AKTİF' : 'PASİF'} status={item.status} />
      </View>
    </BrutalCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>MÜVEKKİL PORTALI</Text>
      </View>

      <View style={{ paddingHorizontal: 24 }}>
        <BrutalCard style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={24} color={colors.accent.blue} />
          <Text style={styles.infoText}>
            Müvekkilleriniz portal üzerinden davalarını takip edebilir, belge yükleyebilir ve size mesaj gönderebilir.
          </Text>
        </BrutalCard>
        <Text style={styles.sectionTitle}>MÜVEKKİLLER</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.text.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={clients}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.content}
          onRefresh={loadClients}
          refreshing={loading}
          ListEmptyComponent={<Text style={{ textAlign: 'center' }}>Sistemde kayıtlı müvekkil bulunmuyor.</Text>}
        />
      )}
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
    alignItems: 'center',
    padding: 24,
    paddingTop: 64,
    paddingBottom: 16,
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
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: colors.surfaceVariant,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginLeft: 12,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: 16,
  },
  clientCard: {
    marginBottom: 16,
    padding: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.yellow,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: typography.fonts.headline,
    fontSize: 20,
    color: colors.text.primary,
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
  clientMeta: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionText: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },
  clientFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  lastLogin: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
});
