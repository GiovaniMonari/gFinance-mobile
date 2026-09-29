import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { LoginScreen } from '../screens/LoginScreen'
import { TabNavigator } from './TabNavigator'
import { CreateTransactionScreen } from '../screens/CreateTransactionScreen'
import { TransactionDetailsScreen } from '../screens/TransactionDetailsScreen'
import { navigationRef } from './navigationRef'
import { ConnectBankScreen } from '../screens/ConnectBankScreen'
import { CreateGoalScreen } from '../screens/CreateGoalScreen'
import { GoalDetailsScreen } from '../screens/GoalDetailsScreen'
import { RegisterScreen } from '../screens/RegisterScreen'

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  Main: undefined
  CreateTransaction: undefined

  TransactionDetails: {
    transactionId: string
    source: 'LOCAL' | 'OPEN_FINANCE'
  }

  ConnectBank: undefined

  CreateGoal: undefined
  GoalDetails: {
    goalId: string
  }
}

const Stack =
  createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Main"
          component={TabNavigator}
        />

        <Stack.Screen
          name="CreateTransaction"
          component={CreateTransactionScreen}
          options={{
            title: 'Nova transação',
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="TransactionDetails"
          component={TransactionDetailsScreen}
          options={{
            title: 'Detalhes',
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="ConnectBank"
          component={ConnectBankScreen}
          options={{
            title: 'Conectar banco',
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="CreateGoal"
          component={CreateGoalScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="GoalDetails"
          component={GoalDetailsScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}