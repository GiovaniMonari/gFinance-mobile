/**
 * Econva — App Header
 *
 * The header for stack screens. It inherits the authentication hierarchy —
 * eyebrow, then a restrained title — and adds only what an authenticated
 * screen needs: an optional back affordance, an optional trailing action and
 * a hairline that appears only once content scrolls beneath it.
 */

import React, { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  appColors,
  appMotion,
  appMotionScale,
  appRadius,
  appSpace,
} from '../../theme/app';
import { AppText } from './AppText';
import { usePressScale } from './motion';

type AppHeaderProps = {
  title: string;
  eyebrow?: string;
  onBackPress?: () => void;
  action?: ReactNode;
  /** Renders a hairline under the header. */
  bordered?: boolean;
};

export function AppHeader({
  title,
  eyebrow,
  onBackPress,
  action,
  bordered = false,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + appSpace.sm },
        bordered && styles.bordered,
      ]}
    >
      {onBackPress ? (
        <BackControl onPress={onBackPress} />
      ) : null}

      <View style={styles.titles}>
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
      </View>

      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

/**
 * The back affordance.
 *
 * Separate from `IconButton` because it answers a press by moving the reader
 * back in the stack, and pressing the arrow should feel like the arrow giving
 * way — a short nudge in the direction of travel rather than a generic dim.
 */
function BackControl({ onPress }: { onPress: () => void }) {
  const nudge = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const [isPressed, setPressed] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      nudge.value = withTiming(0, { duration: appMotion.press });
      return;
    }
    nudge.value = withSpring(isPressed ? 1 : 0, {
      damping: 18,
      stiffness: 320,
      mass: 0.6,
    });
  }, [isPressed, nudge, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - nudge.value * 0.35,
    transform: [{ translateX: -nudge.value * 3 }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      hitSlop={8}
    >
      <Animated.View style={[styles.iconButton, style]}>
        <Ionicons
          name="chevron-back"
          size={20}
          color={appColors.textPrimary}
        />
      </Animated.View>
    </Pressable>
  );
}

/** Square icon control used in headers and section rows. */
export function IconButton({
  icon,
  onPress,
  tone = 'neutral',
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  tone?: 'neutral' | 'accent' | 'positive' | 'negative';
  accessibilityLabel?: string;
}) {
  const color =
    tone === 'accent'
      ? appColors.accentBright
      : tone === 'positive'
        ? appColors.income
        : tone === 'negative'
          ? appColors.expense
          : appColors.textSecondary;

  const { style: pressStyle, onPressIn, onPressOut } = usePressScale({
    scale: appMotionScale.icon,
    dim: 0.6,
  });

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <Animated.View style={[styles.iconButton, pressStyle]}>
        <Ionicons name={icon} size={20} color={color} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.md,
    minHeight: 60,
    paddingBottom: appSpace.md,
  },

  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: appColors.border,
  },

  titles: {
    flex: 1,
    justifyContent: 'center',
  },

  titleWithEyebrow: {
    marginTop: 3,
  },

  action: {
    minWidth: 40,
    alignItems: 'flex-end',
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: appRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },
});
