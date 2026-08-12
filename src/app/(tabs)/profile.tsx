import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BrutalButton } from '../../components/BrutalButton';
import { BrutalCard } from '../../components/BrutalCard';
import { AuthContext } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>PROFİL</Text>
      </View>

      <BrutalCard style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Avukat'}</Text>
        <Text style={styles.role}>{user?.email || ''}</Text>
        <Text style={styles.barNo}>Sisteme Kayıtlı Kullanıcı</Text>
      </BrutalCard>

      <Text style={styles.sectionTitle}>AYARLAR</Text>
      
      <View style={styles.menuContainer}>
        {user?.role === 'admin' && (
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.accent.yellow }]}
            onPress={() => router.push('/admin')}
          >
            <MaterialIcons name="admin-panel-settings" size={24} color={colors.text.primary} />
            <Text style={[styles.menuText, { fontFamily: typography.fonts.headline }]}>Admin Paneli</Text>
            <MaterialIcons name="chevron-right" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
        {[
          { icon: 'receipt', label: 'Masraf ve Makbuzlar', route: '/expenses' },
          { icon: 'people', label: 'Müvekkiller', route: '/client-portal' },
          { icon: 'person-outline', label: 'Hesap Bilgileri', route: '/(settings)/account' },
          { icon: 'notifications-none', label: 'Bildirim Tercihleri', route: '/(settings)/notifications' },
          { icon: 'security', label: 'Güvenlik ve Şifre', route: '/(settings)/security' },
          { icon: 'palette', label: 'Görünüm', route: '/(settings)/appearance' },
          { icon: 'help-outline', label: 'Yardım ve Destek', route: '/(settings)/help' },
        ].map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <MaterialIcons name={item.icon as any} size={24} color={colors.text.primary} />
            <Text style={styles.menuText}>{item.label}</Text>
            <MaterialIcons name="chevron-right" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        ))}
      </View>

      <BrutalButton 
        title="ÇIKIŞ YAP" 
        variant="danger" 
        fullWidth 
        style={styles.logoutBtn}
        onPress={handleLogout}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
  },
  profileCard: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent.yellow,
    borderWidth: 3,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: typography.fonts.headline,
    fontSize: 32,
    color: colors.text.primary,
  },
  name: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: 4,
  },
  role: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  barNo: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: 16,
  },
  menuContainer: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  menuText: {
    flex: 1,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginLeft: 16,
  },
  logoutBtn: {
    marginTop: 16,
  },
});
