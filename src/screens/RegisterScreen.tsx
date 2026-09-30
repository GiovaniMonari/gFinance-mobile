/**
 * Econva — Register
 *
 * The structured state of the journey. Same foundation, same controls and the
 * same accent as Login, but the form is grouped into labelled blocks so three
 * fields never read as a bureaucratic form.
 */

import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { register } from '../api/authApi';
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
  AuthGroup,
  AuthLink,
  AuthLogo,
  AuthScreen,
  useEntrance,
} from '../components/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const brandEntrance = useEntrance();
  const headingEntrance = useEntrance({ delay: appMotion.stagger });
  const formEntrance = useEntrance({ delay: appMotion.stagger * 2 });
  const actionEntrance = useEntrance({ delay: appMotion.stagger * 3 });

  async function handleRegister() {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password || !confirmPassword) {
      showAlert({
        title: 'Atenção',
        message: 'Preencha todos os campos.',
        tone: 'warning',
      })
      return
    }

    if (password.length < 6) {
      showAlert({
        title: 'Senha inválida',
        message: 'A senha deve ter pelo menos 6 caracteres.',
        tone: 'warning',
      })
      return
    }

    if (password !== confirmPassword) {
      showAlert({
        title: 'Senhas diferentes',
        message:
          'A confirmação da senha não corresponde à senha informada.',
        tone: 'warning',
      })
      return
    }

    try {
      setLoading(true)

      await register(cleanEmail, password)

      showAlert({
        title: 'Conta criada',
        message: 'Sua conta foi criada com sucesso. Agora você já pode entrar.',
        tone: 'success',
        actions: [
          {
            label: 'Entrar',
            onPress: () => navigation.replace('Login'),
          },
        ],
      })
    } catch (error) {
      showAlert({
        title: 'Não foi possível criar sua conta',
        message:
          error instanceof Error
            ? error.message
            : 'Tente novamente em alguns instantes.',
        tone: 'danger',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScreen variant="structured">
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
        <AuthEyebrow>Novo cadastro</AuthEyebrow>

        <Text style={styles.title}>Crie sua conta.</Text>

        <Text style={styles.subtitle}>
          Leva menos de um minuto. Depois, conecte seus bancos.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.form, formEntrance]}>
        <AuthGroup title="Seu acesso" icon="key-outline">
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
            flush
          />

          <AuthField
            label="Senha"
            placeholder="Crie uma senha"
            icon="lock-closed-outline"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            helperText="Mínimo de 6 caracteres."
            trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onTrailingPress={() => setShowPassword((value) => !value)}
            flush
          />

          <AuthField
            label="Confirmar senha"
            placeholder="Digite a senha novamente"
            icon="shield-checkmark-outline"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
            trailingIcon={
              showConfirmPassword ? 'eye-off-outline' : 'eye-outline'
            }
            onTrailingPress={() =>
              setShowConfirmPassword((value) => !value)
            }
            flush
          />
        </AuthGroup>
      </Animated.View>

      <View style={styles.actionSpacer} />

      <Animated.View style={actionEntrance}>
        <AuthButton
          title="Criar conta"
          loadingTitle="Criando conta..."
          loading={loading}
          onPress={handleRegister}
        />

        <AuthLink
          label="Já tem uma conta?"
          action="Entrar"
          onPress={() => navigation.replace('Login')}
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
    minHeight: appSpace.md,
  },

  actionSpacer: {
    flex: 0.5,
    minHeight: appSpace.xxl,
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
    marginTop: appSpace.xl,
    gap: appSpace.md,
  },

  link: {
    marginTop: appSpace.md,
  },
});
