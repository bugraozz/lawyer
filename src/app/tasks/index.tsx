import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalInput } from '../../components/BrutalInput';
import { BrutalButton } from '../../components/BrutalButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Task {
  id: number;
  title: string;
  completed: number;
  date: string;
  caseId: number | null;
  caseTitle?: string;
}

export default function TasksScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

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

  const handleAddTask = async () => {
    const title = newTaskTitle.trim();
    if (!title) {
      Alert.alert('Uyarı', 'Lütfen bir görev içeriği yazın.');
      return;
    }
    setAdding(true);
    try {
      const res = await apiClient.post('/tasks', { title });
      if (res.data && res.data.id) {
        const newTask: Task = {
          id: res.data.id,
          title: title,
          completed: 0,
          date: new Date().toISOString(),
          caseId: null
        };
        setTasks([newTask, ...tasks]);
        setNewTaskTitle('');
      } else {
        Alert.alert('Hata', 'Sunucudan geçersiz yanıt geldi.');
      }
    } catch (error: any) {
      console.error('Failed to add task:', error.message);
      Alert.alert('Hata', 'Görev eklenirken bir sorun oluştu. Bağlantınızı kontrol edin.');
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (task: Task) => {
    // Optimistic update
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, completed: t.completed ? 0 : 1 } : t);
    setTasks(updatedTasks);
    try {
      await apiClient.put(`/tasks/${task.id}`, { completed: !task.completed });
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // Revert on failure
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

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GÖREVLERİM</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.addSection}>
          <BrutalInput
            placeholder="Yeni bir görev ekle..."
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            icon="add-task"
            onSubmitEditing={handleAddTask}
            returnKeyType="done"
          />
          <BrutalButton
            title={adding ? "..." : "EKLE"}
            onPress={handleAddTask}
            style={styles.addButton}
            fullWidth
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.text.primary} style={{ marginTop: 48 }} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>BEKLEYENLER ({pendingTasks.length})</Text>
            {pendingTasks.length === 0 && (
              <Text style={styles.emptyText}>Bekleyen göreviniz bulunmuyor. Harika!</Text>
            )}
            {pendingTasks.map(task => (
              <BrutalCard key={task.id} style={styles.taskCard}>
                <TouchableOpacity style={styles.taskContent} onPress={() => toggleTask(task)}>
                  <MaterialIcons name="radio-button-unchecked" size={28} color={colors.text.secondary} />
                  <View style={styles.taskTextContainer}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.caseTitle && (
                      <Text style={styles.taskCaseLabel}>Dava: {task.caseTitle}</Text>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTask(task.id)}>
                  <MaterialIcons name="delete-outline" size={24} color={colors.accent.red} />
                </TouchableOpacity>
              </BrutalCard>
            ))}

            {completedTasks.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 32 }]}>TAMAMLANANLAR ({completedTasks.length})</Text>
                {completedTasks.map(task => (
                  <BrutalCard key={task.id} style={[styles.taskCard, styles.completedCard]}>
                    <TouchableOpacity style={styles.taskContent} onPress={() => toggleTask(task)}>
                      <MaterialIcons name="check-circle" size={28} color={colors.accent.green} />
                      <View style={styles.taskTextContainer}>
                        <Text style={[styles.taskTitle, styles.completedTitle]}>{task.title}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTask(task.id)}>
                      <MaterialIcons name="delete-outline" size={24} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </BrutalCard>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 64,
    backgroundColor: colors.primary,
    borderBottomWidth: 4,
    borderColor: colors.border,
  },
  backButton: {
    padding: 8,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
  },
  headerTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.inverse,
  },
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },
  addSection: {
    marginBottom: 32,
  },
  addButton: {
    marginTop: 8,
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
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  taskTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
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
  completedTitle: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  deleteButton: {
    padding: 8,
  },
});
