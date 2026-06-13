import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BrutalCard } from '../../../components/BrutalCard';
import { StatusBadge } from '../../../components/StatusBadge';
import { BrutalButton } from '../../../components/BrutalButton';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

const mockTeam = [
  { id: '1', name: 'Av. Mehmet', role: 'Kıdemli Avukat', perm: 'Tam Yetki', online: true },
  { id: '2', name: 'Av. Zeynep', role: 'Avukat', perm: 'Düzenleme', online: false },
  { id: '3', name: 'Stj. Ali', role: 'Stajyer', perm: 'Okuma', online: true },
];

export default function CaseCollaborationScreen() {
  const [activeTab, setActiveTab] = useState<'ekip' | 'paylasim' | 'aktivite'>('ekip');

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ekip' && styles.activeTab]}
          onPress={() => setActiveTab('ekip')}
        >
          <Text style={[styles.tabText, activeTab === 'ekip' && styles.activeTabText]}>Ekip</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'paylasim' && styles.activeTab]}
          onPress={() => setActiveTab('paylasim')}
        >
          <Text style={[styles.tabText, activeTab === 'paylasim' && styles.activeTabText]}>Paylaşım</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'aktivite' && styles.activeTab]}
          onPress={() => setActiveTab('aktivite')}
        >
          <Text style={[styles.tabText, activeTab === 'aktivite' && styles.activeTabText]}>Aktivite</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'ekip' && (
          <View>
            <BrutalButton title="EKİP ÜYESİ EKLE" fullWidth style={{ marginBottom: 24 }} />
            
            {mockTeam.map(member => (
              <BrutalCard key={member.id} style={styles.memberCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{member.name.charAt(4)}</Text>
                  {member.online && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
                <View style={styles.memberActions}>
                  <StatusBadge label={member.perm} status={member.perm === 'Tam Yetki' ? 'active' : 'default'} style={{ marginBottom: 8 }} />
                  <TouchableOpacity>
                    <Text style={styles.actionLink}>Yetki Değiştir</Text>
                  </TouchableOpacity>
                </View>
              </BrutalCard>
            ))}
          </View>
        )}

        {activeTab === 'aktivite' && (
          <View>
            <View style={styles.timelineItem}>
              <View style={styles.timelineLine} />
              <View style={styles.timelineIcon}>
                <MaterialIcons name="upload-file" size={16} color={colors.text.inverse} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineText}><Text style={{fontWeight: 'bold'}}>Stj. Ali</Text> "Bilirkişi Raporu.pdf" belgesini yükledi.</Text>
                <Text style={styles.timelineTime}>Bugün, 14:30</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={styles.timelineIcon}>
                <MaterialIcons name="note-add" size={16} color={colors.text.inverse} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineText}><Text style={{fontWeight: 'bold'}}>Av. Mehmet</Text> "Duruşma Notu" ekledi.</Text>
                <Text style={styles.timelineTime}>Dün, 10:15</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 3,
    borderBottomColor: colors.border,
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 4,
    borderBottomColor: colors.accent.yellow,
  },
  tabText: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.text.primary,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceVariant,
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
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.accent.green,
    borderWidth: 2,
    borderColor: colors.border,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: 4,
  },
  memberRole: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  memberActions: {
    alignItems: 'flex-end',
  },
  actionLink: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.xs,
    color: colors.accent.blue,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: -24,
    width: 2,
    backgroundColor: colors.border,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    zIndex: 2,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginBottom: 4,
  },
  timelineTime: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
});
