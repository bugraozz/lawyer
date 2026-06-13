import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import apiClient from '../../../api/client';
import { BrutalCard } from '../../../components/BrutalCard';
import { StatusBadge } from '../../../components/StatusBadge';
import { BrutalInput } from '../../../components/BrutalInput';
import { BrutalButton } from '../../../components/BrutalButton';
import { FAB } from '../../../components/FAB';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { MaterialIcons } from '@expo/vector-icons';

export default function CaseNotesTasksScreen() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks'>('notes');

  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newItemText, setNewItemText] = useState('');

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
    if (!newItemText) return;
    try {
      if (activeTab === 'notes') {
        await apiClient.post(`/cases/${id}/notes`, { title: 'Yeni Not', content: newItemText, date: new Date().toLocaleDateString() });
      } else {
        await apiClient.post(`/cases/${id}/tasks`, { title: newItemText, date: new Date().toLocaleDateString() });
      }
      setNewItemText('');
      loadData();
    } catch (err) {
      console.error(err);
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
        <BrutalInput 
          placeholder={activeTab === 'notes' ? "Yeni not ekle..." : "Yeni görev ekle..."} 
          value={newItemText}
          onChangeText={setNewItemText}
          onSubmitEditing={handleAdd}
        />
        <BrutalButton title="EKLE" onPress={handleAdd} style={{ marginTop: 8 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'notes' ? (
          <View>
            {notes.map(note => (
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
            {notes.length === 0 && <Text style={{textAlign: 'center'}}>Not bulunmuyor.</Text>}
          </View>
        ) : (
          <View>
            {tasks.map(task => (
              <View key={task.id} style={styles.taskItem}>
                <TouchableOpacity onPress={() => toggleTask(task)} style={[styles.checkbox, task.completed && styles.checkboxChecked]}>
                  {task.completed ? <MaterialIcons name="check" size={16} color={colors.text.inverse} /> : null}
                </TouchableOpacity>
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>{task.title}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteTask(task.id)}>
                  <MaterialIcons name="delete" size={20} color={colors.accent.red} />
                </TouchableOpacity>
              </View>
            ))}
            {tasks.length === 0 && <Text style={{textAlign: 'center'}}>Görev bulunmuyor.</Text>}
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
  taskMeta: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 4,
  },
});
