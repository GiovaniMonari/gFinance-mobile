/**
 * Econva — Tab Navigation
 *
 * A floating bar on the same canvas as the content, never heavier than it.
 *
 * Design decisions:
 *   · One active treatment. The accent appears as a soft wash behind the icon
 *     and in the icon/label colour — a second pill behind the label would read
 *     as two separate badges.
 *   · Depth from a hairline and a shadow, because a blur alone disappears on a
 *     near-black canvas.
 *   · A real blur on Android too, with a matching fallback ground for devices
 *     that cannot render one.
 *   · The whole tab is a single accessibility node.
 *
 * Routes, navigation behaviour and the active-state logic are unchanged.
 */

import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import {
  appColors,
  appLayout,
  appMotion,
  appRadius,
  appSpace,
  appType,
} from '../theme/app';
import { AppText, usePressScale } from '../components/app';

export type TabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Goals: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const tabs = [
  {
    name: 'Dashboard' as const,
    label: 'Início',
    activeIcon: 'home' as const,
    inactiveIcon: 'home-outline' as const,
  },
  {
    name: 'Transactions' as const,
    label: 'Transações',
    activeIcon: 'swap-horizontal' as const,
    inactiveIcon: 'swap-horizontal-outline' as const,
  },
  {
    name: 'Goals' as const,
    label: 'Metas',
    activeIcon: 'flag' as const,
    inactiveIcon: 'flag-outline' as const,
  },
  {
    name: 'Profile' as const,
    label: 'Perfil',
    activeIcon: 'person' as const,
    inactiveIcon: 'person-outline' as const,
  },
] as const;

/**
 * One tab.
 *
 * The active state crossfades rather than swapping: the outline icon and the
 * neutral label sit underneath, the filled icon and the accent label sit on top
 * and fade up as the tab takes focus. Colour cannot be interpolated through a
 * plain prop, so the two states are drawn and one is made transparent — which
 * is also what lets the wash, the icon and the label arrive as a single
 * gesture instead of three separate snaps.
 */
function TabItem({
  tab,
  focused,
  onPress,
}: {
  tab: (typeof tabs)[number];
  focused: boolean;
  onPress: () => void;
}) {
  const active = useSharedValue(focused ? 1 : 0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    active.value = withTiming(focused ? 1 : 0, {
      duration: reducedMotion ? 0 : appMotion.state,
    });
  }, [active, focused, reducedMotion]);

  const activeStyle = useAnimatedStyle(() => ({
    opacity: active.value,
    transform: [{ scale: 0.86 + active.value * 0.14 }],
  }));

  const washStyle = useAnimatedStyle(() => ({
    opacity: active.value,
  }));

  const { style: pressStyle, onPressIn, onPressOut } = usePressScale({
    scale: 0.94,
    dim: 0.75,
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: focused }}
      style={styles.tab}
    >
      {/* One wash across the whole tab — icon and label together. */}
      <Animated.View pointerEvents="none" style={[styles.wash, washStyle]} />

      <Animated.View style={pressStyle}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={tab.inactiveIcon}
            size={21}
            color={appColors.textTertiary}
          />
          <Animated.View style={[styles.layer, activeStyle]} pointerEvents="none">
            <Ionicons
              name={tab.activeIcon}
              size={21}
              color={appColors.accentBright}
            />
          </Animated.View>
        </View>

        <View style={styles.labelWrap}>
          <AppText
            variant="micro"
            tone="tertiary"
            numberOfLines={1}
            style={styles.label}
          >
            {tab.label}
          </AppText>
          <Animated.View style={[styles.layer, activeStyle]} pointerEvents="none">
            <AppText
              variant="micro"
              color={appColors.accentBright}
              numberOfLines={1}
              style={styles.label}
            >
              {tab.label}
            </AppText>
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={({ state, navigation }) => (
        <View
          style={[
            styles.wrapper,
            {
              bottom: insets.bottom + appLayout.tabBarMargin,
              left: appLayout.tabBarMargin + insets.left,
              right: appLayout.tabBarMargin + insets.right,
            },
          ]}
        >
          <BlurView
            intensity={64}
            tint="dark"
            blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
            style={styles.blur}
          >
            {/* Devices without a working blur still need a readable bar. */}
            {Platform.OS === 'android' ? (
              <View style={styles.fallback} pointerEvents="none" />
            ) : null}

            <View style={styles.bar}>
              {tabs.map((tab) => (
                <TabItem
                  key={tab.name}
                  tab={tab}
                  focused={state.routes[state.index]?.name === tab.name}
                  onPress={() => {
                    Haptics.selectionAsync();
                    navigation.navigate(tab.name);
                  }}
                />
              ))}
            </View>
          </BlurView>
        </View>
      )}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'Transações' }} />
      <Tab.Screen name="Goals" component={GoalsScreen} options={{ title: 'Metas' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },

  blur: {
    borderRadius: appLayout.tabBarMargin,
    overflow: 'hidden',
    backgroundColor: appColors.canvasElevated,
    borderWidth: 1,
    borderColor: appColors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },

  fallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12, 14, 20, 0.86)',
  },

  bar: {
    height: appLayout.tabBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: appSpace.xs,
  },

  tab: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: appRadius.md,
  },

  /**
   * One treatment for the whole tab — icon and label together. A wash behind
   * the icon alone left the label floating outside the highlight.
   *
   * Backgrounds are used rather than `android_ripple`: Android draws ripples
   * against the view outline, which React Native's `overflow: hidden` does not
   * set, so a ripple renders as a hard square. A background colour respects
   * `borderRadius` on both platforms.
   */
  wash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: appRadius.md,
    backgroundColor: appColors.accentWash,
  },

  /** Overlays that sit exactly on top of their inactive counterpart. */
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  labelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    ...appType.micro,
    letterSpacing: 0.2,
    textTransform: 'none',
  },
});
