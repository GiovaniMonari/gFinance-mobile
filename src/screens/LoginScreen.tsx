/**
 * Econva — Login
 *
 * The focused state of the journey. The artwork recedes to the top edge, the
 * form takes the stage, and the composition is anchored: brand, heading,
 * fields, action.
 *
 * It is also the landing of the password-reset flow: after the web page
 * finishes the reset, "Open Econva" deep-links here with
 * `passwordReset=success`, and the screen greets the reader with the success
 * state instead of a bare form. Nothing signs in automatically.
 */

import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { login } from '../api/authApi';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  appColors,
  appMotion,
  appRadius,
  appSpace,
  appType,
} from '../theme/app';
import { showAlert } from '../components/app';
import {
  AuthButton,
  AuthEyebrow,
  AuthField,
  AuthLink,
  AuthLogo,
  AuthScreen,
  useEntrance,
} from '../components/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const brandEntrance = useEntrance();
  const headingEntrance = useEntrance({ delay: appMotion.stagger });
  const noticeEntrance = useEntrance({ delay: appMotion.stagger * 2 });
  const formEntrance = useEntrance({ delay: appMotion.stagger * 2 });
  const actionEntrance = useEntrance({ delay: appMotion.stagger * 3 });

  const passwordReset = route.params?.passwordReset === 'success';

  async function handleLogin() {
    const cleanEmail = email.trim().toLowerCase();
    let valid = true;

    if (!cleanEmail) {
      setEmailError('Digite seu e-mail.');
      valid = false;
    } else if (!EMAIL_PATTERN.test(cleanEmail)) {
      setEmailError('Digite um e-mail válido.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Digite sua senha.');
      valid = false;
    }

    if (!valid) return;

    try {
      setLoading(true)

      await login(cleanEmail, password)

      navigation.replace('Main')
    } catch (error) {
      showAlert({
        title: 'Não foi possível entrar',
        message:
          error instanceof Error
            ? error.message
            : 'Verifique suas credenciais e tente novamente.',
        tone: 'danger',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScreen variant="focused">
      <Animated.View style={[styles.brand, brandEntrance]}>
        <AuthLogo variant="mark" size={32} />
        <AuthLogo
          variant="wordmark"
          width={98}
          tint={appColors.textPrimary}
        />
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View style={headingEntrance}>
        <AuthEyebrow>Acesso</AuthEyebrow>

        <Text style={styles.title}>Bom te ver de volta.</Text>

        <Text style={styles.subtitle}>
          Entre para continuar de onde parou.
        </Text>
      </Animated.View>

      {passwordReset ? (
        <Animated.View style={[styles.notice, noticeEntrance]}>
          <View style={styles.noticeChip}>
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={appColors.success}
            />
          </View>

          <View style={styles.noticeText}>
            <Text style={styles.noticeTitle}>Senha atualizada.</Text>
            <Text style={styles.noticeMessage}>
              Entre com a nova senha para continuar.
            </Text>
          </View>
        </Animated.View>
      ) : null}

      <Animated.View style={[styles.form, formEntrance]}>
        <AuthField
          label="E-mail"
          placeholder="seu@email.com"
          icon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (emailError) setEmailError(undefined);
          }}
          editable={!loading}
          error={emailError}
        />

        <AuthField
          label="Senha"
          placeholder="Digite sua senha"
          icon="lock-closed-outline"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (passwordError) setPasswordError(undefined);
          }}
          onSubmitEditing={() => void handleLogin()}
          editable={!loading}
          error={passwordError}
          trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
          onTrailingPress={() => setShowPassword((value) => !value)}
          flush
        />

        <View style={styles.forgotRow}>
          <AuthLink
            label="Esqueceu a senha?"
            action="Recuperar acesso"
            onPress={() => {
              if (!loading) navigation.navigate('ForgotPassword');
            }}
          />
        </View>
      </Animated.View>

      <View style={styles.actionSpacer} />

      <Animated.View style={actionEntrance}>
        <AuthButton
          title="Entrar"
          loadingTitle="Entrando..."
          loading={loading}
          onPress={() => void handleLogin()}
        />

        <AuthLink
          label="Ainda não tem conta?"
          action="Criar conta"
          onPress={() => {
            if (!loading) navigation.navigate('Register');
          }}
          style={styles.link}
        />
      </Animated.View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.md,
  },

  spacer: {
    flex: 1,
    minHeight: appSpace.xxl,
  },

  /** Keeps the action closer to the form than to the heading. */
  actionSpacer: {
    flex: 0.6,
    minHeight: appSpace.lg,
  },

  title: {
    ...appType.screenTitle,
    color: appColors.textPrimary,
    marginTop: appSpace.md,
  },

  subtitle: {
    ...appType.bodySmall,
    color: appColors.textSecondary,
    marginTop: appSpace.sm,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appSpace.md,
    marginTop: appSpace.xl,
    backgroundColor: appColors.successSubtle,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: appRadius.group,
    padding: appSpace.lg,
  },

  noticeChip: {
    width: 36,
    height: 36,
    borderRadius: appRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },

  noticeText: {
    flex: 1,
    gap: 2,
  },

  noticeTitle: {
    ...appType.bodyMedium,
    color: appColors.textPrimary,
  },

  noticeMessage: {
    ...appType.caption,
    color: appColors.textSecondary,
  },

  form: {
    marginTop: appSpace.xxxl,
  },

  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: appSpace.md,
  },

  link: {
    marginTop: appSpace.md,
  },
});
