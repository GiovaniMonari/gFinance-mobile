/**
 * Econva — Welcome (First Access)
 *
 * The most expressive state of the auth journey: full-bleed artwork, an
 * editorial headline, and a single pinned call to action. Everything after
 * this screen is deliberately quieter.
 */

import { Animated, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  appColors,
  appMotion,
  appSpace,
  appType,
} from '../theme/app';
import {
  AuthButton,
  AuthEyebrow,
  AuthLogo,
  AuthOrbit,
  AuthScreen,
  useEntrance,
} from '../components/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const FOOTER_HEIGHT = 170;

export function WelcomeScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 360 || height < 700;

  const artEntrance = useEntrance({ delay: appMotion.stagger });
  const headingEntrance = useEntrance({ delay: appMotion.stagger * 3 });
  const subEntrance = useEntrance({ delay: appMotion.stagger * 4 });
  const signatureEntrance = useEntrance({ delay: appMotion.stagger * 5 });
  const primaryEntrance = useEntrance({ delay: appMotion.stagger * 6 });
  const secondaryEntrance = useEntrance({ delay: appMotion.stagger * 7 });

  return (
    <AuthScreen
      variant="immersive"
      footerHeight={FOOTER_HEIGHT}
      footer={
        <>
          <Animated.View style={primaryEntrance}>
            <AuthButton
              title="Criar conta"
              trailingIcon="arrow-forward"
              onPress={() => navigation.replace('Register')}
            />
          </Animated.View>

          <Animated.View style={secondaryEntrance}>
            <AuthButton
              title="Já tenho conta"
              variant="quiet"
              size="md"
              trailingIcon="arrow-forward-outline"
              onPress={() => navigation.replace('Login')}
            />
          </Animated.View>
        </>
      }
    >
      <View style={styles.art}>
        <Animated.View style={[styles.orbit, artEntrance]}>
          <AuthOrbit>
            <AuthLogo
              variant="mark"
              size={isCompact ? 84 : 104}
              glow
            />
          </AuthOrbit>
        </Animated.View>
      </View>

      <View style={styles.copy}>
        <Animated.View style={headingEntrance}>
          <AuthEyebrow tone="accent">Primeiro acesso</AuthEyebrow>

          <Text
            style={[
              styles.hero,
              isCompact && styles.heroCompact,
            ]}
          >
            Seu dinheiro.{'\n'}Sob controle.
          </Text>
        </Animated.View>

        <Animated.View style={subEntrance}>
          <Text style={styles.subtitle}>
            Uma visão clara de cada real do seu mês — e a próxima decisão
            sempre à mão.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.signature, signatureEntrance]}>
          <AuthLogo
            variant="wordmark"
            width={isCompact ? 104 : 120}
            tint={appColors.textPrimary}
          />
        </Animated.View>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  art: {
    flex: 1,
    minHeight: 176,
  },

  orbit: {
    flex: 1,
    width: '100%',
  },

  copy: {
    paddingTop: appSpace.xxl,
  },

  hero: {
    ...appType.hero,
    color: appColors.textPrimary,
    marginTop: appSpace.lg,
  },

  heroCompact: {
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: -1.2,
  },

  subtitle: {
    ...appType.bodySmall,
    color: appColors.textSecondary,
    marginTop: appSpace.lg,
    maxWidth: 320,
  },

  signature: {
    marginTop: appSpace.xxl,
    opacity: 0.9,
  },
});
