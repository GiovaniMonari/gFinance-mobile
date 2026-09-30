/**
 * Econva — Section & Metrics
 *
 * The two repeated structures of the authenticated app:
 *
 *   Section     an eyebrow, a title, an optional trailing action — the
 *               consistent way a screen introduces a block of content
 *   Metrics     a label/value pair for figures that belong together, with a
 *               hairline between columns instead of a card per metric
 */

import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { appColors, appMotionScale, appSpace, appType } from '../../theme/app';
import { AppText } from './AppText';
import { usePressScale } from './motion';

// -------------------------------------------------------------- Section ----

type SectionProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children?: ReactNode;
  style?: ViewStyle;
};

export function Section({
  title,
  eyebrow,
  description,
  actionLabel,
  onActionPress,
  children,
  style,
}: SectionProps) {
  const {
    style: actionPressStyle,
    onPressIn: actionPressIn,
    onPressOut: actionPressOut,
  } = usePressScale({ scale: appMotionScale.control, dim: 0.6 });

  return (
    <View style={[styles.section, style]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionText}>
          {eyebrow ? (
            <AppText variant="micro" tone="tertiary" numberOfLines={1}>
              {eyebrow.toUpperCase()}
            </AppText>
          ) : null}
          <AppText
            variant="section"
            tone="primary"
            numberOfLines={1}
            style={eyebrow ? styles.titleWithEyebrow : null}
          >
            {title}
          </AppText>
          {description ? (
            <AppText variant="caption" tone="tertiary" style={styles.sectionDescription}>
              {description}
            </AppText>
          ) : null}
        </View>

        {actionLabel && onActionPress ? (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onActionPress();
            }}
            onPressIn={actionPressIn}
            onPressOut={actionPressOut}
            accessibilityRole="link"
            hitSlop={10}
            style={styles.sectionAction}
          >
            <Animated.View style={[styles.sectionActionInner, actionPressStyle]}>
              <AppText variant="captionStrong" tone="accent">
                {actionLabel}
              </AppText>
              <Ionicons name="chevron-forward" size={14} color={appColors.accentBright} />
            </Animated.View>
          </Pressable>
        ) : null}
      </View>

      {children}
    </View>
  );
}

// -------------------------------------------------------------- Metrics ----

type MetricProps = {
  label: string;
  value: string;
  /** Smaller supporting line under the value. */
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'positive' | 'negative' | 'accent' | 'secondary';
  align?: 'start' | 'end';
  style?: ViewStyle;
};

export function Metric({
  label,
  value,
  hint,
  icon,
  tone = 'primary',
  align = 'start',
  style,
}: MetricProps) {
  const color =
    tone === 'positive'
      ? appColors.income
      : tone === 'negative'
        ? appColors.expense
        : tone === 'accent'
          ? appColors.accentBright
          : tone === 'secondary'
            ? appColors.textSecondary
            : appColors.textPrimary;

  return (
    <View
      style={[
        styles.metric,
        align === 'end' && styles.metricEnd,
        style,
      ]}
    >
      <View style={styles.metricLabelRow}>
        {icon ? (
          <Ionicons name={icon} size={13} color={appColors.textTertiary} />
        ) : null}
        <AppText variant="micro" tone="tertiary" numberOfLines={1}>
          {label.toUpperCase()}
        </AppText>
      </View>

      <AppText
        variant="valueLarge"
        color={color}
        style={styles.metricValue}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
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
}

/** Vertical hairline between metric columns. */
export function MetricDivider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.metricDivider, style]} />;
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: appSpace.md,
    marginBottom: appSpace.md,
  },

  sectionText: {
    flex: 1,
    minWidth: 0,
  },

  titleWithEyebrow: {
    marginTop: 3,
  },

  sectionDescription: {
    marginTop: 2,
  },

  sectionAction: {
    paddingBottom: 2,
  },

  sectionActionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  metric: {
    flex: 1,
    minWidth: 0,
  },

  metricEnd: {
    alignItems: 'flex-end',
  },

  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.xs,
    marginBottom: appSpace.xs,
  },

  metricValue: {
    ...appType.valueLarge,
    marginBottom: 2,
  },

  metricDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: appColors.border,
    marginHorizontal: appSpace.lg,
  },
});
