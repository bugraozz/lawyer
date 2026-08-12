import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface BrutalDateInputProps {
  label?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  value: string;
  placeholder?: string;
  onPress: () => void;
  error?: string;
  style?: ViewStyle;
}

export const BrutalDateInput: React.FC<BrutalDateInputProps> = ({
  label,
  icon,
  value,
  placeholder,
  onPress,
  error,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity 
        style={[styles.inputContainer, error ? styles.inputError : null]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {icon && (
          <MaterialIcons 
            name={icon} 
            size={24} 
            color={colors.text.primary} 
            style={styles.icon} 
          />
        )}
        <Text style={[styles.input, !value && styles.placeholderText]}>
          {value || placeholder || 'Seçiniz'}
        </Text>
        <MaterialIcons 
          name="arrow-drop-down" 
          size={24} 
          color={colors.text.primary} 
          style={styles.dropdownIcon} 
        />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },
  inputError: {
    borderColor: colors.accent.red,
  },
  icon: {
    marginRight: 12,
  },
  dropdownIcon: {
    marginLeft: 'auto',
  },
  input: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  placeholderText: {
    color: colors.text.secondary,
  },
  errorText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.accent.red,
    marginTop: 4,
  },
});
