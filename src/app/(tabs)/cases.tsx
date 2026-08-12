import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { BrutalCard } from '../../components/BrutalCard';
import { StatusBadge } from '../../components/StatusBadge';
import { BrutalInput } from '../../components/BrutalInput';
import { FAB } from '../../components/FAB';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function CasesScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/cases');
      setCases(res.data);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    const query = searchQuery.toLocaleLowerCase('tr-TR');
    return (
      (c.title && c.title.toLocaleLowerCase('tr-TR').includes(query)) ||
      (c.caseNo && c.caseNo.toLocaleLowerCase('tr-TR').includes(query)) ||
      (c.clientName && c.clientName.toLocaleLowerCase('tr-TR').includes(query))
    );
  });

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/cases/${item.id}`)}>
      <BrutalCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.caseNo}>{item.caseNo}</Text>
          <StatusBadge 
            label={item.status === 'active' ? 'DEVAM EDİYOR' : 'DİKKAT'} 
            status={item.status} 
          />
        </View>
        <Text style={styles.caseTitle}>{item.title}</Text>
        <Text style={styles.caseCourt}>{item.court}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.caseType}>{item.type} Davası</Text>
          {item.clientName && <Text style={styles.caseClient}>Müvekkil: {item.clientName}</Text>}
        </View>
      </BrutalCard>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>DAVALAR</Text>
        </View>
        <BrutalInput 
          icon="search"
          placeholder="Dava No, Müvekkil veya Başlık Ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={colors.text.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredCases}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onRefresh={loadCases}
          refreshing={loading}
          ListEmptyComponent={<Text style={{ padding: 24, textAlign: 'center' }}>Henüz dava eklenmemiş.</Text>}
        />
      )}
      
      <FAB icon="add" onPress={() => router.push('/cases/add')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  title: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
  },
  listContent: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 100, // Space for FAB
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  caseNo: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  caseTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: 4,
  },
  caseCourt: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  cardFooter: {
    borderTopWidth: 2,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  caseType: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  caseClient: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 4,
  },
});
