/**
 * Econva — Stats
 *
 * Figures that belong to the same moment in time: income and expenses, a goal
 * target and its remainder, a summary of connected accounts. Presented as one
 * group with a hairline between columns, never as a card per figure.
 */

import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { appColors, appMotionScale, appRadius, appSpace } from '../../theme/app';
import { AppText } from './AppText';
import { usePressScale } from './motion';

export type StatDirection = 'positive' | 'negative' | 'neutral' | 'accent';

type StatProps = {
  label: string;
  value: string;
  /** Optional supporting line, e.g. a share of the total. */
  hint?: string;
  direction?: StatDirection;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: ViewStyle;
};

const DIRECTIONS: Record<
  StatDirection,
  { fg: string; bg: string; text: string }
> = {
  positive: {
    fg: appColors.income,
    bg: appColors.incomeSubtle,
    text: appColors.income,
  },
  negative: {
    fg: appColors.expense,
    bg: appColors.expenseSubtle,
    text: appColors.expense,
  },
  neutral: {
    fg: appColors.textSecondary,
    bg: appColors.surface,
    text: appColors.textPrimary,
  },
  accent: {
    fg: appColors.accentBright,
    bg: appColors.accentWash,
    text: appColors.accentBright,
  },
};

export function Stat({
  label,
  value,
  hint,
  direction = 'neutral',
  icon,
  onPress,
  style,
}: StatProps) {
  const palette = DIRECTIONS[direction];

  const { style: pressStyle, onPressIn, onPressOut } = usePressScale({
    scale: appMotionScale.row,
  });

  const body = (
    <View style={[styles.stat, style]}>
      <View style={[styles.icon, { backgroundColor: palette.bg }]}>
        <Ionicons name={icon} size={16} color={palette.fg} />
      </View>

      <AppText variant="micro" tone="tertiary" numberOfLines={1}>
        {label.toUpperCase()}
      </AppText>

      <AppText
        variant="statValue"
        color={palette.text}
        style={styles.value}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </AppText>

      {hint ? (
        <AppText variant="meta" tone="tertiary" numberOfLines={1}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
    >
      <Animated.View style={pressStyle}>{body}</Animated.View>
    </Pressable>
  );
}

type StatGridProps = {
  children: ReactNode;
  /** `row` places figures side by side; `stack` is for wide phones and tablets. */
  direction?: 'row' | 'stack';
  style?: ViewStyle;
};

export function StatGrid({ children, direction = 'row', style }: StatGridProps) {
  return (
    <View style={[styles.grid, direction === 'stack' && styles.gridStack, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: appSpace.md,
  },

  gridStack: {
    flexDirection: 'column',
  },

  stat: {
    flex: 1,
    minWidth: 0,
    borderRadius: appRadius.group,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    padding: appSpace.lg,
  },

  icon: {
    width: 30,
    height: 30,
    borderRadius: appRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: appSpace.md,
  },

  value: {
    marginTop: appSpace.xs,
    marginBottom: 2,
  },
});
