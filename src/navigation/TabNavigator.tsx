import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

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

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'Dashboard') {
            iconName = 'home-outline'
          } else if (route.name === 'Transactions') {
            iconName = 'swap-horizontal-outline'
          } else if (route.name === 'Goals') {
            iconName = 'flag-outline'
          } else {
            iconName = 'person-outline'
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          )
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Início' }}
      />

      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ title: 'Transações' }}
      />

      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{ title: 'Metas' }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  )
}