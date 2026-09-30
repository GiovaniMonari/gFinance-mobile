/**
 * Econva — Surface
 *
 * The one container primitive of the application. It exists to group
 * meaningful content, not to decorate it, which is why the default variant is
 * nearly invisible: structure comes from spacing and hairlines, and a surface
 * only appears when a block genuinely needs its own ground.
 *
 * Variants: plain | subtle | outline | elevated | accent | positive | negative
 * Radius:   'none' | 'field' | 'control' | 'group' | 'panel'
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  appColors,
  appMotionScale,
  appRadius,
  appShadows,
  appSpace,
} from '../../theme/app';
import { usePressScale } from './motion';

type SurfaceVariant =
  | 'plain'
  | 'subtle'
  | 'outline'
  | 'elevated'
  | 'accent'
  | 'positive'
  | 'negative';

type SurfaceRadius = 'none' | 'field' | 'control' | 'group' | 'panel';
type SurfacePadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

type SurfaceProps = {
  children: React.ReactNode;
  variant?: SurfaceVariant;
  radius?: SurfaceRadius;
  padding?: SurfacePadding;
  style?: ViewStyle;
  onPress?: () => void;
  accessibilityLabel?: string;
};

const PADDING: Record<SurfacePadding, number> = {
  none: 0,
  sm: appSpace.md,
  md: appSpace.lg,
  lg: appSpace.xl,
  xl: appSpace.xxl,
};

const RADII: Record<SurfaceRadius, number> = {
  none: 0,
  field: appRadius.field,
  control: appRadius.control,
  group: appRadius.group,
  panel: 28,
};

export function Surface({
  children,
  variant = 'subtle',
  radius = 'group',
  padding = 'lg',
  style,
  onPress,
  accessibilityLabel,
}: SurfaceProps) {
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale({
    scale: appMotionScale.row,
  });

  const content = (
    <View
      style={[
        styles.base,
        styles[variant],
        styles[variant] === styles.elevated ? appShadows.raised : null,
        {
          borderRadius: RADII[radius],
          padding: PADDING[padding],
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.fill}
    >
      <Animated.View style={pressStyle}>{content}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    overflow: 'hidden',
  },

  /** Lets the pressed child scale from its own centre. */
  fill: {
    width: '100%',
  },

  plain: {
    backgroundColor: 'transparent',
  },

  subtle: {
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },

  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: appColors.border,
  },

  elevated: {
    backgroundColor: appColors.surfaceStrong,
    borderWidth: 1,
    borderColor: appColors.border,
  },

  accent: {
    backgroundColor: appColors.accentWash,
    borderWidth: 1,
    borderColor: appColors.borderAccent,
  },

  positive: {
    backgroundColor: appColors.incomeSubtle,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.22)',
  },

  negative: {
    backgroundColor: appColors.expenseSubtle,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.22)',
  },
});
