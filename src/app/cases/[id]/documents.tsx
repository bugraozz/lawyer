import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
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

const FILE_TYPES = ['Tümü', 'PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'JPG', 'PNG'];

export default function CaseDocumentsScreen() {
  const { id } = useLocalSearchParams();
  const { user, token } = useContext(AuthContext);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState('Tümü');

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
    switch(type?.toLocaleUpperCase('tr-TR')) {
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
    Alert.alert('Belgeyi Sil', 'Bu belgeyi silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/cases/${id}/documents/${docId}`);
          loadDocs();
        } catch (err) { console.error(err); }
      }}
    ]);
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: '*/*',
      });

      if (result.canceled) return;

      setUploading(true);
      const file = result.assets[0];
      const sizeMB = file.size ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : '0.0 MB';
      const extension = file.name.split('.').pop()?.toLocaleUpperCase('tr-TR') || 'FILE';

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
        headers: { 'Content-Type': 'multipart/form-data' },
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
      // Create a safe filename for saving locally
      const safeTitle = title.replace(/[^a-zA-Z0-9.-]/g, '_');
      const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (!dir) {
        Alert.alert('Hata', 'Dosya sistemi kullanılamıyor.');
        return;
      }
      const fileUri = `${dir}${safeTitle}`;
      
      const downloadRes = await FileSystem.downloadAsync(
        url,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        // Try to guess mime type for Android
        const extension = title.split('.').pop()?.toLocaleLowerCase('tr-TR');
        let mimeType = 'application/octet-stream';
        let UTI = 'public.data';
        
        switch(extension) {
          case 'pdf': mimeType = 'application/pdf'; UTI = 'com.adobe.pdf'; break;
          case 'doc': mimeType = 'application/msword'; UTI = 'com.microsoft.word.doc'; break;
          case 'docx': mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; UTI = 'org.openxmlformats.wordprocessingml.document'; break;
          case 'xls': mimeType = 'application/vnd.ms-excel'; UTI = 'com.microsoft.excel.xls'; break;
          case 'xlsx': mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; UTI = 'org.openxmlformats.spreadsheetml.sheet'; break;
          case 'jpg': 
          case 'jpeg': mimeType = 'image/jpeg'; UTI = 'public.jpeg'; break;
          case 'png': mimeType = 'image/png'; UTI = 'public.png'; break;
        }

        await Sharing.shareAsync(downloadRes.uri, {
          mimeType,
          UTI,
          dialogTitle: title
        });
      } else {
        Linking.openURL(url);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Hata', 'Dosya açılamadı veya indirilemedi.');
    }
  };

  // Apply filters
  const filteredDocs = docs.filter(doc => {
    const matchesSearch = !searchQuery ||
      doc.title?.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR')) ||
      doc.uploaderName?.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR'));
    const matchesType = activeTypeFilter === 'Tümü' ||
      doc.type?.toLocaleUpperCase('tr-TR') === activeTypeFilter.toLocaleUpperCase('tr-TR');
    return matchesSearch && matchesType;
  });

  const totalSizeMB = docs.reduce((acc, doc) => acc + parseFloat(doc.size || '0'), 0).toFixed(1);

  if (loading) {
    return <ActivityIndicator size="large" color={colors.text.primary} style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats Bar */}
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

        {/* Upload Zone */}
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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={colors.text.secondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Belge adı veya yükleyen ara..."
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

        {/* Type Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
          {FILE_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => setActiveTypeFilter(type)}
              style={[styles.filterChip, activeTypeFilter === type && styles.activeFilter]}
            >
              <Text style={[styles.filterText, activeTypeFilter === type && styles.activeFilterText]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results count */}
        {(searchQuery || activeTypeFilter !== 'Tümü') && (
          <Text style={styles.resultCount}>{filteredDocs.length} belge bulundu</Text>
        )}

        {/* Doc List */}
        {filteredDocs.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>
              {searchQuery || activeTypeFilter !== 'Tümü' ? 'Arama kriterlerine uygun belge bulunamadı.' : 'Henüz belge eklenmemiş.'}
            </Text>
          </View>
        ) : (
          filteredDocs.map(doc => {
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
          })
        )}
      </ScrollView>
      <FAB icon="add" onPress={handleUpload} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 100 },
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  activeFilter: { backgroundColor: colors.primary },
  filterText: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },
  activeFilterText: { color: colors.text.inverse },
  resultCount: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  docIconContainer: { marginRight: 16 },
  docInfo: { flex: 1 },
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
  actionBtn: { padding: 8 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginTop: 12,
    textAlign: 'center',
  },
});
