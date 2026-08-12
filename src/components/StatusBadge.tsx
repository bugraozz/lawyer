import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type StatusType = 'active' | 'inactive' | 'success' | 'danger' | 'warning' | 'info' | 'default';

interface StatusBadgeProps {
  label: string;
  status?: StatusType;
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, status = 'default', style }) => {
  let bgColor = colors.surfaceVariant;
  let textColor = colors.text.primary;

  switch (status) {
    case 'active':
    case 'warning':
      bgColor = colors.accent.yellow;
      break;
    case 'success':
      bgColor = colors.accent.green;
      textColor = colors.text.inverse;
      break;
    case 'danger':
      bgColor = colors.accent.red;
      textColor = colors.text.inverse;
      break;
    case 'info':
      bgColor = colors.accent.blue;
      textColor = colors.text.inverse;
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, style]}>
      <Text style={[styles.label, { color: textColor }]}>{label.toLocaleUpperCase('tr-TR')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: typography.fonts.label,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
});
