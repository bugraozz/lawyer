import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { BrutalCard } from '../../components/BrutalCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FAB } from '../../components/FAB';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAY_NAMES = ['PZ', 'PT', 'SA', 'ÇA', 'PE', 'CU', 'CT'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sunday
}

function formatDateStr(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  const loadEvents = async () => {
    try {
      const res = await apiClient.get('/events');
      setEvents(res.data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: number) => {
    Alert.alert('Etkinliği Sil', 'Bu etkinliği silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await apiClient.delete(`/events/${id}`);
            loadEvents();
          } catch (err) { console.error(err); }
        }
      }
    ]);
  };

  // Build a map of dates that have events
  const eventDatesMap: Record<string, any[]> = {};
  events.forEach(ev => {
    if (ev.date) {
      if (!eventDatesMap[ev.date]) eventDatesMap[ev.date] = [];
      eventDatesMap[ev.date].push(ev);
    }
  });

  // Get filtered events for the selected date
  const filteredEvents = selectedDate ? (eventDatesMap[selectedDate] || []) : events;

  // Build the calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null); // empty leading cells
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const handleDatePress = (day: number) => {
    const dateStr = formatDateStr(currentYear, currentMonth, day);
    if (selectedDate === dateStr) {
      setSelectedDate(null); // deselect
    } else {
      setSelectedDate(dateStr);
    }
  };

  const handleAddFromDate = () => {
    if (selectedDate) {
      router.push(`/calendar/add?date=${selectedDate}`);
    } else {
      router.push('/calendar/add');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <BrutalCard style={styles.eventCard}>
      <View style={styles.timeCol}>
        <Text style={styles.timeText}>{item.time || 'Tüm Gün'}</Text>
        <Text style={styles.timeLabel}>{item.date}</Text>
      </View>
      <View style={styles.eventDetails}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          <StatusBadge label={item.type?.toUpperCase() || 'ETKİNLİK'} status={item.type === 'Duruşma' ? 'danger' : 'warning'} />
          <TouchableOpacity onPress={() => deleteEvent(item.id)}>
            <MaterialIcons name="close" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.eventTitle}>{item.title}</Text>
        {item.location ? <Text style={styles.eventLocation}>{item.location}</Text> : null}
      </View>
    </BrutalCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AJANDA & RANDEVU</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.text.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.content}
          onRefresh={loadEvents}
          refreshing={loading}
          ListHeaderComponent={
            <>
              <BrutalCard style={styles.calendarCard}>
                {/* Month Navigation */}
                <View style={styles.monthNav}>
                  <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
                    <MaterialIcons name="chevron-left" size={28} color={colors.text.primary} />
                  </TouchableOpacity>
                  <Text style={styles.monthTitle}>{MONTH_NAMES[currentMonth]} {currentYear}</Text>
                  <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
                    <MaterialIcons name="chevron-right" size={28} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>

                {/* Day Headers */}
                <View style={styles.grid}>
                  {DAY_NAMES.map((day, i) => (
                    <View key={`day-${i}`} style={styles.dayHeader}>
                      <Text style={styles.dayHeaderText}>{day}</Text>
                    </View>
                  ))}

                  {/* Date Cells */}
                  {calendarCells.map((day, i) => {
                    if (day === null) {
                      return <View key={`empty-${i}`} style={styles.dateCell} />;
                    }
                    const dateStr = formatDateStr(currentYear, currentMonth, day);
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const hasEvents = !!eventDatesMap[dateStr];

                    return (
                      <TouchableOpacity
                        key={`date-${i}`}
                        style={[
                          styles.dateCell,
                          isToday && styles.todayCell,
                          isSelected && styles.selectedCell,
                        ]}
                        onPress={() => handleDatePress(day)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.dateText,
                          isToday && styles.todayText,
                          isSelected && styles.selectedText,
                        ]}>
                          {day}
                        </Text>
                        {hasEvents && (
                          <View style={[
                            styles.eventDot,
                            { backgroundColor: isSelected || isToday ? colors.text.primary : colors.accent.red },
                          ]} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </BrutalCard>

              {/* Section Title */}
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>
                  {selectedDate ? `${selectedDate} ETKİNLİKLERİ` : 'TÜM ETKİNLİKLER'}
                </Text>
                {selectedDate && (
                  <TouchableOpacity onPress={() => setSelectedDate(null)}>
                    <Text style={styles.clearFilter}>Tümünü Göster</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>
                {selectedDate ? 'Bu tarihte etkinlik yok.' : 'Henüz etkinlik eklenmemiş.'}
              </Text>
              <TouchableOpacity style={styles.addBtn} onPress={handleAddFromDate}>
                <MaterialIcons name="add" size={20} color={colors.text.primary} />
                <Text style={styles.addBtnText}>Etkinlik Ekle</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <FAB icon="add" onPress={handleAddFromDate} />
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
    paddingBottom: 16,
  },
  title: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
  },
  content: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 100,
  },
  calendarCard: {
    marginBottom: 24,
    padding: 16,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    padding: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  monthTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayHeader: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayHeaderText: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  dateCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  todayCell: {
    backgroundColor: colors.accent.yellow,
    borderColor: colors.border,
    borderWidth: 2,
  },
  selectedCell: {
    backgroundColor: colors.primary,
    borderColor: colors.border,
    borderWidth: 2,
  },
  dateText: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  todayText: {
    color: colors.text.primary,
    fontFamily: typography.fonts.headline,
  },
  selectedText: {
    color: colors.text.inverse,
    fontFamily: typography.fonts.headline,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 4,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  clearFilter: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.xs,
    color: colors.accent.blue,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.blue,
  },
  eventCard: {
    flexDirection: 'row',
    padding: 0,
    marginBottom: 16,
  },
  timeCol: {
    width: 80,
    borderRightWidth: 3,
    borderRightColor: colors.border,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  timeText: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  timeLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  eventDetails: {
    flex: 1,
    padding: 16,
    alignItems: 'flex-start',
  },
  eventTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  eventLocation: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginTop: 12,
    marginBottom: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.accent.yellow,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginLeft: 8,
  },
});
