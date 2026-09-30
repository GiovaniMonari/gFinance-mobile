/**
 * Econva — Connect Bank
 *
 * A screen that has to communicate trust. Same dark language as the rest of
 * the product, but the emphasis moves to the security story: the institution,
 * the connection state, and a plain statement about what the user does and does
 * not share. No stock imagery of banks, no badges of invented certifications.
 *
 * The Pluggy Connect flow, the token exchange and all messages are unchanged.
 */

import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Reanimated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PluggyConnect } from 'react-native-pluggy-connect';
import {
  createConnectToken,
  connectBank,
  disconnectConnection,
  getConnections,
  getOpenFinanceStatus,
  getAccounts,
  getTransactions,
} from '../services/openFinanceService';
import { getAccessToken } from '../api/authApi';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { AppLoading } from '../components/AppLoading';
import { appColors, appMotion, appRadius, appSpace } from '../theme/app';
import { Button, useEntrance } from '../components/ui';
import {
  AppHeader,
  AppText,
  ListRow,
  ScrollScreen,
  Section,
  Surface,
  showAlert,
} from '../components/app';
import { translateAccountSubtype } from '../utils/transaction';

/*
 * Layout animation definitions live at module scope, not inline in JSX.
 * `FadeIn.duration(...)` builds a new object every time it is called, and an
 * `entering` prop that changes identity re-triggers the entrance — so a screen
 * that merely re-renders would replay its fade from zero opacity and look like
 * it had blanked. Stable references, stable behaviour.
 */
const ENTER = FadeIn.duration(appMotion.layout);
const EXIT = FadeOut.duration(appMotion.state);
const ROW_LAYOUT = LinearTransition.duration(appMotion.layout);

/** Pre-built staggered entrances, so a row's animation never changes identity. */
const ROW_ENTER = Array.from({ length: 9 }, (_, i) =>
  FadeInDown.duration(appMotion.layout).delay(i * appMotion.stagger),
);

type BankAccount = {
  id: string;
  type: string;
  subtype: string;
  name: string | null;
  balance: number | null;
  currency_code: string | null;
  marketing_name: string | null;
  bank: {
    name: string | null;
    transfer_number: string | null;
  } | null;
  credit: {
    brand: string | null;
    available_credit_limit: number | null;
    credit_limit: number | null;
    minimum_payment: number | null;
    balance_due_date: string | null;
    status: string | null;
  } | null;
};

type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string | null;
  type: 'DEBIT' | 'CREDIT';
  status: string;
};

type Connection = {
  id: string;
  provider: string;
  status: string;
  external_id: string;
  user_id: string;
};

/**
 * Accounts are laid out as a row with a leading icon; the figures below are
 * aligned to the row's text column rather than to the gutter.
 */
const ACCOUNT_TEXT_INDENT = 52;

type ConnectBankNavigationProp =
  NativeStackNavigationProp<RootStackParamList, 'ConnectBank'>;

/**
 * The server's answer to whether this account may begin a connection.
 *
 * Held at module scope rather than inside the component: it needs nothing
 * from a render, and keeping it there leaves `loadConnections` free of a
 * render-scoped dependency that the mount effect would then have to track.
 *
 * It never throws. This is a statement of fact the screen renders, so failing
 * to read it must not take the links down with it — `null` means the question
 * went unanswered, which is not the same as being refused, and the screen
 * then behaves as it always did instead of announcing a limit it never
 * confirmed.
 */
async function readOpenFinanceStatus(
  accessToken: string,
): Promise<boolean | null> {
  try {
    const status = await getOpenFinanceStatus(accessToken);

    return status.available;
  } catch (error) {
    console.error('ERRO AO VERIFICAR OPEN FINANCE:', error);

    return null;
  }
}

