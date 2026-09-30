/**
 * Econva — App Text
 *
 * The single typography primitive for the authenticated application. Binding
 * a type role and a colour tone together is what keeps hierarchy consistent
 * across screens: there is exactly one way to render a screen title, a
 * section title, an amount or a caption.
 */

import React from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { appColors, appType, tabularVariants, type AppTypeVariant } from '../../theme/app';

export type AppTextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'accent'
  | 'positive'
  | 'negative'
  | 'warning'
  | 'onAccent';

type AppTextProps = TextProps & {
  variant?: AppTypeVariant;
  tone?: AppTextTone;
  /** Renders monetary figures with tabular numerals. Defaults to the variant. */
  tabular?: boolean;
  color?: string;
  style?: StyleProp<TextStyle>;
};

const TONES: Record<AppTextTone, string> = {
  primary: appColors.textPrimary,
  secondary: appColors.textSecondary,
  tertiary: appColors.textTertiary,
  accent: appColors.accentBright,
  positive: appColors.income,
  negative: appColors.expense,
  warning: appColors.warning,
  onAccent: appColors.textOnAccent,
};

export function AppText({
  variant = 'body',
  tone = 'primary',
  tabular,
  color,
  style,
  ...textProps
}: AppTextProps) {
  const isTabular = tabular ?? (tabularVariants as readonly string[]).includes(variant);

  return (
    <Text
      {...textProps}
      style={[
        appType[variant],
        { color: color ?? TONES[tone] },
        isTabular ? (styles.tabular as TextStyle) : null,
        style,
      ]}
    />
  );
}

const styles = {
  tabular: {
    fontVariant: ['tabular-nums'],
  },
} as unknown as Record<string, TextStyle>;
