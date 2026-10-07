/**
 * Econva — Forgot Password
 *
 * The request state of the password-reset journey. Same shell, same controls
 * and the same voice as Login: brand, heading, one field, one action.
 *
 * The actual reset form lives on the web application — the email carries the
 * link there. This screen only starts that flow, then becomes a confirmation:
 * check the inbox, back to login. The confirmation copy stays generic on
 * purpose so it never signals whether the address is registered.
 */

import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { requestPasswordReset } from '../api/authApi';
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

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const brandEntrance = useEntrance();
  const headingEntrance = useEntrance({ delay: appMotion.stagger });
  const formEntrance = useEntrance({ delay: appMotion.stagger * 2 });
  const actionEntrance = useEntrance({ delay: appMotion.stagger * 3 });

  function goToLogin() {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.replace('Login');
  }

  async function handleRequest() {
    // The button disables itself while `loading`, but the keyboard's submit
    // action does not — this keeps a second submit from firing a second
    // request whose late `finally` could clear state out from under the first.
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setEmailError('Digite seu e-mail.');
      return;
    }

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setEmailError('Digite um e-mail válido.');
      return;
    }

    setEmailError(undefined);

    try {
      setLoading(true);

      await requestPasswordReset(cleanEmail);

      setSent(true);
    } catch (error) {
      showAlert({
        title: 'Não foi possível enviar o e-mail',
        message:
          error instanceof Error
            ? error.message
            : 'Tente novamente em alguns instantes.',
        tone: 'danger',
      })
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();

    try {
      setLoading(true);

      await requestPasswordReset(cleanEmail);

      showAlert({
        title: 'E-mail reenviado',
        message:
          'Se existir uma conta com este e-mail, as instruções chegarão em instantes. Verifique também a caixa de spam.',
        tone: 'neutral',
        icon: 'mail-outline',
      })
    } catch (error) {
      showAlert({
        title: 'Não foi possível reenviar o e-mail',
        message:
          error instanceof Error
            ? error.message
            : 'Tente novamente em alguns instantes.',
        tone: 'danger',
      })
    } finally {
      setLoading(false);
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
        <AuthEyebrow>Recuperar acesso</AuthEyebrow>

        <Text style={styles.title}>
          {sent ? 'Verifique seu e-mail.' : 'Esqueceu a senha?'}
        </Text>

        <Text style={styles.subtitle}>
          {sent
            ? 'Se existir uma conta com este e-mail, enviamos as instruções de redefinição.'
            : 'Digite seu e-mail e enviaremos as instruções para criar uma nova senha.'}
        </Text>
      </Animated.View>

      {sent ? (
        <>
          <Animated.View style={[styles.confirmCard, formEntrance]}>
            <View style={styles.confirmChip}>
              <Ionicons
                name="mail-unread-outline"
                size={24}
                color={appColors.accentBright}
              />
            </View>

            <Text style={styles.confirmEmail} numberOfLines={1}>
              {email.trim().toLowerCase()}
            </Text>

            <Text style={styles.confirmText}>
              Abra o link do e-mail em um navegador para criar a nova senha e
              depois volte aqui para entrar. Não se esqueça de verificar a
              caixa de spam.
            </Text>
          </Animated.View>

          <View style={styles.actionSpacer} />

          <Animated.View style={actionEntrance}>
            <AuthButton
              title="Voltar ao login"
              loadingTitle="Aguarde..."
              loading={loading}
              onPress={goToLogin}
            />

            <AuthButton
              title="Reenviar e-mail"
              variant="secondary"
              size="md"
              loading={loading}
              onPress={() => void handleResend()}
              icon="refresh-outline"
              style={styles.resend}
            />
          </Animated.View>
        </>
      ) : (
        <>
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
              returnKeyType="send"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (emailError) setEmailError(undefined);
              }}
              onSubmitEditing={() => void handleRequest()}
              editable={!loading}
              error={emailError}
            />
          </Animated.View>

          <View style={styles.actionSpacer} />

          <Animated.View style={actionEntrance}>
            <AuthButton
              title="Enviar instruções"
              loadingTitle="Enviando..."
              loading={loading}
              onPress={() => void handleRequest()}
            />

            <AuthLink
              label="Lembrou a senha?"
              action="Voltar ao login"
              onPress={() => {
                if (!loading) goToLogin();
              }}
              style={styles.link}
            />
          </Animated.View>
        </>
      )}
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

  form: {
    marginTop: appSpace.xxxl,
  },

  link: {
    marginTop: appSpace.md,
  },

  confirmCard: {
    marginTop: appSpace.xxxl,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: appRadius.group,
    padding: appSpace.xxl,
    alignItems: 'center',
  },

  confirmChip: {
    width: 48,
    height: 48,
    borderRadius: appRadius.control,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.accentWash,
    borderWidth: 1,
    borderColor: appColors.borderAccent,
    marginBottom: appSpace.lg,
  },

  confirmEmail: {
    ...appType.bodyMedium,
    color: appColors.textPrimary,
    marginBottom: appSpace.sm,
  },

  confirmText: {
    ...appType.bodySmall,
    color: appColors.textSecondary,
    textAlign: 'center',
  },

  resend: {
    marginTop: appSpace.md,
  },
});
