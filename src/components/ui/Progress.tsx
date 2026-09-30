/**
 * Econva — Progress
 *
 * The brand progress indicator. Not a generic bar: a thin track, a gradient
 * fill that runs from the brand accent into its highlight, and an optional
 * marker that shows exactly where the value sits. The fill grows on mount so
 * progress feels earned rather than static, and yields to Reduce Motion.
 *
 * Variants: accent (goals, positive progress) | income | expense | warning
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  appColors,
  appGradientsDirections,
  appMotion,
  appRadius,
  appType,
} from '../../theme/app';

export type ProgressTone = 'accent' | 'income' | 'expense' | 'warning';

type ProgressProps = {
  /** 0–100. Values outside the range are clamped. */
  value: number;
  tone?: ProgressTone;
  /** `thin` for list rows, `regular` for detail screens. */
  size?: 'thin' | 'regular';
  /** Shows a bright cap where the fill ends. */
  marker?: boolean;
  /** Skips the mount animation, e.g. when re-rendering after an update. */
  animate?: boolean;
  style?: ViewStyle;
};

const TONES: Record<ProgressTone, { colors: [string, string] }> = {
  accent: { colors: [appColors.accentBright, appColors.accent] },
  income: { colors: [appColors.income, 'rgba(52, 211, 153, 0.7)'] },
  expense: { colors: [appColors.expense, 'rgba(248, 113, 113, 0.7)'] },
  warning: { colors: [appColors.warning, 'rgba(251, 191, 36, 0.7)'] },
};

const HEIGHTS = {
  thin: 6,
  regular: 10,
} as const;

export function Progress({
  value,
  tone = 'accent',
  size = 'regular',
  marker = false,
  animate = true,
  style,
}: ProgressProps) {
  const target = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 100);
  const reducedMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(animate && !reducedMotion ? 0 : 1);

  useEffect(() => {
    progress.value = withTiming(target, {
      duration: appMotion.progress,
    });
  }, [progress, target]);

  /**
   * The fill is animated in pixels against a measured track rather than as a
   * percentage string. A percentage has to resolve against the track, which
   * depends on this component's own width, and it is the least reliable thing
   * to hand to the UI thread.
   */
  const fillStyle = useAnimatedStyle(
    () => ({
      width: (progress.value / 100) * trackWidth,
    }),
    [trackWidth],
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setTrackWidth(event.nativeEvent.layout.width);
    },
    [],
  );

  const palette = TONES[tone];
  const height = HEIGHTS[size];
  const frameStyle = {
    height,
    borderRadius: height / 2,
  };

  return (
    <View
      onLayout={handleLayout}
      style={[styles.track, frameStyle, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(target) }}
    >
      {/*
        The static percentage is the source of truth for the first render and
        for any frame where the animated width has not landed yet, so the bar is
        never invisible. The animated width simply overrides it.
      */}
      <Animated.View
        style={[styles.fillClip, frameStyle, { width: `${target}%` }, fillStyle]}
      >
        <LinearGradient
          colors={palette.colors}
          start={appGradientsDirections.vertical.start}
          end={appGradientsDirections.vertical.end}
          style={[styles.fill, frameStyle]}
        />

        {marker && target > 0 ? (
          <View
            style={[
              styles.marker,
              {
                height: height + 6,
                backgroundColor: palette.colors[0],
              },
            ]}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  fillClip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },

  fill: {
    width: '100%',
  },

  marker: {
    position: 'absolute',
    right: 0,
    top: -3,
    width: 3,
    borderRadius: appRadius.full,
  },

  label: {
    ...appType.amount,
  },
});

/** Small figure that sits beside a progress bar, e.g. "62%". */
export function ProgressLabel({
  value,
  tone = 'accent',
  style,
}: {
  value: number;
  tone?: ProgressTone;
  style?: StyleProp<TextStyle>;
}) {
  const color =
    tone === 'income'
      ? appColors.income
      : tone === 'expense'
        ? appColors.expense
        : tone === 'warning'
          ? appColors.warning
          : appColors.textPrimary;

  return (
    <Text style={[styles.label, { color }, style]}>
      {Math.round(value)}%
    </Text>
  );
}