export function ConnectBankScreen() {
  const navigation = useNavigation<ConnectBankNavigationProp>();
  const [connectToken, setConnectToken] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  /** Separate from `loading`, which the Pluggy token exchange owns. */
  const [disconnecting, setDisconnecting] = useState(false);

  /**
   * Whether the backend is letting this account begin a connection — `null`
   * while unknown. It is read with the links rather than assumed from them,
   * because it is a rule held on the server and this screen only renders it.
   */
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  async function loadConnections() {
    try {
      setInitialLoading(true);
      const accessToken = await getAccessToken();
      if (!accessToken) return;

      const [response, status] = await Promise.all([
        getConnections(accessToken),
        readOpenFinanceStatus(accessToken),
      ]);

      setAvailable(status);

      /*
       * Revoking a connection does not delete the row — the provider keeps a
       * record of what was authorised and when. Dropping those here is what
       * makes the screen read as disconnected instead of still announcing
       * "Conexão ativa" over a link that no longer exists.
       */
      const loadedConnections = (
        (response.connections ?? []) as Connection[]
      ).filter((connection) => connection.status !== 'disconnected');

      const latestConnection = loadedConnections.length > 0 ? [loadedConnections[0]] : [];
      setConnections(latestConnection);

      if (loadedConnections.length === 0) return;

      const connectionId = loadedConnections[0].id;
      const accountsResponse = await getAccounts(accessToken, connectionId);
      const loadedAccounts = accountsResponse.accounts ?? [];
      setAccounts(loadedAccounts);

      const account = loadedAccounts[0];
      if (!account) return;

      const transactionsResponse = await getTransactions(accessToken, connectionId, account.id);
      setTransactions(transactionsResponse.transactions ?? []);
    } catch (error) {
      console.error('ERRO AO CARREGAR CONEXÕES:', error);
    } finally {
      setInitialLoading(false);
    }
  }

  async function handleConnectBank() {
    try {
      setLoading(true);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        showAlert({
          title: 'Sessão expirada',
          message: 'Faça login novamente para conectar sua conta bancária.',
          tone: 'danger',
        });
        return;
      }

      const response = await createConnectToken(accessToken);
      setConnectToken(response.connect_token);
    } catch (error) {
      console.error(error);
      showAlert({
        title: 'Erro',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível iniciar a conexão bancária.',
        tone: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectionSuccess(data: { item: { id: string } }) {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('Sessão expirada');

      await connectBank(accessToken, data.item.id);
      await loadConnections();
      showAlert({
        title: 'Banco conectado',
        message: 'Sua conta foi conectada com sucesso.',
        tone: 'success',
      });
      setConnectToken(null);
    } catch (error) {
      console.error('ERRO AO SALVAR CONEXÃO:', error);
      // The Pluggy view has already handed us the item and reported success
      // on its side. If the link cannot be saved it still has to come down —
      // otherwise the user is stranded inside a completed bank flow with a
      // dialog over it and no way back to this screen.
      setConnectToken(null);
      showAlert({
        title: 'Erro',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar a conexão.',
        tone: 'danger',
      });
    }
  }

  /**
   * Destructive, so nothing happens on a single tap. The panel states what
   * stops, and that it can be undone, before anything is sent anywhere.
   */
  function confirmDisconnect() {
    const connection = connections[0];

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

      const result = await disconnectConnection(
        accessToken,
        connectionId,
      );

      /*
       * Gone either way — including when another device had already severed
       * it — so the screen settles on the disconnected state rather than
       * keeping a connection nobody can reach any more.
       */
      setConnections([]);
      setAccounts([]);
      setTransactions([]);

      /*
       * With no link left, whether a new one may be started is a fresh
       * question. Answering it here stops the screen from offering a flow the
       * backend would immediately refuse.
       */
      setAvailable(await readOpenFinanceStatus(accessToken));

      const settled =
        result.status === 'already_disconnected';

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

  function formatCurrency(value: number | null) {
    if (value === null) return 'Saldo indisponível';
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function getAccountType(account: BankAccount) {
    if (account.credit) return 'Cartão de crédito';
    if (account.subtype) return translateAccountSubtype(account.subtype);
    return account.type?.toLowerCase() === 'bank' ? 'Conta bancária' : 'Conta';
  }

  /*
   * `initialLoading` owns the screen until the connections arrive, so the
   * entrances wait for the content the same way the dashboard's do.
   */
  const contentReady = !initialLoading;

  /**
   * There is no link to show and the backend says this account may not start
   * one. Stated rather than hidden — a button that simply vanishes leaves the
   * user wondering whether they broke something.
   */
  const restricted = connections.length === 0 && available === false;

  const headerEntrance = useEntrance({ start: contentReady });
  const statusEntrance = useEntrance({
    start: contentReady,
    delay: appMotion.stagger,
  });
  const accountsEntrance = useEntrance({
    start: contentReady,
    delay: appMotion.stagger * 2,
  });
  const trustEntrance = useEntrance({
    start: contentReady,
    delay: appMotion.stagger * 3,
  });

  if (initialLoading) {
    return (
      <AppLoading
        message="Carregando sua conta"
        description="Buscando suas conexões bancárias"
      />
    );
  }

  if (connectToken) {
    return (
      <View style={styles.pluggy}>
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={true}
          language="pt"
          onSuccess={handleConnectionSuccess}
          onClose={() => setConnectToken(null)}
          onError={(error) => {
            console.error('PLUGGY ERROR:', error);
            showAlert({
              title: 'Erro',
              message: 'Não foi possível conectar o banco.',
              tone: 'danger',
            });
            setConnectToken(null);
          }}
        />
      </View>
    );
  }

  const bankName = accounts[0]?.bank?.name || 'Banco conectado';

  return (
    <ScrollScreen topInset={false}>
      <Animated.View style={headerEntrance}>
        <AppHeader
          title="Conta bancária"
          eyebrow="Open Finance"
          onBackPress={() => navigation.goBack()}
        />

        <AppText variant="screenTitle" tone="primary" style={styles.title}>
          {connections.length > 0
            ? bankName
            : restricted
              ? 'Open Finance indisponível'
              : 'Conecte sua conta'}
        </AppText>
        <AppText variant="bodySmall" tone="secondary" style={styles.subtitle}>
          {connections.length > 0
            ? 'Suas contas são sincronizadas automaticamente pelo Open Finance.'
            : restricted
              ? 'A conexão automática com bancos está temporariamente fechada para novas contas.'
              : 'Sincronize suas contas e transações automaticamente com o Econva.'}
        </AppText>
      </Animated.View>

      {connections.length > 0 ? (
        <Reanimated.View
          entering={ENTER}
          exiting={EXIT}
        >
          {/* Connection status */}
          <Animated.View style={statusEntrance}>
            <Surface variant="elevated" radius="panel" padding="lg">
              <View style={styles.statusRow}>
                <View style={styles.statusIcon}>
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={appColors.income}
                  />
                </View>

                <View style={styles.statusText}>
                  <AppText variant="micro" tone="tertiary">
                    CONEXÃO
                  </AppText>
                  <AppText variant="section" tone="positive">
                    Conexão ativa
                  </AppText>
                  <AppText variant="caption" tone="tertiary" numberOfLines={1}>
                    {accounts[0]?.marketing_name ?? 'Via Open Finance'}
                  </AppText>
                </View>
              </View>

              <View style={styles.statusAction}>
                <Button
                  title="Desconectar banco"
                  variant="danger"
                  size="md"
                  fullWidth
                  icon="unlink-outline"
                  loading={disconnecting}
                  loadingTitle="Desconectando"
                  onPress={confirmDisconnect}
                />
              </View>
            </Surface>
          </Animated.View>

          {/* Accounts */}
          {accounts.length > 0 ? (
            <Animated.View style={[accountsEntrance, styles.block]}>
              <Section
                title="Suas contas"
                eyebrow="Visão geral"
                description={`${accounts.length} ${accounts.length === 1 ? 'conta conectada' : 'contas conectadas'}`}
              >
                {accounts.map((account, index) => {
                  const isCreditCard = !!account.credit;

                  return (
                    <Reanimated.View
                      key={account.id}
                      entering={ROW_ENTER[Math.min(index, 8)]}
                      layout={ROW_LAYOUT}
                      style={[styles.account, index > 0 && styles.accountDivided]}
                    >
                      <ListRow
                        title={account.name || 'Conta bancária'}
                        meta={getAccountType(account)}
                        icon={isCreditCard ? 'card-outline' : 'wallet-outline'}
                        iconTone="accent"
                        emphasis
                      />

                      <View style={styles.accountBalance}>
                        <AppText variant="micro" tone="tertiary">
                          {(isCreditCard ? 'FATURA ATUAL' : 'SALDO DISPONÍVEL').toUpperCase()}
                        </AppText>
                        <AppText
                          variant="valueLarge"
                          tone="primary"
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {formatCurrency(account.balance)}
                        </AppText>
                      </View>

                      {isCreditCard && account.credit ? (
                        <View style={styles.creditDetails}>
                          {account.credit.credit_limit !== null ? (
                            <View style={styles.creditRow}>
                              <AppText variant="caption" tone="tertiary">
                                Limite
                              </AppText>
                              <AppText variant="captionStrong" tone="secondary">
                                {formatCurrency(account.credit.credit_limit)}
                              </AppText>
                            </View>
                          ) : null}
                          {account.credit.available_credit_limit !== null ? (
                            <View style={styles.creditRow}>
                              <AppText variant="caption" tone="tertiary">
                                Disponível
                              </AppText>
                              <AppText variant="captionStrong" tone="secondary">
                                {formatCurrency(account.credit.available_credit_limit)}
                              </AppText>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </Reanimated.View>
                  );
                })}
              </Section>
            </Animated.View>
          ) : null}

          {/* Trust */}
          <Animated.View style={trustEntrance}>
            <TrustNote
              title="Seus dados estão protegidos"
              description="Sua conexão é realizada de forma segura através do Open Finance."
            />
          </Animated.View>
        </Reanimated.View>
      ) : restricted ? (
        <Reanimated.View
          entering={ENTER}
          exiting={EXIT}
        >
          {/* Closed to new connections — explained, not silently removed */}
          <Animated.View style={statusEntrance}>
            <Surface variant="subtle" radius="panel" padding="xl">
              <View style={[styles.emptyIcon, styles.emptyIconLocked]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={24}
                  color={appColors.warning}
                />
              </View>

              <AppText variant="section" tone="primary" style={styles.emptyTitle}>
                O app segue completo
              </AppText>
              <AppText variant="bodySmall" tone="secondary" style={styles.emptyText}>
                Registre transações, organize gastos recorrentes e crie metas
                direto pelo Econva. Tudo funciona sem um banco conectado.
              </AppText>

              <Button
                title="Voltar"
                variant="secondary"
                size="lg"
                fullWidth
                onPress={() => navigation.goBack()}
                style={styles.emptyAction}
              />
            </Surface>
          </Animated.View>
        </Reanimated.View>
      ) : (
        <Reanimated.View
          entering={ENTER}
          exiting={EXIT}
        >
          {/* No connection yet */}
          <Animated.View style={statusEntrance}>
            <Surface variant="subtle" radius="panel" padding="xl">
              <View style={styles.emptyIcon}>
                <Ionicons name="link" size={24} color={appColors.accentBright} />
              </View>

              <AppText variant="section" tone="primary" style={styles.emptyTitle}>
                Como funciona
              </AppText>
              <AppText variant="bodySmall" tone="secondary" style={styles.emptyText}>
                A conexão é feita direto com o seu banco, pelo Open Finance. O
                Econva recebe apenas os dados que você autorizar — nunca sua
                senha.
              </AppText>

              <Button
                title="Conectar minha conta"
                onPress={handleConnectBank}
                size="lg"
                fullWidth
                trailingIcon="arrow-forward"
                style={styles.emptyAction}
              />
            </Surface>
          </Animated.View>

          <Animated.View style={trustEntrance}>
            <TrustNote
              title="Conexão segura"
              description="O acesso é realizado através do Open Finance. Você não precisa compartilhar sua senha bancária com o Econva."
            />
          </Animated.View>
        </Reanimated.View>
      )}
    </ScrollScreen>
  );
}

function TrustNote({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.trust}>
      <View style={styles.trustRow}>
        <View style={styles.trustIcon}>
          <Ionicons name="shield-checkmark" size={16} color={appColors.accentBright} />
        </View>
        <View style={styles.trustText}>
          <AppText variant="captionStrong" tone="primary">
            {title}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {description}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pluggy: {
    flex: 1,
    backgroundColor: appColors.canvas,
  },

  title: {
    marginTop: appSpace.xs,
    marginBottom: appSpace.xs,
  },

  subtitle: {
    marginBottom: appSpace.xxl,
  },

  /* Status */
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.lg,
  },

  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: appRadius.control,
    backgroundColor: appColors.incomeSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },

  /** Hairline, matching the divider language used between account rows. */
  statusAction: {
    marginTop: appSpace.lg,
    paddingTop: appSpace.lg,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },

  /* Blocks */
  block: {
    marginTop: appSpace.xxl,
  },

  /* Accounts */
  account: {
    paddingBottom: appSpace.lg,
  },

  accountDivided: {
    paddingTop: appSpace.sm,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },

  accountBalance: {
    paddingLeft: ACCOUNT_TEXT_INDENT,
    marginTop: appSpace.xs,
    gap: appSpace.xs,
  },

  creditDetails: {
    paddingLeft: ACCOUNT_TEXT_INDENT,
    marginTop: appSpace.lg,
    paddingTop: appSpace.md,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
    gap: appSpace.sm,
  },

  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  /* Empty */
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: appRadius.control,
    backgroundColor: appColors.accentWash,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: appSpace.lg,
  },

  /** The same shape, told in the caution tone rather than the accent one. */
  emptyIconLocked: {
    backgroundColor: appColors.warningSubtle,
  },

  emptyTitle: {
    marginBottom: appSpace.xs,
  },

  emptyText: {
    marginBottom: appSpace.xl,
  },

  emptyAction: {
    marginTop: appSpace.sm,
  },

  /* Trust */
  trust: {
    marginTop: appSpace.xxl,
    paddingTop: appSpace.lg,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },

  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appSpace.md,
  },

  trustIcon: {
    width: 34,
    height: 34,
    borderRadius: appRadius.md,
    backgroundColor: appColors.accentWash,
    alignItems: 'center',
    justifyContent: 'center',
  },

  trustText: {
    flex: 1,
    gap: 2,
  },
});
