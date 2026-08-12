import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../../../api/client';
import { BrutalButton } from '../../../components/BrutalButton';
import { BrutalCard } from '../../../components/BrutalCard';
import { BrutalInput } from '../../../components/BrutalInput';
import { BrutalDateInput } from '../../../components/BrutalDateInput';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export default function CaseNotesTasksScreen() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks'>('notes');

  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('normal');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [notesRes, tasksRes] = await Promise.all([
        apiClient.get(`/cases/${id}/notes`),
        apiClient.get(`/cases/${id}/tasks`)
      ]);
      setNotes(notesRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error('Failed to load notes/tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      setAdding(true);
      if (activeTab === 'notes') {
        if (!noteTitle) return alert('Lütfen not başlığı giriniz.');
        // SQLite uses YYYY-MM-DD for date filtering/ordering, better to store it as such
        const today = new Date().toISOString().split('T')[0];
        await apiClient.post(`/cases/${id}/notes`, { title: noteTitle, content: noteContent, date: today });
        setNoteTitle('');
        setNoteContent('');
      } else {
        if (!taskTitle) return alert('Lütfen görev başlığı giriniz.');
        if (!taskDate) return alert('Lütfen görev tarihi giriniz.');
        await apiClient.post(`/cases/${id}/tasks`, { title: taskTitle, date: taskDate, priority: taskPriority });
        setTaskTitle('');
        setTaskDate('');
        setTaskPriority('normal');
      }
      loadData();
    } catch (err) {
      console.error(err);
      alert('Eklenirken bir hata oluştu.');
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (task: any) => {
    try {
      await apiClient.put(`/cases/${id}/tasks/${task.id}`, { completed: !task.completed });
      loadData();
    } catch (err) { console.error(err); }
  };

  const deleteNote = async (noteId: number) => {
    try {
      await apiClient.delete(`/cases/${id}/notes/${noteId}`);
      loadData();
    } catch (err) { console.error(err); }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await apiClient.delete(`/cases/${id}/tasks/${taskId}`);
      loadData();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={colors.text.primary} style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'notes' && styles.activeTab]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>Notlar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>Görevler</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 24, paddingBottom: 0 }}>
        {activeTab === 'notes' ? (
          <View style={styles.formContainer}>
            <BrutalInput 
              placeholder="Not Başlığı" 
              value={noteTitle}
              onChangeText={setNoteTitle}
            />
            <BrutalInput 
              placeholder="Not İçeriği..." 
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              numberOfLines={3}
            />
          </View>
        ) : (
          <View style={styles.formContainer}>
            <BrutalInput 
              placeholder="Görev Başlığı" 
              value={taskTitle}
              onChangeText={setTaskTitle}
            />
            
            <BrutalDateInput
              icon="event"
              placeholder="Tarih Seçin"
              value={taskDate}
              onPress={() => setShowDatePicker(true)}
            />

            {showDatePicker && (
              <DateTimePicker
                value={taskDate ? new Date(taskDate) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (event.type === 'set' && selectedDate) {
                    // Extract local date in YYYY-MM-DD
                    const year = selectedDate.getFullYear();
                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(selectedDate.getDate()).padStart(2, '0');
                    setTaskDate(`${year}-${month}-${day}`);
                  }
                }}
              />
            )}

            <View style={styles.priorityContainer}>
              {['low', 'normal', 'high'].map(p => (
                <TouchableOpacity 
                  key={p} 
                  onPress={() => setTaskPriority(p)}
                  style={[
                    styles.priorityButton, 
                    taskPriority === p && styles.priorityButtonActive
                  ]}>
                  <Text style={[
                    styles.priorityText, 
                    taskPriority === p && styles.priorityTextActive
                  ]}>
                    {p === 'low' ? 'Düşük' : p === 'normal' ? 'Normal' : 'Yüksek'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        <BrutalButton title={adding ? "EKLENİYOR..." : "EKLE"} onPress={handleAdd} style={{ marginTop: 8 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={colors.text.secondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'notes' ? 'Not ara...' : 'Görev ara...'}
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {activeTab === 'notes' ? (
          <View>
            {notes.filter(n => !searchQuery || n.title?.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR')) || n.content?.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR'))).map(note => (
              <BrutalCard key={note.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <Text style={styles.noteTitle}>{note.title}</Text>
                  <TouchableOpacity onPress={() => deleteNote(note.id)}>
                    <MaterialIcons name="delete" size={20} color={colors.accent.red} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.noteMeta}>{note.date}</Text>
                <Text style={styles.notePreview}>{note.content}</Text>
              </BrutalCard>
            ))}
            {notes.filter(n => !searchQuery || n.title?.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR')) || n.content?.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR'))).length === 0 && <Text style={{textAlign: 'center', color: colors.text.secondary}}>{ searchQuery ? 'Arama kriterine uygun not bulunamadı.' : 'Not bulunmuyor.' }</Text>}
          </View>
        ) : (
          <View>
            {tasks.filter(t => !searchQuery || t.title?.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR'))).map(task => {
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
              const overdue = !task.completed && isOverdue(task.date);
              return (
              <View key={task.id} style={styles.taskItem}>
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
                    {task.priority && (
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
                </View>
                <TouchableOpacity onPress={() => deleteTask(task.id)}>
                  <MaterialIcons name="delete" size={20} color={colors.accent.red} />
                </TouchableOpacity>
              </View>
              );
            })}
            {tasks.filter(t => !searchQuery || t.title?.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR'))).length === 0 && <Text style={{textAlign: 'center', color: colors.text.secondary}}>{ searchQuery ? 'Arama kriterine uygun görev bulunamadı.' : 'Görev bulunmuyor.' }</Text>}
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
    paddingBottom: 100,
  },
  formContainer: {
    marginBottom: 8,
  },
  noteCard: {
    marginBottom: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
  },
  noteMeta: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  notePreview: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    lineHeight: 22,
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
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 16,
  },
  datePickerText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginLeft: 12,
  },
  datePickerPlaceholder: {
    color: colors.text.secondary,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: colors.accent.yellow,
    borderColor: colors.text.primary,
  },
  priorityText: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  priorityTextActive: {
    color: colors.text.primary,
  },
});
