/**
 * Econva — Entrance
 *
 * A single, restrained entrance: content rises and fades in, staggered by the
 * caller. Built on the React Native Animated driver so it can never leave a
 * screen in a half-visible state, and it yields to the system Reduce Motion
 * setting.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, type ViewStyle } from 'react-native';
import { appMotion } from '../../theme/app';

type EntranceOptions = {
  /** Travel distance in pixels. */
  distance?: number;
  duration?: number;
  delay?: number;
  /**
   * Holds the entrance at its start until this becomes true.
   *
   * Needed by a screen that opens on a loading state. The hook runs when the
   * screen mounts — which is while the loader is still showing — so without a
   * gate the stagger plays against a view that is not on screen, finishes long
   * before the data arrives, and the content appears already complete. Gating
   * keeps the entrance for the moment the content actually shows up.
   *
   * Defaults to true, so callers without a loading state are unaffected.
   */
  start?: boolean;
};

export function useEntrance({
  distance = 14,
  duration = appMotion.enter,
  delay = 0,
  start = true,
}: EntranceOptions = {}): ViewStyle {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!start) {
      progress.setValue(0);
      return undefined;
    }

    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;

      if (enabled) {
        progress.setValue(1);
        return;
      }

      animation = Animated.timing(progress, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      });

      animation.start();
    });

    return () => {
      cancelled = true;
      animation?.stop();
    };
  }, [delay, duration, progress, start]);

  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  };
}
