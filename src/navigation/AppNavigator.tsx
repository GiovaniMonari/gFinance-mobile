import {
  NavigationContainer,
  getStateFromPath as defaultGetStateFromPath,
  type LinkingOptions,
} from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { WelcomeScreen } from '../screens/WelcomeScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen'
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen'
import { TabNavigator } from './TabNavigator'
import { CreateTransactionScreen } from '../screens/CreateTransactionScreen'
import { TransactionDetailsScreen } from '../screens/TransactionDetailsScreen'
import { navigationRef } from './navigationRef'
import { ConnectBankScreen } from '../screens/ConnectBankScreen'
import { CreateGoalScreen } from '../screens/CreateGoalScreen'
import { GoalDetailsScreen } from '../screens/GoalDetailsScreen'
import { RecurringExpensesScreen } from '../screens/RecurringExpensesScreen'
import { CreateRecurringExpenseScreen } from '../screens/CreateRecurringExpenseScreen'
import { ScanReceiptScreen } from '../screens/ScanReceiptScreen'
import { RegisterScreen } from '../screens/RegisterScreen'
import { LegalDocumentScreen } from '../screens/LegalDocumentScreen'
import { appColors } from '../theme/app'

export type RootStackParamList = {
  Welcome: undefined
  Login: { passwordReset?: 'success' } | undefined
  Register: undefined
  ForgotPassword: undefined
  /**
   * Landing for reset-related links that reach the app instead of the browser.
   * The password itself is never handled here — see the screen.
   */
  ResetPassword: { token?: string; status?: string } | undefined
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

  ScanReceipt: undefined

  LegalDocument: {
    key: 'terms' | 'privacy'
    requireAcceptance?: boolean
    userId?: string
  }
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

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['econva://'],
  config: {
    screens: {
      Welcome: 'welcome',
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      Main: 'main',
    },
  },
  /**
   * The web "Open Econva" step and hand-typed links do not all spell the path
   * the same way (`reset-password/success`, `auth/reset-password`, ...), so
   * aliases are normalised to the canonical path before the default parser
   * runs. Query strings ride along untouched and become route params.
   *
   * Success deep links land directly on Login with the success flag — the
   * reader continues by signing in with the new password, never by being
   * signed in automatically.
   */
  getStateFromPath: (path, options) => {
    const [rawPath, query = ''] = path.split('?')
    const slug = rawPath.replace(/^\/+|\/+$/g, '').toLowerCase()
    const suffix = query ? `?${query}` : ''

    const LOGIN_SUCCESS = new Set([
      'login/success',
      'auth/login/success',
      'reset-password/success',
      'reset_password/success',
      'password-reset/success',
      'auth/reset-password/success',
      'auth/password-reset/success',
    ])

    const LOGIN = new Set(['auth/login', 'signin', 'sign-in'])

    const RESET = new Set([
      'reset_password',
      'password-reset',
      'auth/reset-password',
      'auth/password-reset',
      'forgot-password/sent',
    ])

    const FORGOT = new Set([
      'forgot_password',
      'auth/forgot-password',
      'auth/password-forgot',
    ])

    if (LOGIN_SUCCESS.has(slug)) {
      const joiner = query ? '&' : '?'
      return defaultGetStateFromPath(
        `login${query ? `?${query}${joiner}` : '?'}passwordReset=success`,
        options,
      )
    }

    // `login?passwordReset=success` already carries the flag — pass through.
    if (slug === 'login' || LOGIN.has(slug)) {
      return defaultGetStateFromPath(`login${suffix}`, options)
    }

    if (RESET.has(slug)) {
      return defaultGetStateFromPath(`reset-password${suffix}`, options)
    }

    if (FORGOT.has(slug)) {
      return defaultGetStateFromPath(`forgot-password${suffix}`, options)
    }

    return defaultGetStateFromPath(path, options)
  },
}

export function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
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
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={authScreenOptions}
        />

        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
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

        <Stack.Screen
          name="ScanReceipt"
          component={ScanReceiptScreen}
          options={appScreenOptions}
        />

        <Stack.Screen
          name="LegalDocument"
          component={LegalDocumentScreen}
          options={detailScreenOptions}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
