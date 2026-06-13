import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface BrutalButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
}

export const BrutalButton: React.FC<BrutalButtonProps> = ({
  title,
  variant = 'primary',
  fullWidth = false,
  style,
  ...props
}) => {
  let bgColor = colors.accent.yellow;
  let textColor = colors.text.primary;

  switch (variant) {
    case 'secondary':
      bgColor = colors.surfaceVariant;
      break;
    case 'outline':
      bgColor = 'transparent';
      break;
    case 'danger':
      bgColor = colors.accent.red;
      textColor = colors.text.inverse;
      break;
  }

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth, style]}>
      <View style={styles.shadow} />
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: bgColor }]} 
        activeOpacity={0.8}
        {...props}
      >
        <Text style={[styles.text, { color: textColor }]}>{title.toUpperCase()}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 8,
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  button: {
    borderWidth: 3,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  shadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: colors.border,
    zIndex: 1,
  },
  text: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },
});
