import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function HearingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [allHearings, setAllHearings] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [upcomingRes, allHearingsRes] = await Promise.all([
        apiClient.get('/events/upcoming'),
        apiClient.get('/events/all-hearings')
      ]);
      setUpcoming(upcomingRes.data);
      setAllHearings(allHearingsRes.data);
    } catch (error) {
      console.error('Error loading hearings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (dateStr: string) => {
    if (!dateStr) return '';
    let dStr = dateStr;
    if (dStr.includes('.')) {
      const parts = dStr.split('.');
      if (parts.length === 3) dStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const d = new Date(dStr);
    const months = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
    return months[d.getMonth()] || '';
  };

  const getDay = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('.')) return dateStr.split('.')[0];
    return dateStr.split('-')[2];
  };

  const formatHearingDate = (dateStr: string) => {
    if (!dateStr) return '';
    let dStr = dateStr;
    if (dStr.includes('.')) {
      const parts = dStr.split('.');
      if (parts.length === 3) dStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const targetDate = new Date(dStr);
    targetDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'BUGÜN';
    if (diffDays === 1) return 'YARIN';

    // Diğerleri: GG.AA.YYYY formatında göster
    const d = targetDate;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };
  
  const getDaysLeftCount = (dateStr: string): number => {
    if (!dateStr) return 999;
    let dStr = dateStr;
    if (dStr.includes('.')) {
      const parts = dStr.split('.');
      if (parts.length === 3) dStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const targetDate = new Date(dStr);
    targetDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getSourceLabel = (source: string) => {
    if (source === 'hearing') return 'DURUŞMA';
    if (source === 'task') return 'GÖREV';
    return 'ETKİNLİK';
  };

  const getSourceIcon = (source: string): any => {
    if (source === 'hearing') return 'gavel';
    if (source === 'task') return 'assignment';
    return 'event';
  };

  const renderCriticalDeadlines = () => {
    if (upcoming.length === 0) return null;

    // Kırmızı: 0-3 gün, Sarı: 4-14 gün, Beyaz liste: 15+ gün
    const urgentTasks = upcoming.filter(item => getDaysLeftCount(item.date) <= 3);
    const soonTasks = upcoming.filter(item => getDaysLeftCount(item.date) > 3 && getDaysLeftCount(item.date) <= 14);
    const otherTasks = upcoming.filter(item => getDaysLeftCount(item.date) > 14);

    return (
      <View style={{ marginBottom: 48 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 16, height: 16, backgroundColor: colors.accent.red, marginRight: 12 }} />
          <Text style={{ fontFamily: typography.fonts.headline, fontSize: 24, fontWeight: 'bold', color: colors.primary, textTransform: 'uppercase' }}>
            KRİTİK SÜRELER
          </Text>
        </View>

        <View style={{ flexDirection: 'column', gap: 24 }}>
          {urgentTasks.map((task) => (
            <View key={task.id} style={[styles.brutalContainer, { backgroundColor: '#ffdad6', flex: 1 }]}>
              <View style={{ backgroundColor: colors.accent.red, padding: 12, borderBottomWidth: 3, borderBottomColor: colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name={getSourceIcon(task.source)} size={18} color={colors.text.inverse} />
                  <Text style={{ fontFamily: typography.fonts.headline, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, fontSize: 14, color: colors.text.inverse, marginLeft: 8 }}>
                    {getSourceLabel(task.source)}
                  </Text>
                </View>
                <Text style={{ fontFamily: typography.fonts.headline, fontWeight: '900', fontSize: 20, color: colors.text.inverse, textTransform: 'uppercase' }}>
                  {formatHearingDate(task.date)} {task.time || ''}
                </Text>
              </View>
              <View style={{ padding: 20, flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontFamily: typography.fonts.headline, fontWeight: 'bold', fontSize: 24, marginBottom: 4, color: colors.primary }}>
                    {task.title || 'Başlık Belirtilmemiş'}
                  </Text>
                  <Text style={{ fontFamily: typography.fonts.body, fontSize: 14, fontWeight: '500', opacity: 0.8, marginBottom: 16, color: colors.primary }}>
                    {task.source === 'task'
                      ? (task.caseTitle ? `Dava: ${task.caseTitle}` : 'Genel Görev')
                      : (task.caseTitle ? `Dava: ${task.caseTitle}` : (task.caseNo ? `Esas No: ${task.caseNo}` : '-'))
                    }
                  </Text>
                  <View style={{ gap: 8 }}>
                    {task.source === 'hearing' && (
                      <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.primary, paddingBottom: 4 }}>
                          <Text style={{ fontFamily: typography.fonts.body, fontWeight: 'bold', color: colors.primary }}>Mahkeme:</Text>
                          <Text style={{ fontFamily: typography.fonts.body, color: colors.primary, textAlign: 'right', flex: 1 }}>{task.court || task.location || '-'}</Text>
                        </View>
                      </>
                    )}
                    {task.source === 'task' && task.caseTitle && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.primary, paddingBottom: 4 }}>
                        <Text style={{ fontFamily: typography.fonts.body, fontWeight: 'bold', color: colors.primary }}>Bağlı Dava:</Text>
                        <Text style={{ fontFamily: typography.fonts.body, color: colors.primary, textAlign: 'right', flex: 1 }}>{task.caseTitle}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity style={styles.brutalButton} onPress={() => {
                  if (task.caseId) router.push(`/cases/${task.caseId}`);
                }}>
                  <Text style={styles.brutalButtonText}>{task.caseId ? 'DOSYAYI AÇ' : 'DETAY'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {soonTasks.map((task) => (
            <View key={task.id} style={[styles.brutalContainer, { backgroundColor: colors.accent.yellow, flex: 1 }]}>
              <View style={{ backgroundColor: colors.primary, padding: 12, borderBottomWidth: 3, borderBottomColor: colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name={getSourceIcon(task.source)} size={18} color={colors.text.inverse} />
                  <Text style={{ fontFamily: typography.fonts.headline, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, fontSize: 14, color: colors.text.inverse, marginLeft: 8 }}>
                    {getSourceLabel(task.source)}
                  </Text>
                </View>
                <Text style={{ fontFamily: typography.fonts.headline, fontWeight: '900', fontSize: 20, color: colors.text.inverse, textTransform: 'uppercase' }}>
                  {formatHearingDate(task.date)} {task.time || ''}
                </Text>
              </View>
              <View style={{ padding: 20, flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontFamily: typography.fonts.headline, fontWeight: 'bold', fontSize: 24, marginBottom: 4, color: colors.primary }}>
                    {task.title || 'Başlık Belirtilmemiş'}
                  </Text>
                  <Text style={{ fontFamily: typography.fonts.body, fontSize: 14, fontWeight: '500', opacity: 0.8, marginBottom: 16, color: colors.primary }}>
                    {task.source === 'task'
                      ? (task.caseTitle ? `Dava: ${task.caseTitle}` : 'Genel Görev')
                      : (task.caseTitle ? `Dava: ${task.caseTitle}` : (task.caseNo ? `Esas No: ${task.caseNo}` : '-'))
                    }
                  </Text>
                  <View style={{ gap: 8 }}>
                    {task.source === 'hearing' && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.primary, paddingBottom: 4 }}>
                        <Text style={{ fontFamily: typography.fonts.body, fontWeight: 'bold', color: colors.primary }}>Mahkeme:</Text>
                        <Text style={{ fontFamily: typography.fonts.body, color: colors.primary, textAlign: 'right', flex: 1 }}>{task.court || task.location || '-'}</Text>
                      </View>
                    )}
                    {task.source === 'task' && task.caseTitle && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.primary, paddingBottom: 4 }}>
                        <Text style={{ fontFamily: typography.fonts.body, fontWeight: 'bold', color: colors.primary }}>Bağlı Dava:</Text>
                        <Text style={{ fontFamily: typography.fonts.body, color: colors.primary, textAlign: 'right', flex: 1 }}>{task.caseTitle}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity style={styles.brutalButton} onPress={() => {
                  if (task.caseId) router.push(`/cases/${task.caseId}`);
                }}>
                  <Text style={styles.brutalButtonText}>{task.caseId ? 'DOSYAYI AÇ' : 'DETAY'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {otherTasks.length > 0 && (
            <View style={[styles.brutalContainer, { backgroundColor: '#faf7f2', flex: 1 }]}>
              <View style={{ backgroundColor: '#e8e3da', padding: 12, borderBottomWidth: 3, borderBottomColor: colors.primary }}>
                <Text style={{ fontFamily: typography.fonts.headline, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, fontSize: 14, color: colors.primary }}>
                  YAKLAŞAN DİĞER İŞLER
                </Text>
              </View>
              <View>
                {otherTasks.map((item, index) => (
                  <TouchableOpacity key={item.id} style={{ padding: 16, borderBottomWidth: index === otherTasks.length - 1 ? 0 : 3, borderBottomColor: colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#faf7f2' }} onPress={() => { router.push(`/cases/${item.caseId || ''}`); }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ fontFamily: typography.fonts.headline, fontWeight: 'bold', fontSize: 18, color: colors.primary, marginBottom: 2 }}>{item.title}</Text>
                      <Text style={{ fontFamily: typography.fonts.body, fontSize: 12, opacity: 0.7, color: colors.primary }}>{item.caseTitle || 'Genel İşlem'}</Text>
                    </View>
                    <View style={{ backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.primary }}>
                      <Text style={{ fontFamily: typography.fonts.headline, fontSize: 12, fontWeight: 'bold', color: colors.text.inverse }}>
                        {getDaysLeftCount(item.date)} GÜN
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderAllHearings = () => {
    // Sadece kritik/sarı listede gösterilmeyen (>14 gün kalan veya geçmiş) duruşmaları göster
    const nonUrgentHearings = allHearings.filter(h => getDaysLeftCount(h.date) > 14);

    return (
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottomWidth: 4, borderBottomColor: colors.primary, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 16, height: 16, backgroundColor: colors.primary, marginRight: 12 }} />
            <Text style={{ fontFamily: typography.fonts.headline, fontSize: 24, fontWeight: 'bold', color: colors.primary, textTransform: 'uppercase' }}>
              TÜM DURUŞMALAR
            </Text>
          </View>
        </View>

        {nonUrgentHearings.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center', borderWidth: 2, borderColor: colors.primary }}>
            <Text style={{ fontFamily: typography.fonts.headline, color: colors.primary, opacity: 0.5 }}>Bekleyen başka duruşma yok</Text>
          </View>
        ) : (
        <View style={{ gap: 16 }}>
          {nonUrgentHearings.map((h, i) => {
            const isDark = i % 2 === 0;
            return (
              <TouchableOpacity key={h.id} style={[styles.brutalContainer, { flexDirection: 'row', flexWrap: 'nowrap', backgroundColor: '#f5f0e8' }]} onPress={() => { router.push(`/cases/${h.caseId || ''}`); }}>
                {/* Left Date Box */}
                <View style={{ backgroundColor: isDark ? colors.primary : '#e8e3da', width: 90, padding: 16, borderRightWidth: 3, borderRightColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: typography.fonts.headline, fontWeight: '900', fontSize: 32, color: isDark ? colors.text.inverse : colors.primary }}>{getDay(h.date)}</Text>
                  <Text style={{ fontFamily: typography.fonts.headline, fontWeight: 'bold', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', color: isDark ? colors.text.inverse : colors.primary }}>{getMonthName(h.date)}</Text>
                  <Text style={{ fontFamily: typography.fonts.body, fontSize: 12, marginTop: 4, color: isDark ? colors.text.inverse : colors.primary }}>{h.time || '09:00'}</Text>
                </View>
                
                {/* Right Info Box */}
                <View style={{ flex: 1, padding: 16, justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontFamily: typography.fonts.headline, fontWeight: 'bold', fontSize: 20, color: colors.primary, marginBottom: 4 }} numberOfLines={2}>{h.caseTitle || h.title || 'Dava Adı Belirtilmemiş'}</Text>
                    <Text style={{ fontFamily: typography.fonts.body, fontWeight: 'bold', opacity: 0.8, color: colors.primary }}>{h.title} {h.caseNo ? `(${h.caseNo})` : ''}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <MaterialIcons name="location-on" size={14} color={colors.text.secondary} />
                      <Text style={{ fontFamily: typography.fonts.body, fontSize: 14, marginLeft: 4, color: colors.primary }} numberOfLines={1}>{h.court || h.location || 'Mahkeme bilgisi yok'}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
                    <View style={{ backgroundColor: '#d6e3ff', paddingHorizontal: 12, paddingVertical: 4, borderWidth: 2, borderColor: colors.primary }}>
                      <Text style={{ fontFamily: typography.fonts.headline, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary }}>Keşif</Text>
                    </View>
                    <View style={{ backgroundColor: '#f5f0e8', paddingHorizontal: 16, paddingVertical: 4, borderWidth: 2, borderColor: colors.primary }}>
                      <Text style={{ fontFamily: typography.fonts.headline, fontSize: 12, fontWeight: 'bold', color: colors.primary, textTransform: 'uppercase' }}>Hazırlık</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Duruşma ve Süre Takibi', headerStyle: { backgroundColor: '#f5f0e8' }, headerShadowVisible: false, headerTintColor: colors.primary }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
        ) : (
          <>
            {renderCriticalDeadlines()}
            {renderAllHearings()}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f0e8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24, backgroundColor: '#f5f0e8', borderBottomWidth: 4, borderBottomColor: colors.primary, zIndex: 10 },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 64 },
  brutalContainer: { borderWidth: 3, borderColor: colors.primary, overflow: 'hidden', shadowColor: colors.primary, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 },
  brutalButton: { marginTop: 24, width: '100%', paddingVertical: 12, backgroundColor: '#f5f0e8', borderWidth: 3, borderColor: colors.primary, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 0 },
  brutalButtonText: { fontFamily: typography.fonts.headline, color: colors.primary, fontWeight: 'bold', textTransform: 'uppercase' },
  iconBtn: { padding: 8, backgroundColor: '#f5f0e8', borderWidth: 3, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
