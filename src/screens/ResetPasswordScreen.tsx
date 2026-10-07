/**
 * Econva — Reset Password (deep-link landing)
 *
 * The password itself is never touched here: the reset form lives on the web
 * application, and the email carries the link there. This screen exists for
 * the case where a reset-related link reaches the app instead of the browser
 * — an intercepted token link, a stale bookmark, a manually typed path.
 *
 * Behaviour:
 *
 *   · `status=success` (the "Open Econva" step after a web reset) replaces
 *     straight to Login with the success flag, so the reader lands where the
 *     flow continues: Login with the new password. Nothing signs in
 *     automatically.
 *
 *   · Anything else explains that the reset continues in the browser and
 *     offers the way back to Login. No password field is ever rendered.
 */

import { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  appColors,
  appMotion,
  appRadius,
  appSpace,
  appType,
} from '../theme/app';
import {
  AuthButton,
  AuthEyebrow,
  AuthLink,
  AuthLogo,
  AuthScreen,
  useEntrance,
} from '../components/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const status = route.params?.status;

  const brandEntrance = useEntrance();
  const headingEntrance = useEntrance({ delay: appMotion.stagger });
  const cardEntrance = useEntrance({ delay: appMotion.stagger * 2 });
  const actionEntrance = useEntrance({ delay: appMotion.stagger * 3 });

  /**
   * The final step of the flow — Web Reset Password → Open Econva — lands
   * directly on Login. The flag tells Login to greet the reader with the
   * success state instead of a bare form.
   */
  useEffect(() => {
    if (status === 'success') {
      navigation.replace('Login', { passwordReset: 'success' });
    }
  }, [navigation, status]);

  if (status === 'success') {
    // A single frame before the replace lands. The shell keeps the canvas
    // consistent so the hop reads as one surface, not a flash.
    return (
      <AuthScreen variant="focused">
        <View />
      </AuthScreen>
    );
  }

  function goToLogin() {
    navigation.replace('Login');
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
        <AuthEyebrow>Redefinir senha</AuthEyebrow>

        <Text style={styles.title}>Continue no navegador.</Text>

        <Text style={styles.subtitle}>
          A criação da nova senha acontece na página da web, no link que
          chegou ao seu e-mail.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.card, cardEntrance]}>
        <View style={styles.chip}>
          <Ionicons
            name="globe-outline"
            size={24}
            color={appColors.accentBright}
          />
        </View>

        <Text style={styles.cardText}>
          Abra o link do e-mail em um navegador para criar a nova senha. Depois
          de concluir por lá, volte ao app e entre com a nova senha.
        </Text>
      </Animated.View>

      <View style={styles.actionSpacer} />

      <Animated.View style={actionEntrance}>
        <AuthButton title="Ir para o login" onPress={goToLogin} />

        <AuthLink
          label="Não pediu a redefinição?"
          action="Voltar ao login"
          onPress={goToLogin}
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

  card: {
    marginTop: appSpace.xxxl,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: appRadius.group,
    padding: appSpace.xxl,
    alignItems: 'center',
  },

  chip: {
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

  cardText: {
    ...appType.bodySmall,
    color: appColors.textSecondary,
    textAlign: 'center',
  },

  link: {
    marginTop: appSpace.md,
  },
});
