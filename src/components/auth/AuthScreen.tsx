/**
 * Econva — Auth Screen
 *
 * The shell every authentication screen is built on: one dark canvas, one
 * backdrop, one scroll container, one keyboard strategy. Because the shell is
 * shared, the three screens inherit identical safe-area, keyboard and
 * small-screen behaviour and differ only in composition.
 */

import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  appColors,
  appGradients,
  appGradientsDirections,
  appSpace,
  type AppBackdropVariant,
} from '../../theme/app';
import { Backdrop } from '../ui/Backdrop';

type AuthScreenProps = {
  children: ReactNode;
  variant?: AppBackdropVariant;
  /**
   * Content pinned to the bottom of the screen, outside the scroll area.
   * Used by Welcome, where the primary action must always be reachable.
   */
  footer?: ReactNode;
  /** Extra bottom padding inside the scroll area, for a pinned footer. */
  footerHeight?: number;
  contentStyle?: ViewStyle;
  /** Horizontal gutter shared by the scroll area and the pinned footer. */
  gutter?: number;
};

export function AuthScreen({
  children,
  variant = 'immersive',
  footer,
  footerHeight = 0,
  contentStyle,
  gutter = appSpace.xxl,
}: AuthScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.canvas} />

      <Backdrop variant={variant} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: gutter,
              paddingTop: insets.top + appSpace.xl,
              paddingBottom: insets.bottom + appSpace.huge + footerHeight,
            },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {children}
        </ScrollView>

        {footer ? (
          <View
            style={[
              styles.footer,
              { paddingBottom: insets.bottom + appSpace.lg },
            ]}
          >
            <LinearGradient
              colors={[...appGradients.fadeDown]}
              start={appGradientsDirections.vertical.start}
              end={appGradientsDirections.vertical.end}
              style={styles.footerFade}
              pointerEvents="none"
            />
            <View style={[styles.footerInner, { paddingHorizontal: gutter }]}>
              {footer}
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: appColors.canvas,
  },

  flex: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: appSpace.enormous,
  },

  footerFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  footerInner: {
    gap: appSpace.sm,
  },
});
