import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export default function CaseMessagingScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [id]);

  const loadMessages = async () => {
    try {
      const res = await apiClient.get(`/cases/${id}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await apiClient.post(`/cases/${id}/messages`, {
        sender: 'Siz',
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'user',
        isMe: true
      });
      setMessage('');
      loadMessages();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={colors.text.primary} style={{ marginTop: 40 }} />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.dateSeparator}>
          <Text style={styles.dateText}>BUGÜN</Text>
        </View>

        {messages.map(msg => {
          if (msg.type === 'system') {
            return (
              <View key={msg.id} style={styles.systemMessage}>
                <Text style={styles.systemText}>{msg.text}</Text>
              </View>
            );
          }

          return (
            <View key={msg.id} style={[styles.messageWrapper, msg.isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
              {!msg.isMe && (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{msg.sender?.charAt(0)}</Text>
                </View>
              )}
              <View style={[styles.messageBubble, msg.isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
                {!msg.isMe && <Text style={styles.senderName}>{msg.sender}</Text>}
                <Text style={[styles.messageText, msg.isMe && styles.messageTextMe]}>{msg.text}</Text>
                <View style={styles.messageFooter}>
                  <Text style={[styles.timeText, msg.isMe && styles.timeTextMe]}>{msg.time}</Text>
                  {msg.isMe ? <MaterialIcons name="done-all" size={14} color={colors.accent.blue} style={{ marginLeft: 4 }} /> : null}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachBtn}>
          <MaterialIcons name="attach-file" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Mesaj yazın..."
          placeholderTextColor={colors.text.secondary}
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <MaterialIcons name="send" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 16,
  },
  systemText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  messageWrapperMe: {
    alignSelf: 'flex-end',
  },
  messageWrapperOther: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 8,
  },
  avatarText: {
    fontFamily: typography.fonts.headline,
    fontSize: 14,
    color: colors.text.primary,
  },
  messageBubble: {
    padding: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  messageBubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 0,
  },
  messageBubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 0,
  },
  senderName: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.xs,
    color: colors.accent.blue,
    marginBottom: 4,
  },
  messageText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  messageTextMe: {
    color: colors.text.inverse,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontFamily: typography.fonts.body,
    fontSize: 10,
    color: colors.text.secondary,
  },
  timeTextMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  attachBtn: {
    padding: 8,
  },
  input: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.accent.yellow,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
