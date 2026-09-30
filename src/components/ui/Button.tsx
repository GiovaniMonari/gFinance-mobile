/**
 * Econva — Button
 *
 * The primary control of the journey. Only one filled button per screen.
 *
 * Variants: primary (filled gradient) | secondary (hairline) | quiet (text)
 *           | danger (hairline, expense hue — destructive confirmations only)
 * Sizes:    lg (primary actions) | md (inline actions)
 * States:   default | pressed | disabled | loading
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  appColors,
  appGradients,
  appGradientsDirections,
  appMotionScale,
  appRadius,
  appShadows,
  appSizing,
  appSpace,
  appType,
} from '../../theme/app';
import { usePressScale } from '../app/motion';

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
type ButtonSize = 'lg' | 'md';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Replaces the label while loading — pass the same string the app already uses. */
  loadingTitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  loadingTitle,
  icon,
  trailingIcon,
  fullWidth = true,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const label = loading && loadingTitle ? loadingTitle : title;
  const isPrimary = variant === 'primary';

  const { style: pressStyle, onPressIn, onPressOut } = usePressScale({
    disabled: isDisabled,
    scale: appMotionScale.control,
  });

  const handlePress = () => {
    if (isPrimary) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.selectionAsync();
    }
    onPress?.();
  };

  return (
    <View
      style={[
        styles.wrapper,
        fullWidth && styles.fullWidth,
        isPrimary && styles.wrapperPrimary,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={styles.fill}
      >
        <Animated.View
          style={[
            styles.base,
            styles[size],
            styles[`${variant}Surface` as const],
            pressStyle,
          ]}
        >
        {isPrimary ? (
          <>
            <LinearGradient
              colors={[...appGradients.accent]}
              start={appGradientsDirections.accent.start}
              end={appGradientsDirections.accent.end}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={[...appGradients.sheen]}
              start={appGradientsDirections.sheen.start}
              end={appGradientsDirections.sheen.end}
              style={styles.sheen}
              pointerEvents="none"
            />
          </>
        ) : null}

        <View style={styles.content} pointerEvents="none">
          {loading ? (
            <ActivityIndicator
              size="small"
              color={
                variant === 'quiet'
                  ? appColors.textSecondary
                  : appColors.textOnAccent
              }
            />
          ) : (
            icon && (
              <Ionicons
                name={icon}
                size={size === 'lg' ? appSizing.icon : appSizing.iconSm}
                color={
                  isPrimary ? appColors.textOnAccent : appColors.textSecondary
                }
              />
            )
          )}

          <Text
            numberOfLines={1}
            style={[
              styles.text,
              styles[`${variant}Text` as const],
            ]}
          >
            {label}
          </Text>

          {trailingIcon && !loading ? (
            <Ionicons
              name={trailingIcon}
              size={size === 'lg' ? appSizing.icon : appSizing.iconSm}
              color={isPrimary ? appColors.textOnAccent : appColors.textSecondary}
            />
          ) : null}
        </View>
      </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: appRadius.control,
  },

  wrapperPrimary: {
    ...appShadows.filled,
  },

  fullWidth: {
    width: '100%',
  },

  /** Lets the pressed button scale from its own centre. */
  fill: {
    width: '100%',
  },

  disabled: {
    opacity: 0.45,
  },

  base: {
    borderRadius: appRadius.control,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  lg: {
    height: appSizing.buttonLg,
    paddingHorizontal: appSpace.xxl,
  },

  md: {
    height: appSizing.buttonMd,
    paddingHorizontal: appSpace.xl,
  },

  primarySurface: {
    backgroundColor: appColors.accentDeep,
  },

  secondarySurface: {
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },

  quietSurface: {
    backgroundColor: 'transparent',
  },

  /**
   * Destructive, not loud. The hairline stays neutral so the only semantic
   * colour on screen is the label itself — enough to read as a warning next
   * to a cancel without turning the panel into an alarm.
   */
  dangerSurface: {
    backgroundColor: appColors.expenseSubtle,
    borderWidth: 1,
    borderColor: appColors.border,
  },

  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: appSpace.sm,
  },

  text: {
    ...appType.button,
  },

  primaryText: {
    color: appColors.textOnAccent,
  },

  secondaryText: {
    color: appColors.textPrimary,
  },

  quietText: {
    color: appColors.textSecondary,
  },

  dangerText: {
    color: appColors.expense,
  },
});
