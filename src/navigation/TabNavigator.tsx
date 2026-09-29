import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native'

import { DashboardScreen } from '../screens/DashboardScreen'
import { TransactionsScreen } from '../screens/TransactionsScreen'
import { GoalsScreen } from '../screens/GoalsScreen'
import { ProfileScreen } from '../screens/ProfileScreen'

export type TabParamList = {
  Dashboard: undefined
  Transactions: undefined
  Goals: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<TabParamList>()

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
]

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ state, navigation }) => (
        <View style={styles.wrapper}>
          <View style={styles.bar}>
            {tabs.map((tab) => {
              const focused =
                state.routes[state.index]?.name === tab.name

              return (
                <Pressable
                  key={tab.name}
                  onPress={() => {
                    navigation.navigate(tab.name)
                  }}
                  style={[
                    styles.tab,
                    focused && styles.activeTab,
                  ]}
                >
                  <Ionicons
                    name={
                      focused
                        ? tab.activeIcon
                        : tab.inactiveIcon
                    }
                    size={21}
                    color={
                      focused
                        ? '#2563eb'
                        : '#98a2b3'
                    }
                  />

                  {focused && (
                    <Text style={styles.activeLabel}>
                      {tab.label}
                    </Text>
                  )}
                </Pressable>
              )
            })}
          </View>
        </View>
      )}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Início',
        }}
      />

      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          title: 'Transações',
        }}
      />

      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          title: 'Metas',
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },

  bar: {
    height: 64,
    backgroundColor: '#ffffff',
    borderRadius: 22,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',

    paddingHorizontal: 8,

    shadowColor: '#101828',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 20,

    elevation: 8,
  },

  tab: {
    height: 44,
    minWidth: 52,

    paddingHorizontal: 14,

    borderRadius: 16,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,
  },

  activeTab: {
    backgroundColor: '#eaf2ff',
  },

  activeLabel: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
})