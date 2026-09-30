/**
 * Econva — Field
 *
 * The only text input in the auth journey. Moderately rounded, hairline
 * border, translucent fill, explicit focus state, 44pt trailing tap target.
 *
 * States: default | focused | error | disabled
 */

import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  appColors,
  appMotion,
  appMotionScale,
  appRadius,
  appSizing,
  appSpace,
  appType,
} from '../../theme/app';
import { usePressScale } from '../app/motion';

type FieldProps = Omit<
  TextInputProps,
  'style' | 'onFocus' | 'onBlur' | 'editable'
> & {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  onTrailingPress?: () => void;
  editable?: boolean;
  containerStyle?: ViewStyle;
  /** Removes the outer spacing, for fields inside a group. */
  flush?: boolean;
};

export function Field({
  label,
  error,
  helperText,
  icon,
  trailingIcon,
  onTrailingPress,
  editable = true,
  containerStyle,
  flush = false,
  ...textInputProps
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  /**
   * The focus ring is a separate overlay rather than a border colour on the
   * field itself, so it can be driven by opacity on the UI thread. A border
   * colour would have to be re-rendered by React on every focus change.
   */
  const focusRing = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (hasError) return;
    focusRing.value = withTiming(focused ? 1 : 0, {
      duration: reducedMotion ? 0 : appMotion.state,
    });
  }, [focusRing, focused, hasError, reducedMotion]);

  const focusRingStyle = useAnimatedStyle(() => ({
    opacity: focusRing.value,
    transform: [{ scale: 1 - focusRing.value * 0.02 }],
  }));

  const {
    style: trailingPressStyle,
    onPressIn: trailingPressIn,
    onPressOut: trailingPressOut,
  } = usePressScale({ scale: appMotionScale.icon, dim: 0.55 });

  const iconColor = hasError
    ? appColors.error
    : focused
      ? appColors.accentBright
      : appColors.textTertiary;

  const handleTrailingPress = () => {
    Haptics.selectionAsync();
    onTrailingPress?.();
  };

  return (
    <View style={[styles.container, !flush && styles.spaced, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          hasError && styles.fieldError,
          !editable && styles.fieldDisabled,
        ]}
      >
        {!hasError ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.focusRing, focusRingStyle]}
          />
        ) : null}

        {icon ? <Ionicons name={icon} size={appSizing.icon} color={iconColor} /> : null}

        <TextInput
          {...textInputProps}
          style={[styles.input, icon ? styles.inputWithIcon : null]}
          placeholderTextColor={appColors.textTertiary}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {trailingIcon ? (
          <Pressable
            onPress={handleTrailingPress}
            onPressIn={trailingPressIn}
            onPressOut={trailingPressOut}
            disabled={!onTrailingPress}
            accessibilityRole="button"
            accessibilityLabel="Alternar visibilidade"
            hitSlop={8}
            style={styles.trailing}
          >
            <Animated.View style={trailingPressStyle}>
              <Ionicons
                name={trailingIcon}
                size={appSizing.icon}
                color={iconColor}
              />
            </Animated.View>
          </Pressable>
        ) : null}
      </View>

      {hasError ? (
        <View style={styles.messageRow}>
          <Ionicons
            name="alert-circle"
            size={14}
            color={appColors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  spaced: {
    marginBottom: appSpace.lg,
  },

  label: {
    ...appType.label,
    color: appColors.textSecondary,
    marginBottom: appSpace.sm,
  },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: appSizing.field,
    paddingLeft: appSpace.xl,
    paddingRight: appSpace.sm,
    borderRadius: appRadius.field,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },

  fieldFocused: {
    backgroundColor: appColors.accentWash,
    borderColor: appColors.borderFocused,
  },

  /**
   * The animated focus ring. Sits behind the input content and traces the
   * field's own radius, so the transition reads as the border coming alive
   * rather than a colour being swapped.
   */
  focusRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: appRadius.field + 2,
    borderWidth: 2,
    borderColor: appColors.borderFocused,
  },

  fieldError: {
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderColor: appColors.error,
  },

  fieldDisabled: {
    opacity: 0.5,
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingVertical: 0,
    ...appType.body,
    color: appColors.textPrimary,
  },

  inputWithIcon: {
    marginLeft: appSpace.md,
  },

  trailing: {
    width: appSizing.tap,
    height: appSizing.tap,
    alignItems: 'center',
    justifyContent: 'center',
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.xs,
    marginTop: appSpace.sm,
  },

  errorText: {
    flex: 1,
    ...appType.caption,
    color: appColors.error,
  },

  helperText: {
    ...appType.caption,
    color: appColors.textTertiary,
    marginTop: appSpace.sm,
  },
});
