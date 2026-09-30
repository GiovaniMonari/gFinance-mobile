/**
 * Econva — List Row
 *
 * The row primitive for every list in the app: transactions, goals, history,
 * settings. Rows are not cards. They sit on the canvas, are separated by
 * hairlines, and get their emphasis from the amount on the right and the icon
 * on the left.
 */

import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { appColors, appMotionScale, appRadius, appSpace } from '../../theme/app';
import { AppText } from './AppText';
import { usePressScale } from './motion';

export type RowTone =
  | 'neutral'
  | 'accent'
  | 'positive'
  | 'negative'
  | 'warning';

type ListRowProps = {
  title: string;
  /** Secondary line: status, category, date. */
  meta?: string;
  /** Rendered on the right, above the amount when both are present. */
  amount?: string;
  amountTone?: RowTone;
  icon?: keyof typeof Ionicons.glyphMap;
  iconTone?: RowTone;
  /** Small text on the right under the amount. */
  footnote?: string;
  onPress?: () => void;
  showChevron?: boolean;
  /** Draws a hairline above the row, skipping the first item. */
  divider?: boolean;
  /** Renders the row with a stronger tap surface. */
  emphasis?: boolean;
  trailing?: ReactNode;
  style?: ViewStyle;
};

const ICON_TONES: Record<RowTone, { fg: string; bg: string }> = {
  neutral: { fg: appColors.textSecondary, bg: appColors.surface },
  accent: { fg: appColors.accentBright, bg: appColors.accentWash },
  positive: { fg: appColors.income, bg: appColors.incomeSubtle },
  negative: { fg: appColors.expense, bg: appColors.expenseSubtle },
  warning: { fg: appColors.warning, bg: appColors.warningSubtle },
};

const AMOUNT_TONES: Record<RowTone, string> = {
  neutral: appColors.textPrimary,
  accent: appColors.accentBright,
  positive: appColors.income,
  negative: appColors.expense,
  warning: appColors.warning,
};

export function ListRow({
  title,
  meta,
  amount,
  amountTone = 'neutral',
  icon,
  iconTone = 'neutral',
  footnote,
  onPress,
  showChevron = false,
  divider = false,
  emphasis = false,
  trailing,
  style,
}: ListRowProps) {
  const palette = ICON_TONES[iconTone] ?? ICON_TONES.neutral;
  const amountColor =
    AMOUNT_TONES[amountTone] ?? AMOUNT_TONES.neutral;

  const { style: pressStyle, onPressIn, onPressOut } = usePressScale({
    scale: appMotionScale.row,
    dim: 0.6,
  });

  const content = (
    <View style={[styles.container, divider && styles.divider, style]}>
      {icon ? (
        <View
          style={[
            styles.icon,
            { backgroundColor: palette.bg },
            emphasis && styles.iconEmphasis,
          ]}
        >
          <Ionicons name={icon} size={18} color={palette.fg} />
        </View>
      ) : null}

      <View style={styles.text}>
        <AppText variant="bodySemibold" tone="primary" numberOfLines={1}>
          {title}
        </AppText>
        {meta ? (
          <AppText variant="meta" tone="tertiary" numberOfLines={1} style={styles.meta}>
            {meta}
          </AppText>
        ) : null}
      </View>

      {amount ? (
        <View style={styles.trailingText}>
          <AppText variant="amount" color={amountColor}>
            {amount}
          </AppText>
          {footnote ? (
            <AppText variant="meta" tone="tertiary" numberOfLines={1}>
              {footnote}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {trailing}

      {showChevron ? (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={appColors.textTertiary}
        />
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      style={styles.fill}
    >
      <Animated.View style={[styles.fill, pressStyle]}>{content}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.md,
    minHeight: 60,
    paddingVertical: appSpace.md,
  },

  divider: {
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },

  /** Lets the pressed row scale from its own centre. */
  fill: {
    width: '100%',
  },

  icon: {
    width: 36,
    height: 36,
    borderRadius: appRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconEmphasis: {
    width: 40,
    height: 40,
  },

  text: {
    flex: 1,
    minWidth: 0,
  },

  meta: {
    marginTop: 2,
  },

  trailingText: {
    alignItems: 'flex-end',
    maxWidth: '46%',
  },
});
