import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Task {
  id: number;
  title: string;
  completed: number;
  date: string;
  priority?: string;
  caseId: number | null;
  caseTitle?: string;
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'normal' | 'low'>('all');
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const loadTasks = async () => {
    try {
      const res = await apiClient.get('/tasks');
      setTasks(res.data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      Alert.alert('Hata', 'Görevler yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task: Task) => {
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, completed: t.completed ? 0 : 1 } : t);
    setTasks(updatedTasks);
    try {
      await apiClient.put(`/tasks/${task.id}`, { completed: !task.completed });
    } catch (error) {
      console.error('Failed to toggle task:', error);
      setTasks(tasks);
      Alert.alert('Hata', 'Görev güncellenemedi.');
    }
  };

  const deleteTask = async (id: number) => {
    Alert.alert('Emin misiniz?', 'Bu görevi silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/tasks/${id}`);
            setTasks(tasks.filter(t => t.id !== id));
          } catch (error) {
            console.error('Failed to delete task:', error);
            Alert.alert('Hata', 'Görev silinemedi.');
          }
        }
      }
    ]);
  };

  const isOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    let dStr = dateStr;
    if (dStr.includes('.')) {
      const parts = dStr.split('.');
      if (parts.length === 3) dStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const targetDate = new Date(dStr);
    targetDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return targetDate.getTime() < today.getTime();
  };

  const applyFilters = (taskList: Task[]) => {
    return taskList.filter(t => {
      return priorityFilter === 'all' || t.priority === priorityFilter;
    });
  };

  const personalPending = applyFilters(tasks.filter(t => !t.completed && !t.caseId));
  const casePending = applyFilters(tasks.filter(t => !t.completed && t.caseId));
  const personalCompleted = applyFilters(tasks.filter(t => t.completed && !t.caseId));
  const caseCompleted = applyFilters(tasks.filter(t => t.completed && t.caseId));

  const renderTaskList = (taskList: Task[], title: string, isCompleted: boolean = false) => {
    if (taskList.length === 0) return null;
    return (
      <View style={{ marginBottom: 24 }}>
        <Text style={styles.sectionTitle}>{title} ({taskList.length})</Text>
        {taskList.map(task => {
          const overdue = !isCompleted && isOverdue(task.date);
          return (
            <View key={task.id} style={[styles.taskItem, isCompleted && styles.completedCard]}>
              <TouchableOpacity onPress={() => toggleTask(task)} style={[styles.checkbox, task.completed && styles.checkboxChecked]}>
                {task.completed ? <MaterialIcons name="check" size={16} color={colors.text.inverse} /> : null}
              </TouchableOpacity>
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, task.completed && styles.taskCompleted, overdue && { color: colors.accent.red }]}>{task.title}</Text>
                <View style={styles.taskMetaContainer}>
                  {task.date ? (
                    <Text style={[styles.taskMeta, overdue && { color: colors.accent.red, fontWeight: 'bold' }]}>
                      {task.date} {overdue ? '(Süresi Geçmiş)' : ''}
                    </Text>
                  ) : null}
                  {task.priority && !isCompleted && (
                    <View style={[
                      styles.taskPriorityBadge,
                      task.priority === 'high' ? styles.badgeHigh : task.priority === 'low' ? styles.badgeLow : styles.badgeNormal
                    ]}>
                      <Text style={styles.taskPriorityText}>
                        {task.priority === 'high' ? 'YÜKSEK' : task.priority === 'low' ? 'DÜŞÜK' : 'NORMAL'}
                      </Text>
                    </View>
                  )}
                </View>
                {task.caseTitle && (
                  <Text style={styles.taskCaseLabel}>Dava: {task.caseTitle}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => deleteTask(task.id)}>
                <MaterialIcons name="delete" size={20} color={isCompleted ? colors.text.secondary : colors.accent.red} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  const PRIORITY_FILTERS: { label: string; value: 'all' | 'high' | 'normal' | 'low' }[] = [
    { label: 'Tümü', value: 'all' },
    { label: '🔴 Yüksek', value: 'high' },
    { label: '🟡 Normal', value: 'normal' },
    { label: '🟢 Düşük', value: 'low' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GÖREVLERİM</Text>
        <TouchableOpacity onPress={() => router.push('/tasks/add')} style={styles.addIconBtn}>
          <MaterialIcons name="add" size={28} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Priority Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingRight: 24 }}>
        {PRIORITY_FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setPriorityFilter(f.value)}
            style={[styles.filterChip, priorityFilter === f.value && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, priorityFilter === f.value && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Task List */}
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.text.primary} style={{ marginTop: 48 }} />
        ) : (
          <>
            {personalPending.length === 0 && casePending.length === 0 && (
              <Text style={styles.emptyText}>
                {priorityFilter !== 'all' ? 'Filtreye uygun görev bulunamadı.' : 'Bekleyen hiçbir göreviniz bulunmuyor. Harika!'}
              </Text>
            )}
            {renderTaskList(personalPending, 'KİŞİSEL GÖREVLER (BEKLEYEN)')}
            {renderTaskList(casePending, 'DAVA GÖREVLERİ (BEKLEYEN)')}

            {(personalCompleted.length > 0 || caseCompleted.length > 0) && (
              <View style={styles.divider} />
            )}

            {renderTaskList(personalCompleted, 'KİŞİSEL GÖREVLER (TAMAMLANAN)', true)}
            {renderTaskList(caseCompleted, 'DAVA GÖREVLERİ (TAMAMLANAN)', true)}
          </>
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
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    flex: 1,
  },
  addIconBtn: {
    padding: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  filterRow: {
    marginBottom: 12,
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  filterChipTextActive: {
    color: colors.text.inverse,
  },
  divider: {
    height: 2,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },
  sectionTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent.green,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  taskCaseLabel: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.xs,
    color: colors.accent.blue,
    marginTop: 4,
  },
  completedCard: {
    opacity: 0.7,
    backgroundColor: colors.surfaceVariant,
  },
  taskMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  taskMeta: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  taskPriorityBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeHigh: {
    backgroundColor: colors.accent.red,
  },
  badgeLow: {
    backgroundColor: colors.accent.green,
  },
  badgeNormal: {
    backgroundColor: colors.surface,
  },
  taskPriorityText: {
    fontFamily: typography.fonts.headline,
    fontSize: 10,
    color: colors.text.primary,
  },
});
