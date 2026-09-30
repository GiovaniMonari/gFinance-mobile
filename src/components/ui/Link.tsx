/**
 * Econva — Link
 *
 * The secondary navigation of the journey. Typography, never a second button:
 * a quiet prompt followed by one accent action.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { appColors, appMotionScale, appSpace, appType } from '../../theme/app';
import { usePressScale } from '../app/motion';

type LinkProps = {
  /** Quiet prompt, e.g. "Ainda não tem conta?". */
  label: string;
  /** The accent action, e.g. "Criar conta". */
  action: string;
  onPress?: () => void;
  align?: 'center' | 'flex-start';
  style?: ViewStyle;
};

export function Link({
  label,
  action,
  onPress,
  align = 'center',
  style,
}: LinkProps) {
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale({
    scale: appMotionScale.control,
    dim: 0.7,
  });

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="link"
      accessibilityLabel={`${label} ${action}`}
      hitSlop={12}
      style={[
        styles.container,
        align === 'flex-start' ? styles.alignStart : styles.alignCenter,
      ]}
    >
      <Animated.View style={[pressStyle, style]}>
        <Text style={styles.text}>
          {label}{' '}
          <Text style={styles.action}>{action}</Text>
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: appSpace.sm,
  },

  alignCenter: {
    alignItems: 'center',
  },

  alignStart: {
    alignItems: 'flex-start',
  },

  text: {
    ...appType.caption,
    color: appColors.textTertiary,
    textAlign: 'center',
  },

  action: {
    ...appType.captionStrong,
    color: appColors.accentBright,
  },
});
