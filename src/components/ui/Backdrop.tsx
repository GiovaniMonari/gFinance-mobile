/**
 * Econva — Backdrop
 *
 * The atmospheric layer that runs under every surface of the product. The
 * the product use it at three intensities; the authenticated app
 * uses `app`, which is the quietest of all — light at the top edge, nothing
 * competing with financial data.
 *
 *   immersive  → Welcome    full art: aurora, orbit rings, wide glow
 *   focused    → Login      art retreats to the top edge
 *   structured → Register   art retreats to a single corner
 *   app        → every screen after sign-in: a single quiet glow
 *
 * Soft light is drawn with SVG radial gradients; the orbit rings are plain
 * bordered views so they stay perfectly circular on any aspect ratio.
 */

import React, { useId } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  appColors,
  appMotion,
  type AppBackdropVariant,
} from '../../theme/app';

type RingSpec = {
  offset: number;
  color: string;
  opacity: number;
  width: number;
};

type VariantSpec = {
  glows: {
    /** Horizontal position of the glow center, as a fraction of screen width. */
    x: number;
    /** Vertical position, as a fraction of screen height. */
    y: number;
    /** Diameter as a fraction of the screen's short edge. */
    size: number;
    opacity: number;
  }[];
  /** Orbit center as a fraction of the screen; `size` is a fraction of the short edge. */
  orbit: { x: number; y: number; size: number; opacity: number } | null;
  rings: RingSpec[];
};

const VARIANTS: Record<AppBackdropVariant, VariantSpec> = {
  immersive: {
    glows: [
      { x: 0.5, y: 0.02, size: 2.3, opacity: 1 },
      { x: 0.1, y: 0.58, size: 1.2, opacity: 0.4 },
    ],
    // The immersive orbit is artwork, not background: it lives in the
    // Welcome composition (see Orbit) so it always frames the mark.
    orbit: null,
    rings: [],
  },
  focused: {
    glows: [{ x: 0.82, y: -0.08, size: 2.1, opacity: 0.7 }],
    orbit: { x: 0.9, y: 0.06, size: 0.5, opacity: 0.6 },
    rings: [
      { offset: 0, color: appColors.accentBright, opacity: 0.16, width: 1 },
      { offset: 1, color: appColors.highlight, opacity: 0.07, width: 1 },
      { offset: 2, color: appColors.highlight, opacity: 0.04, width: 1 },
    ],
  },
  structured: {
    glows: [{ x: 0.14, y: -0.06, size: 1.9, opacity: 0.55 }],
    orbit: { x: 0.1, y: 0.04, size: 0.46, opacity: 0.5 },
    rings: [
      { offset: 0, color: appColors.accentBright, opacity: 0.14, width: 1 },
      { offset: 1, color: appColors.highlight, opacity: 0.06, width: 1 },
      { offset: 2, color: appColors.highlight, opacity: 0.035, width: 1 },
    ],
  },
  /**
   * The authenticated application. One glow above the content and a single
   * ring behind it, so screens read as the same space the user signed in from
   * without competing with dense financial data.
   */
  app: {
    glows: [{ x: 0.5, y: -0.1, size: 2.4, opacity: 0.5 }],
    orbit: { x: 0.5, y: 0.02, size: 0.62, opacity: 0.4 },
    rings: [
      { offset: 0, color: appColors.accentBright, opacity: 0.1, width: 1 },
      { offset: 1, color: appColors.highlight, opacity: 0.05, width: 1 },
    ],
  },
};

type BackdropProps = {
  variant?: AppBackdropVariant;
  /** Scopes the ambient motion; the app variant animates once on entry. */
  animated?: boolean;
};

export function Backdrop({
  variant = 'immersive',
  animated = true,
}: BackdropProps) {
  const { width, height } = useWindowDimensions();
  const gradientId = useId();
  const spec = VARIANTS[variant];
  const shortEdge = Math.min(width, height);
  const reducedMotion = useReducedMotion();

  const breathe = useSharedValue(0);

  React.useEffect(() => {
    if (!animated || reducedMotion) return;

    breathe.value = withRepeat(
      withTiming(1, { duration: appMotion.breathe }),
      -1,
      true,
    );
  }, [animated, breathe, reducedMotion]);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breathe.value * 0.05 }],
    opacity: 1 - breathe.value * 0.25,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breathe.value * 0.08 }],
  }));

  const orbit = spec.orbit;
  const orbitSize = orbit ? orbit.size * shortEdge : 0;
  const lastOffset = spec.rings.length - 1;

  return (
    <View style={styles.root} pointerEvents="none">
      {spec.glows.map((glow, index) => {
        const size = glow.size * shortEdge;
        const style = [
          styles.glow,
          {
            width: size,
            height: size,
            left: glow.x * width - size / 2,
            top: glow.y * height - size / 2,
            opacity: glow.opacity,
          },
          index === 0 ? glowStyle : null,
        ];

        return (
          <Animated.View
            key={`glow-${index}`}
            style={style as never}
            pointerEvents="none"
          >
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <Defs>
                <RadialGradient
                  id={gradientId}
                  cx="50%"
                  cy="50%"
                  rx="50%"
                  ry="50%"
                >
                  <Stop
                    offset="0"
                    stopColor={appColors.accent}
                    stopOpacity={0.30}
                  />
                  <Stop
                    offset="0.32"
                    stopColor={appColors.accent}
                    stopOpacity={0.11}
                  />
                  <Stop
                    offset="0.66"
                    stopColor={appColors.accentDeep}
                    stopOpacity={0.035}
                  />
                  <Stop
                    offset="1"
                    stopColor={appColors.accentDeep}
                    stopOpacity={0}
                  />
                </RadialGradient>
              </Defs>
              <Ellipse
                cx="50"
                cy="50"
                rx="50"
                ry="50"
                fill={`url(#${gradientId})`}
              />
            </Svg>
          </Animated.View>
        );
      })}

      {orbit && (
        <Animated.View
          style={[
            styles.orbit,
            {
              width: orbitSize,
              height: orbitSize,
              left: orbit.x * width - orbitSize / 2,
              top: orbit.y * height - orbitSize / 2,
              opacity: orbit.opacity,
            },
            orbitStyle,
          ]}
          pointerEvents="none"
        >
          {spec.rings.map((ring, index) => {
            const step = orbitSize / (lastOffset + 2);
            const size = step * (index + 1) * 2;

            return (
              <View
                key={`ring-${index}`}
                style={[
                  styles.ring,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    marginLeft: -size / 2,
                    marginTop: -size / 2,
                    borderColor: ring.color,
                    opacity: ring.opacity,
                    borderWidth: ring.width,
                  },
                ]}
              />
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  glow: {
    position: 'absolute',
  },

  orbit: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ring: {
    position: 'absolute',
  },
});
