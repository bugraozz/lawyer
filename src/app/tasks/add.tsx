import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../../api/client';
import { BrutalButton } from '../../components/BrutalButton';
import { BrutalInput } from '../../components/BrutalInput';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function AddTaskScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('normal');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Uyarı', 'Lütfen görev başlığı giriniz.');
      return;
    }
    
    setSaving(true);
    try {
      await apiClient.post('/tasks', { title: trimmedTitle, priority });
      router.back();
    } catch (error) {
      console.error('Failed to add task:', error);
      Alert.alert('Hata', 'Görev eklenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: '', headerBackTitle: '' }} />
      <View style={styles.header}>
        <Text style={styles.title}>YENİ GÖREV</Text>
      </View>
      <View style={styles.content}>
        <BrutalInput
          placeholder="Görev Başlığı"
          value={title}
          onChangeText={setTitle}
          icon="assignment"
          autoFocus
        />
        <Text style={styles.label}>ÖNCELİK DURUMU</Text>
        <View style={styles.priorityContainer}>
          {['low', 'normal', 'high'].map(p => (
            <TouchableOpacity 
              key={p} 
              onPress={() => setPriority(p)}
              style={[
                styles.priorityButton, 
                priority === p && styles.priorityButtonActive
              ]}>
              <Text style={[
                styles.priorityText, 
                priority === p && styles.priorityTextActive
              ]}>
                {p === 'low' ? 'DÜŞÜK' : p === 'normal' ? 'NORMAL' : 'YÜKSEK'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <BrutalButton
          title={saving ? "KAYDEDİLİYOR..." : "GÖREVİ KAYDET"}
          onPress={handleSave}
          style={{ marginTop: 24 }}
        />
      </View>
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
    padding: 24,
    paddingTop: 16,
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
  },
  label: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 24,
    marginBottom: 12,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
