import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { WelcomeScreen } from '../screens/WelcomeScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { TabNavigator } from './TabNavigator'
import { CreateTransactionScreen } from '../screens/CreateTransactionScreen'
import { TransactionDetailsScreen } from '../screens/TransactionDetailsScreen'
import { navigationRef } from './navigationRef'
import { ConnectBankScreen } from '../screens/ConnectBankScreen'
import { CreateGoalScreen } from '../screens/CreateGoalScreen'
import { GoalDetailsScreen } from '../screens/GoalDetailsScreen'
import { RecurringExpensesScreen } from '../screens/RecurringExpensesScreen'
import { CreateRecurringExpenseScreen } from '../screens/CreateRecurringExpenseScreen'
import { RegisterScreen } from '../screens/RegisterScreen'
import { appColors } from '../theme/app'

export type RootStackParamList = {
  Welcome: undefined
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

  RecurringExpenses: undefined
  CreateRecurringExpense: undefined
}

const Stack =
  createNativeStackNavigator<RootStackParamList>()

/**
 * Welcome → Login → Register are three states of one surface, not three
 * destinations, so they cross-fade on the same dark canvas instead of sliding
 * like separate screens.
 */
const authScreenOptions = {
  animation: 'fade' as const,
  contentStyle: { backgroundColor: appColors.canvas },
}

/**
 * Every authenticated screen draws its own header in the product's language,
 * so the navigator contributes only the canvas. The native header is removed
 * rather than restyled.
 *
 * Pushed screens slide in from the trailing edge and the gesture-driven back
 * swipe is left on, so the motion and the touch affordance agree: whatever the
 * reader swipes away from is what they get back.
 */
const appScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right' as const,
  gestureEnabled: true,
  contentStyle: { backgroundColor: appColors.canvas },
}

/** Detail screens sit one level deeper than the stack they were pushed onto. */
const detailScreenOptions = {
  ...appScreenOptions,
  animation: 'simple_push' as const,
}

/**
 * The tab shell replaces the journey outright, so it fades rather than slides —
 * there is no lateral relationship to the auth screens behind it.
 */
const mainScreenOptions = {
  headerShown: false,
  animation: 'fade' as const,
  contentStyle: { backgroundColor: appColors.canvas },
}

export function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={authScreenOptions}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={authScreenOptions}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={authScreenOptions}
        />

        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={mainScreenOptions}
        />

        <Stack.Screen
          name="CreateTransaction"
          component={CreateTransactionScreen}
          options={appScreenOptions}
        />

        <Stack.Screen
          name="TransactionDetails"
          component={TransactionDetailsScreen}
          options={detailScreenOptions}
        />

        <Stack.Screen
          name="ConnectBank"
          component={ConnectBankScreen}
          options={appScreenOptions}
        />

        <Stack.Screen
          name="CreateGoal"
          component={CreateGoalScreen}
          options={appScreenOptions}
        />

        <Stack.Screen
          name="GoalDetails"
          component={GoalDetailsScreen}
          options={detailScreenOptions}
        />

        <Stack.Screen
          name="RecurringExpenses"
          component={RecurringExpensesScreen}
          options={appScreenOptions}
        />

        <Stack.Screen
          name="CreateRecurringExpense"
          component={CreateRecurringExpenseScreen}
          options={appScreenOptions}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
