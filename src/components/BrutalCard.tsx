import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors } from '../theme/colors';

interface BrutalCardProps extends ViewProps {
  backgroundColor?: string;
  noShadow?: boolean;
}

export const BrutalCard: React.FC<BrutalCardProps> = ({ 
  children, 
  style, 
  backgroundColor = colors.surface,
  noShadow = false,
  ...props 
}) => {
  return (
    <View style={[styles.container, style]} {...props}>
      {!noShadow && <View style={styles.shadow} />}
      <View style={[styles.card, { backgroundColor }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 8,
  },
  card: {
    borderWidth: 3,
    borderColor: colors.border,
    padding: 16,
    zIndex: 2,
  },
  shadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: -6,
    bottom: -6,
    backgroundColor: colors.border,
    zIndex: 1,
  },
});
