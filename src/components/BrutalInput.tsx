import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface BrutalInputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  error?: string;
}

export const BrutalInput: React.FC<BrutalInputProps> = ({
  label,
  icon,
  error,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {icon && (
          <MaterialIcons 
            name={icon} 
            size={24} 
            color={colors.text.primary} 
            style={styles.icon} 
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.text.secondary}
          selectionColor={colors.accent.blue}
          {...props}
        />
      </View>
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
  },
  inputError: {
    borderColor: colors.accent.red,
  },
  icon: {
    marginRight: 12,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  errorText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.accent.red,
    marginTop: 4,
  },
});
