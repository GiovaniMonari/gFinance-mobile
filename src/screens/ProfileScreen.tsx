/**
 * Econva — Profile
 *
 * Quiet and structured. Identity, integrations, security — each a small
 * section with a refined list, separated by space and hairlines rather than by
 * a wall of cards.
 *
 * Connection state and navigation are unchanged.
 */

import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAccessToken } from '../api/authApi';
import { getConnections } from '../services/openFinanceService';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { AppLoading } from '../components/AppLoading';
import { appColors, appRadius, appSpace, appMotion } from '../theme/app';
import { Logo, useEntrance } from '../components/ui';
import {
  AppText,
  ListRow,
  ScrollScreen,
  Section,
  Surface,
} from '../components/app';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkConnection() {
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) return;
        const response = await getConnections(accessToken);
        setConnected(
          (response.connections ?? []).some(
            (connection: { status: string }) => connection.status === 'connected',
          ),
        );
      } catch (error) {
        console.error('ERRO AO VERIFICAR CONEXÃO:', error);
      } finally {
        setLoading(false);
      }
    }
    checkConnection();
  }, []);

  const identityEntrance = useEntrance({ start: !loading });
  const rowsEntrance = useEntrance({ start: !loading, delay: appMotion.stagger });
  const securityEntrance = useEntrance({
    start: !loading,
    delay: appMotion.stagger * 2,
  });
  const privacyEntrance = useEntrance({
    start: !loading,
    delay: appMotion.stagger * 3,
  });

  if (loading) {
    return (
      <AppLoading
        message="Carregando seu perfil"
        description="Verificando suas informações"
      />
    );
  }

  return (
    <ScrollScreen tabBar>
      {/* Identity */}
      <Animated.View style={[styles.identity, identityEntrance]}>
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Logo variant="mark" size={44} />
          </View>

          <View style={styles.identityText}>
            <AppText variant="screenTitle" tone="primary" numberOfLines={1}>
              Minha conta
            </AppText>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <AppText variant="caption" tone="secondary">
                Conta autenticada
              </AppText>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Integrations */}
      <Animated.View style={rowsEntrance}>
        <Section title="Contas e integrações" eyebrow="Sincronização">
          <ListRow
            title={
              connected ? 'Conta bancária conectada' : 'Conectar conta bancária'
            }
            meta={
              connected
                ? 'Sincronizada via Open Finance'
                : 'Sincronize suas contas e transações'
            }
            icon={connected ? 'checkmark-circle' : 'card-outline'}
            iconTone={connected ? 'positive' : 'accent'}
            showChevron
            onPress={() => navigation.navigate('ConnectBank')}
          />
        </Section>
      </Animated.View>

      {/* Security */}
      <Animated.View style={[securityEntrance, styles.block]}>
        <Section title="Segurança" eyebrow="Sua sessão">
          <Surface variant="subtle" radius="group" padding="md">
            <View style={styles.securityInner}>
              <View style={styles.securityIcon}>
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={appColors.accentBright}
                />
              </View>

              <View style={styles.securityText}>
                <AppText variant="captionStrong" tone="primary">
                  Dados protegidos
                </AppText>
                <AppText variant="caption" tone="secondary">
                  Sua sessão é protegida por autenticação segura.
                </AppText>
              </View>
            </View>
          </Surface>
        </Section>
      </Animated.View>

      {/* Privacy — part of the security story, not an orphan note */}
      <Animated.View style={[privacyEntrance, styles.block]}>
        <View style={styles.privacy}>
          <Ionicons name="lock-closed" size={15} color={appColors.textTertiary} />
          <AppText variant="caption" tone="tertiary" style={styles.privacyText}>
            Seus dados financeiros são utilizados apenas para organizar sua vida
            financeira.
          </AppText>
        </View>
      </Animated.View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  /* Identity */
  identity: {
    marginTop: appSpace.lg,
    marginBottom: appSpace.xxxl,
  },

  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.lg,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: appRadius.control,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  identityText: {
    flex: 1,
    minWidth: 0,
    gap: appSpace.xs,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.sm,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: appColors.income,
  },

  /* Sections */
  block: {
    marginTop: appSpace.xxl,
  },

  securityInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appSpace.md,
  },

  securityIcon: {
    width: 36,
    height: 36,
    borderRadius: appRadius.md,
    backgroundColor: appColors.accentWash,
    alignItems: 'center',
    justifyContent: 'center',
  },

  securityText: {
    flex: 1,
    gap: 2,
  },

  /* Privacy */
  privacy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appSpace.md,
    paddingTop: appSpace.lg,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },

  privacyText: {
    flex: 1,
  },
});
