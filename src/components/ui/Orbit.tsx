/**
 * Econva — Orbit
 *
 * The artwork of the First Access screen: concentric rings of light around
 * the brand mark. It measures its own box and scales to fit, so the artwork
 * stays proportional on a small phone and a large one without duplicating
 * breakpoints. The rings breathe slowly; the effect yields to Reduce Motion.
 */

import React, { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { appColors, appMotion } from '../../theme/app';

type OrbitProps = {
  children?: ReactNode;
  /** Total number of rings, outermost first. */
  ringCount?: number;
  /** Gives the innermost ring the accent colour. */
  accentRing?: boolean;
  style?: ViewStyle;
};

export function Orbit({
  children,
  ringCount = 4,
  accentRing = true,
  style,
}: OrbitProps) {
  const [size, setSize] = useState(0);
  const reducedMotion = useReducedMotion();
  const breathe = useSharedValue(0);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize(Math.min(width, height));
  }, []);

  React.useEffect(() => {
    if (reducedMotion) return;

    breathe.value = withRepeat(
      withTiming(1, { duration: appMotion.breathe }),
      -1,
      true,
    );
  }, [breathe, reducedMotion]);

  const ringsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breathe.value * 0.045 }],
    opacity: 1 - breathe.value * 0.28,
  }));

  return (
    <View onLayout={handleLayout} style={[styles.box, style]}>
      {size > 0 ? (
        <Animated.View style={[styles.rings, { width: size, height: size }, ringsStyle]}>
          {Array.from({ length: ringCount }).map((_, index) => {
            const diameter = size - (index * size) / (ringCount + 1);
            const isAccent = accentRing && index === 0;

            return (
              <View
                key={index}
                style={[
                  styles.ring,
                  {
                    width: diameter,
                    height: diameter,
                    borderRadius: diameter / 2,
                    marginLeft: -diameter / 2,
                    marginTop: -diameter / 2,
                    borderColor: isAccent ? appColors.accentBright : appColors.highlight,
                    opacity: isAccent ? 0.28 : 0.16 - index * 0.035,
                  },
                ]}
              />
            );
          })}
        </Animated.View>
      ) : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rings: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ring: {
    position: 'absolute',
    borderWidth: 1,
  },
});
