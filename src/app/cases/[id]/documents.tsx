import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import { BrutalCard } from '../../../components/BrutalCard';
import { FAB } from '../../../components/FAB';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import apiClient from '../../../api/client';
import { AuthContext } from '../../../context/AuthContext';

export default function CaseDocumentsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocs();
  }, [id]);

  const loadDocs = async () => {
    try {
      const res = await apiClient.get(`/cases/${id}/documents`);
      setDocs(res.data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch(type?.toUpperCase()) {
      case 'PDF': return { name: 'picture-as-pdf', color: colors.accent.red };
      case 'DOC': 
      case 'DOCX': return { name: 'description', color: colors.accent.blue };
      case 'XLS': 
      case 'XLSX': return { name: 'table-chart', color: colors.accent.green };
      case 'JPG':
      case 'JPEG':
      case 'PNG': return { name: 'image', color: colors.accent.yellow };
      default: return { name: 'insert-drive-file', color: colors.text.secondary };
    }
  };

  const deleteDoc = async (docId: string) => {
    try {
      await apiClient.delete(`/cases/${id}/documents/${docId}`);
      loadDocs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: '*/*',
      });

      if (result.canceled) {
        return;
      }

      setUploading(true);
      const file = result.assets[0];

      // Format size
      const sizeMB = file.size ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : '0.0 MB';
      const extension = file.name.split('.').pop()?.toUpperCase() || 'FILE';

      const formData = new FormData();
      formData.append('title', file.name);
      formData.append('size', sizeMB);
      formData.append('type', extension);
      formData.append('date', new Date().toLocaleDateString());
      formData.append('uploaderName', user?.name || 'Bilinmiyor');
      
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);

      await apiClient.post(`/cases/${id}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      loadDocs();
      Alert.alert('Başarılı', 'Belge yüklendi.');
    } catch (err) {
      console.error(err);
      Alert.alert('Hata', 'Belge yüklenirken bir sorun oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const openDocument = async (filePath: string, title: string) => {
    if (!filePath) {
      Alert.alert('Hata', 'Bu belgenin fiziksel dosyası bulunamadı.');
      return;
    }
    const url = apiClient.defaults.baseURL?.replace('/api', '/uploads/') + filePath;
    
    try {
      const downloadRes = await FileSystem.downloadAsync(
        url,
        FileSystem.documentDirectory + title
      );
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        Linking.openURL(url);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Hata', 'Dosya açılamadı.');
    }
  };

  const totalSizeMB = docs.reduce((acc, doc) => acc + parseFloat(doc.size || '0'), 0).toFixed(1);

  if (loading) {
    return <ActivityIndicator size="large" color={colors.text.primary} style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{docs.length}</Text>
            <Text style={styles.statLabel}>Toplam Belge</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalSizeMB} MB</Text>
            <Text style={styles.statLabel}>Toplam Boyut</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.uploadZone} onPress={handleUpload} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="large" color={colors.text.primary} />
          ) : (
            <>
              <MaterialIcons name="cloud-upload" size={48} color={colors.text.secondary} />
              <Text style={styles.uploadText}>Yeni Belge Yükle (Dokun)</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.filterRow}>
          <TouchableOpacity style={[styles.filterChip, styles.activeFilter]}>
            <Text style={[styles.filterText, styles.activeFilterText]}>Tüm Belgeler</Text>
          </TouchableOpacity>
        </View>

        {docs.map(doc => {
          const iconData = getFileIcon(doc.type);
          return (
            <BrutalCard key={doc.id} style={styles.docCard}>
              <View style={styles.docIconContainer}>
                <MaterialIcons name={iconData.name as any} size={32} color={iconData.color} />
              </View>
              <TouchableOpacity style={styles.docInfo} onPress={() => openDocument(doc.filePath, doc.title)}>
                <Text style={styles.docTitle}>{doc.title}</Text>
                <Text style={styles.docMeta}>{doc.size} • {doc.date}</Text>
                <Text style={styles.docUser}>Yükleyen: {doc.uploaderName}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => deleteDoc(doc.id)}>
                <MaterialIcons name="delete" size={24} color={colors.accent.red} />
              </TouchableOpacity>
            </BrutalCard>
          );
        })}
      </ScrollView>
      <FAB icon="add" onPress={handleUpload} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  statsBar: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRightWidth: 2,
    borderRightColor: colors.border,
  },
  statValue: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
  },
  statLabel: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  uploadZone: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: colors.surfaceVariant,
  },
  uploadText: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginTop: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  activeFilter: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },
  activeFilterText: {
    color: colors.text.inverse,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  docIconContainer: {
    marginRight: 16,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: 4,
  },
  docMeta: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  docUser: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  actionBtn: {
    padding: 8,
  },
});
