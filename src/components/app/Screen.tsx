/**
 * Econva — Screen
 *
 * The shell every authenticated screen is built on: the same dark canvas and
 * backdrop as the authentication experience, the same safe-area and keyboard
 * strategy, plus the clearance the floating tab bar needs.
 *
 * Two shells, because screens differ in what scrolls:
 *   Screen        a plain container — use it when a FlatList owns the scroll
 *   ScrollScreen  a container that owns the scroll
 */

import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appColors, appLayout, appSpace } from '../../theme/app';
import { Backdrop } from '../ui';

type BaseProps = {
  children: ReactNode;
  /** Adds the clearance the floating tab bar needs. */
  tabBar?: boolean;
  /** Renders the top safe-area inset. Stack screens own their own header. */
  topInset?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * The pull-to-refresh control, in one place so the gesture reads the same on
 * every screen that offers it.
 *
 * React Native does not simply place this beside the content. On Android it
 * clones the `refreshControl` element and passes the entire scroll view in as
 * its `children`, with the outer layout in `style`. Both have to be forwarded:
 * an element that ignores them swallows the screen and the user sees the
 * backdrop with nothing on it. On iOS the element is a childless sibling of
 * the content, so forwarding is a no-op there.
 *
 * A FlatList owns its own scrolling, so it takes this as its `refreshControl`
 * rather than sitting inside `ScrollScreen`.
 */
export function AppRefreshControl({
  refreshing,
  onRefresh,
  style,
  children,
}: {
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  // No gesture on this screen. Nothing to render on iOS; Android still hands
  // us the scroll view, so it has to be given back untouched.
  if (!onRefresh) {
    if (children == null) return null;
    return <View style={style}>{children}</View>;
  }

  return (
    <RefreshControl
      style={style}
      refreshing={Boolean(refreshing)}
      onRefresh={onRefresh}
      tintColor={appColors.accentBright}
      colors={[appColors.accent]}
      progressBackgroundColor={appColors.canvasElevated}
    >
      {children}
    </RefreshControl>
  );
}

function useInsets(options: { tabBar: boolean; topInset: boolean }) {
  const insets = useSafeAreaInsets();

  /**
   * The tab bar floats above the content: bottom inset + margin + bar height,
   * plus breathing room so the last row never touches the bar.
   */
  const tabBarClearance =
    insets.bottom +
    appLayout.tabBarMargin +
    appLayout.tabBarHeight +
    appSpace.lg;

  return {
    top: options.topInset ? insets.top + appLayout.screenTop : 0,
    bottom: options.tabBar
      ? tabBarClearance
      : insets.bottom + appLayout.stackBottom,
    left: insets.left,
    right: insets.right,
  };
}

export function Screen({
  children,
  tabBar = false,
  topInset = true,
  style,
}: BaseProps) {
  const padding = useInsets({ tabBar, topInset });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.system} />
      <Backdrop variant="app" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.flex,
            // Caller styling first, so the safe-area padding below always wins.
            style,
            {
              paddingTop: padding.top,
              paddingBottom: padding.bottom,
              paddingLeft: padding.left,
              paddingRight: padding.right,
            },
          ]}
        >
          {children}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

type ScrollScreenProps = BaseProps & {
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScrollScreen({
  children,
  tabBar = false,
  topInset = true,
  refreshing,
  onRefresh,
  contentStyle,
  style,
}: ScrollScreenProps) {
  const padding = useInsets({ tabBar, topInset });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.system} />
      <Backdrop variant="app" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            // Caller styling first, so the safe-area padding below always wins.
            contentStyle,
            {
              paddingTop: padding.top,
              paddingBottom: padding.bottom,
              paddingLeft: padding.left + appLayout.gutter,
              paddingRight: padding.right + appLayout.gutter,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
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

  scrollContent: {
    flexGrow: 1,
  },
});
