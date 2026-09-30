/**
 * Econva — App Loading
 *
 * The loading state for the authenticated app. It continues the language of
 * the First Access screen: a mark that breathes inside a ring of light, with
 * the message beneath it. No spinner, no white box.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { appColors, appMotion, appSpace, appType } from '../theme/app';
import { Logo } from './ui';

type AppLoadingProps = {
  message?: string;
  description?: string;
};

export function AppLoading({
  message = 'Organizando seus dados',
  description = 'Isso leva só um momento',
}: AppLoadingProps) {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let cancelled = false;
    let loop: Animated.CompositeAnimation | undefined;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;
      if (enabled) {
        pulse.setValue(1);
        return;
      }

      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: appMotion.pulse,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: appMotion.pulse,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      loop.start();
    });

    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [pulse]);

  return (
    <View style={styles.container}>
      <View style={styles.artwork}>
        <Animated.View
          style={[
            styles.ring,
            {
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.75],
              }),
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.86, 1.08],
                  }),
                },
              ],
            },
          ]}
        />

        <Animated.View
          style={{
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 1],
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
              },
            ],
          }}
        >
          <Logo variant="mark" size={44} />
        </Animated.View>
      </View>

      <Animated.Text
        style={[
          styles.message,
          {
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.6, 1],
            }),
          },
        ]}
      >
        {message}
      </Animated.Text>

      <Animated.Text
        style={[
          styles.description,
          {
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.25, 0.6],
            }),
          },
        ]}
      >
        {description}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.canvas,
    paddingHorizontal: appSpace.xxl,
  },

  artwork: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: appSpace.xxl,
  },

  ring: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1,
    borderColor: appColors.accentBright,
  },

  message: {
    ...appType.bodyMedium,
    color: appColors.textPrimary,
    textAlign: 'center',
  },

  description: {
    ...appType.caption,
    color: appColors.textTertiary,
    textAlign: 'center',
    marginTop: appSpace.xs,
  },
});
