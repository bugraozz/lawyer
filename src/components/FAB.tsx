import React from 'react';
import { TouchableOpacity, StyleSheet, View, TouchableOpacityProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface FABProps extends TouchableOpacityProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export const FAB: React.FC<FABProps> = ({ icon = 'add', style, ...props }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.shadow} />
      <TouchableOpacity 
        style={styles.button} 
        activeOpacity={0.8}
        {...props}
      >
        <MaterialIcons name={icon} size={32} color={colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    zIndex: 100,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent.yellow,
    borderWidth: 3,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  shadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.border,
    zIndex: 1,
  },
});
