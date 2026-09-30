/**
 * Econva — Login
 *
 * The focused state of the journey. The artwork recedes to the top edge, the
 * form takes the stage, and the composition is anchored: brand, heading,
 * fields, action.
 */

import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { login } from '../api/authApi';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  appColors,
  appMotion,
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

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const brandEntrance = useEntrance();
  const headingEntrance = useEntrance({ delay: appMotion.stagger });
  const formEntrance = useEntrance({ delay: appMotion.stagger * 2 });
  const actionEntrance = useEntrance({ delay: appMotion.stagger * 3 });

  async function handleLogin() {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      showAlert({
        title: 'Atenção',
        message: 'Preencha o e-mail e a senha.',
        tone: 'warning',
      })
      return
    }

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

      <Animated.View style={[styles.form, formEntrance]}>
        <AuthField
          label="E-mail"
          placeholder="seu@email.com"
          icon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        <AuthField
          label="Senha"
          placeholder="Digite sua senha"
          icon="lock-closed-outline"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
          onTrailingPress={() => setShowPassword((value) => !value)}
          flush
        />
      </Animated.View>

      <View style={styles.actionSpacer} />

      <Animated.View style={actionEntrance}>
        <AuthButton
          title="Entrar"
          loadingTitle="Entrando..."
          loading={loading}
          onPress={handleLogin}
        />

        <AuthLink
          label="Ainda não tem conta?"
          action="Criar conta"
          onPress={() => {
            navigation.navigate('Register')
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

  form: {
    marginTop: appSpace.xxxl,
  },

  link: {
    marginTop: appSpace.md,
  },
});
