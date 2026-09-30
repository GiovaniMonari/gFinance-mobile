/**
 * Econva — Motion
 *
 * The two gestures every control in the app shares, kept here so a press on a
 * row, a chip and a button all land with the same weight.
 *
 * Both are built on Reanimated, so they run on the UI thread: a press stays
 * responsive even while the JS thread is busy fetching transactions, which is
 * exactly when a laggy press is most noticeable.
 *
 * Everything yields to the system Reduce Motion setting.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { appMotion, appMotionScale } from '../../theme/app';

type PressScale = {
  /** How far the control compresses. */
  scale?: number;
  /** How far it dims. 1 leaves opacity alone and relies on scale only. */
  dim?: number;
  disabled?: boolean;
};

/**
 * Press feedback for a `Pressable`. Returns handlers to spread onto the
 * pressable and an animated style for the single child inside it.
 *
 * The style goes on one element only — a pressable does not pass styles down
 * to what it wraps.
 *
 * The press is read from React state rather than written into the shared value
 * directly. Writing it in the handler is what Reanimated's own docs show, but
 * this project's lint treats a value captured during render as immutable, and
 * the state round-trip is one boolean on one component — cheap enough that the
 * animation still runs on the UI thread afterwards.
 */
export function usePressScale({
  scale = appMotionScale.control,
  dim = appMotionScale.dim,
  disabled = false,
}: PressScale = {}) {
  const [isPressed, setPressed] = useState(false);
  const pressed = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const inert = disabled || reducedMotion;

  useEffect(() => {
    if (inert) {
      pressed.value = withTiming(0, { duration: appMotion.press });
      return;
    }

    pressed.value = withTiming(isPressed ? 1 : 0, {
      duration: appMotion.press,
    });
  }, [inert, isPressed, pressed]);

  const style = useAnimatedStyle(() => ({
    opacity: dim === 1 ? 1 : interpolate(pressed.value, [0, 1], [1, dim]),
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, scale]) }],
  }), [dim, scale]);

  const onPressIn = useCallback(() => setPressed(true), []);
  const onPressOut = useCallback(() => setPressed(false), []);

  return { style, onPressIn, onPressOut };
}

type RevealOptions = {
  delay?: number;
  /** Travel distance in pixels. */
  distance?: number;
  duration?: number;
  /** Entrance scale, applied on top of the rise. */
  from?: number;
};

/**
 * A one-shot entrance for content that appears where it already sits: an empty
 * state that resolves where the list would have been, a panel the reader just
 * asked for.
 *
 * `useEntrance` covers screen-level blocks. This is the local counterpart for
 * smaller, more frequent changes, on the UI thread so it cannot stutter behind
 * a re-render. It plays once on mount and holds its end state.
 */
export function useReveal({
  delay = 0,
  distance = 10,
  duration = appMotion.layout,
  from = 1,
}: RevealOptions = {}) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 1;
      return;
    }

    progress.value = withDelay(delay, withTiming(1, { duration }));

    return () => {
      cancelAnimation(progress);
    };
  }, [delay, duration, progress, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [distance, 0]) },
      { scale: interpolate(progress.value, [0, 1], [from, 1]) },
    ],
  }));

  return { style };
}
