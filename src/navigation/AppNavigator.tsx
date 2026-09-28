import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { LoginScreen } from '../screens/LoginScreen'
import { TabNavigator } from './TabNavigator'
import { CreateTransactionScreen } from '../screens/CreateTransactionScreen'
import { TransactionDetailsScreen } from '../screens/TransactionDetailsScreen'
import { navigationRef } from './navigationRef'

export type RootStackParamList = {
  Login: undefined
  Main: undefined
  CreateTransaction: undefined
  TransactionDetails: {
    transactionId: string
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
            headerShown: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}