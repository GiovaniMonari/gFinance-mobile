/**
 * Econva — Profile
 *
 * Quiet and structured. Identity, account, bank link, security — each a small
 * section with a refined list, separated by space and hairlines rather than by
 * a wall of cards.
 *
 * Two relationships are kept deliberately apart here:
 *
 *   the Econva session — this screen ends it, and ending it touches the
 *   stored token and nothing else;
 *
 *   the Open Finance link — this screen only reports on it and hands it to
 *   its own screen. Nothing in the sign-out path can reach it.
 *
 * The connection is re-read every time the screen regains focus, so returning
 * from the bank screen (connected or disconnected) shows what the database
 * says rather than what the screen remembered.
 */

import { useCallback, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAccessToken, getProfile, logout } from '../api/authApi';
import {
  disconnectConnection,
  getConnections,
  getOpenFinanceStatus,
} from '../services/openFinanceService';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { navigationRef } from '../navigation/navigationRef';
import { AppLoading } from '../components/AppLoading';
import { appColors, appRadius, appSpace, appMotion } from '../theme/app';
import { Logo, useEntrance } from '../components/ui';
import {
  getCurrentVersionLabel,
  getAcceptanceStatus,
  type LegalAcceptanceStatus,
} from '../legal';
import {
  AppText,
  ListRow,
  ScrollScreen,
  Section,
  Surface,
  showAlert,
} from '../components/app';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** Only what this screen needs of the connection — the id to disconnect. */
type ActiveConnection = {
  id: string;
};

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();

  const [profile, setProfile] = useState<{ id: string; email: string } | null>(
    null,
  );
  const [profileError, setProfileError] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const [connection, setConnection] = useState<ActiveConnection | null>(null);

  /**
   * Whether the backend is letting this account begin a connection — `null`
   * while it is unknown or could not be read. It is a separate question from
   * the link above: the link says what has already happened, this says what
   * may happen next.
   */
  const [bankAvailable, setBankAvailable] = useState<boolean | null>(null);
  const [legalStatus, setLegalStatus] = useState<LegalAcceptanceStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadProfile = useCallback(async () => {
    setProfileError(false);

    try {
      const data = await getProfile();
      setProfile(data);
      if (data?.email) {
        const status = await getAcceptanceStatus(data.email);
        setLegalStatus(status);
      }
    } catch (error) {
      console.error('ERRO AO CARREGAR PERFIL:', error);

      // The row either knows the email or says plainly that it could not get
      // it — a stale address presented as current would be worse than both.
      setProfile(null);
      setProfileError(true);
    }
  }, []);

  const loadConnection = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setConnection(null);
        return;
      }

      const response = await getConnections(accessToken);

      /*
       * Everything else in the app reads "still connected" as "not
       * disconnected": a link that is pending or expired is still the user's
       * link, and hiding it here would offer a connect button for a
       * connection that already exists.
       */
      const active = (response.connections ?? []).find(
        (candidate: { id: string; status: string }) =>
          candidate.status !== 'disconnected',
      );

      setConnection(active ? { id: active.id } : null);
    } catch (error) {
      console.error('ERRO AO VERIFICAR CONEXÃO:', error);
      setConnection(null);
    }
  }, []);

  /**
   * The answer comes from the server, which is the only place the rule and
   * the accounts it exempts live — so no screen ever learns an address or
   * carries a copy of the restriction. An unread answer stays `null`: not
   * knowing is not the same as being refused, and the section falls back to
   * the ordinary row rather than announcing a limit it never confirmed.
   */
  const loadAvailability = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;

      const status = await getOpenFinanceStatus(accessToken);

      setBankAvailable(status.available);
    } catch (error) {
      console.error('ERRO AO VERIFICAR OPEN FINANCE:', error);
      setBankAvailable(null);
    }
  }, []);

  /**
   * `showLoader` covers the first read only. It owns the screen until the
   * profile and the connection are in, because the entrances wait on `loading`
   * — but a later focus is a refresh of content already on screen, and blanking
   * the screen to tell the user it is loading a row they can see would be a
   * step backwards.
   */
  const refresh = useCallback(
    async (showLoader: boolean) => {
      if (showLoader) setLoading(true);

      try {
        await Promise.all([
          loadProfile(),
          loadConnection(),
          loadAvailability(),
        ]);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [loadProfile, loadConnection, loadAvailability],
  );

  /**
   * Focus, not mount. Disconnecting on the bank screen pushes over this one,
   * so coming back is exactly when the state has to be read again.
   */
  const booted = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const initial = !booted.current;
      booted.current = true;

      void refresh(initial);
    }, [refresh]),
  );

  const retryProfile = useCallback(async () => {
    setProfileLoading(true);

    try {
      await loadProfile();
    } finally {
      setProfileLoading(false);
    }
  }, [loadProfile]);

  const identityEntrance = useEntrance({ start: !loading });
  const accountEntrance = useEntrance({
    start: !loading,
    delay: appMotion.stagger,
  });
  const bankEntrance = useEntrance({
    start: !loading,
    delay: appMotion.stagger * 2,
  });
  const securityEntrance = useEntrance({
    start: !loading,
    delay: appMotion.stagger * 3,
  });
  const privacyEntrance = useEntrance({
    start: !loading,
    delay: appMotion.stagger * 4,
  });

  const connected = connection !== null;

  /**
   * Restricts starting a link, never keeping one — an account that already
   * holds a connection is never told the feature is unavailable while it is
   * visibly in use.
   */
  const restricted = !connected && bankAvailable === false;

  function confirmLogout() {
    if (loggingOut) return;

    showAlert({
      title: 'Sair da conta?',
      message: connected
        ? 'Somente esta sessão será encerrada. Sua conexão com o banco permanece ativa.'
        : 'Você precisará entrar novamente para acessar o Econva.',
      tone: 'warning',
      icon: 'log-out-outline',
      actions: [
        { label: 'Cancelar', style: 'secondary' },
        { label: 'Sair', style: 'primary', onPress: () => void handleLogout() },
      ],
    });
  }

  /**
   * End the Econva session and nothing else. The token is dropped and the
   * app returns to the welcome screen — the Open Finance link is not read,
   * not called and not touched, so the bank stays connected exactly as it
   * was.
   */
  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();

      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('ERRO AO SAIR DA CONTA:', error);

      // The session is still here, so say so instead of letting the tap look
      // like it worked.
      setLoggingOut(false);

      showAlert({
        title: 'Não foi possível sair da conta',
        message:
          error instanceof Error
            ? error.message
            : 'Tente novamente em instantes.',
        tone: 'danger',
      });
    }
  }

  /**
   * Destructive, so nothing happens on a single tap. Same panel, same words
   * and same confirmation as the bank screen — one disconnection, one meaning.
   */
  function confirmDisconnect() {
    if (!connection || disconnecting) return;

    showAlert({
      title: 'Desconectar este banco?',
      message:
        'A sincronização das suas contas e transações será encerrada. Você pode conectar novamente quando quiser.',
      tone: 'warning',
      icon: 'unlink-outline',
      actions: [
        { label: 'Cancelar', style: 'secondary' },
        {
          label: 'Desconectar',
          style: 'danger',
          onPress: () => void handleDisconnect(connection.id),
        },
      ],
    });
  }

  async function handleDisconnect(connectionId: string) {
    setDisconnecting(true);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('Sessão expirada');

      const result = await disconnectConnection(accessToken, connectionId);

      /*
       * Gone either way — including when it had already been severed from
       * another device — so the screen settles on the disconnected state
       * rather than keeping a link nobody can reach any more. This is the
       * whole of what "atualizar após a desconexão" means here: no stale
       * connected row survives the round trip.
       */
      setConnection(null);

      const settled = result.status === 'already_disconnected';

      showAlert({
        title: settled ? 'Banco já desconectado' : 'Banco desconectado',
        message: settled
          ? 'Esta conexão já havia sido encerrada.'
          : 'A sincronização com o seu banco foi encerrada.',
        tone: settled ? 'neutral' : 'success',
      });
    } catch (error) {
      console.error('ERRO AO DESCONECTAR:', error);

      showAlert({
        title: 'Não foi possível desconectar',
        message:
          error instanceof Error
            ? error.message
            : 'Tente novamente em instantes.',
        tone: 'danger',
      });
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <AppLoading
        message="Carregando seu perfil"
        description="Verificando suas informações"
      />
    );
  }

  const emailMeta = profileError
    ? 'Não foi possível carregar seu e-mail'
    : profileLoading
      ? 'Carregando...'
      : profile?.email ?? 'Indisponível';

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

      {/* Account — who is signed in, and how to stop being */}
      <Animated.View style={accountEntrance}>
        <Section title="Conta Econva" eyebrow="Sua conta">
          <ListRow
            title="E-mail"
            meta={emailMeta}
            icon={profileError ? 'alert-circle-outline' : 'mail-outline'}
            iconTone={profileError ? 'negative' : 'accent'}
            showChevron={profileError}
            onPress={profileError ? () => void retryProfile() : undefined}
          />
          <ListRow
            title="Sair da conta"
            meta="Encerra esta sessão no Econva"
            icon="log-out-outline"
            iconTone="negative"
            divider
            onPress={confirmLogout}
          />
        </Section>
      </Animated.View>

      {/* Bank link — a separate relationship, read fresh from the database */}
      <Animated.View style={[bankEntrance, styles.block]}>
        <Section
          title="Conta bancária"
          eyebrow="Open Finance"
          description={
            restricted
              ? 'A conexão com o seu banco está temporariamente indisponível. Enquanto isso, o app segue completo: você registra transações, gastos recorrentes e metas direto por aqui.'
              : undefined
          }
        >
          {restricted ? (
            /*
             * Stated, not hidden. A feature that simply vanishes leaves the
             * user wondering whether they broke something; this row and the
             * line above say what is happening and what still works.
             */
            <ListRow
              title="Open Finance indisponível"
              meta="Disponível em breve"
              icon="lock-closed-outline"
              iconTone="warning"
            />
          ) : (
            <ListRow
              title={
                connected
                  ? 'Conta bancária conectada'
                  : 'Conectar conta bancária'
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
          )}
          {connected ? (
            <ListRow
              title="Desconectar banco"
              meta={
                disconnecting
                  ? 'Desconectando'
                  : 'Encerra a sincronização com o seu banco'
              }
              icon="unlink-outline"
              iconTone="negative"
              divider
              onPress={confirmDisconnect}
            />
          ) : null}
        </Section>
      </Animated.View>

      {/* Legal & Compliance */}
      <Animated.View style={[securityEntrance, styles.block]}>
        <Section title="Documentos Legais" eyebrow="Termos & LGPD">
          <ListRow
            title="Termos de Uso"
            meta={
              legalStatus?.documents.terms.acceptedVersion
                ? `Versão ${legalStatus.documents.terms.acceptedVersion} • Aceito`
                : `Versão ${getCurrentVersionLabel('terms')}`
            }
            icon="document-text-outline"
            iconTone="accent"
            showChevron
            onPress={() =>
              navigation.navigate('LegalDocument', {
                key: 'terms',
                userId: profile?.email,
              })
            }
          />
          <ListRow
            title="Política de Privacidade"
            meta={
              legalStatus?.documents.privacy.acceptedVersion
                ? `Versão ${legalStatus.documents.privacy.acceptedVersion} • Aceita`
                : `Versão ${getCurrentVersionLabel('privacy')}`
            }
            icon="shield-outline"
            iconTone="accent"
            showChevron
            divider
            onPress={() =>
              navigation.navigate('LegalDocument', {
                key: 'privacy',
                userId: profile?.email,
              })
            }
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
