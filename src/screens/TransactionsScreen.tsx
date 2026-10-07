/**
 * Econva — Transactions
 *
 * A data-heavy screen translated into the product's language: one list, hairline
 * separated, with the amount carrying the eye and semantic colour used only for
 * direction. Nothing floats — the list is a single surface on the canvas.
 *
 * Data, source resolution and navigation are unchanged.
 */

import { useCallback, useState } from 'react';
import { Animated, FlatList, StyleSheet, View } from 'react-native';
import Reanimated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppLoading } from '../components/AppLoading';
import { getTransactions as getLocalTransactions } from '../api/transactionApi';
import type { Transaction } from '../types/transaction';
import { formatCurrency } from '../utils/formatCurrency';
import {
  formatTransactionStatus,
  translateCategory,
} from '../utils/transaction';
import {
  getConnections,
  getAccounts,
  getTransactions as getOpenFinanceTransactions,
} from '../services/openFinanceService';
import { getAccessToken } from '../api/authApi';
import { navigationRef } from '../navigation/navigationRef';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { appColors, appLayout, appMotion, appSpace } from '../theme/app';
import { Button, useEntrance } from '../components/ui';
import {
  AppRefreshControl,
  AppText,
  EmptyState,
  ListRow,
  Screen,
  Section,
  Surface,
} from '../components/app';

/*
 * Layout animation definitions live at module scope, not inline in JSX.
 * `FadeIn.duration(...)` builds a new object every time it is called, and an
 * `entering` prop that changes identity re-triggers the entrance — so a screen
 * that merely re-renders would replay its fade from zero opacity and look like
 * it had blanked. Stable references, stable behaviour.
 */
const ROW_LAYOUT = LinearTransition.duration(appMotion.layout);

/** Pre-built staggered entrances, so a row's animation never changes identity. */
const ROW_ENTER = Array.from({ length: 9 }, (_, i) =>
  FadeIn.duration(appMotion.layout).delay(i * appMotion.stagger),
);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type OpenFinanceTransaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string | null;
  type: 'DEBIT' | 'CREDIT';
  status: string;
};

type DashboardTransaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string | null;
  type: 'EXPENSE' | 'INCOME';
  status: string;
  source: 'OPEN_FINANCE' | 'LOCAL';
  localTransaction?: Transaction;
};

export function TransactionsScreen() {
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFinanceConnected, setOpenFinanceConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const accessToken = await getAccessToken();

      if (!accessToken) {
        const localTransactions = await getLocalTransactions();
        setOpenFinanceConnected(false);
        setTransactions(
          localTransactions.map((t) => ({
            id: t.id,
            description: t.description,
            amount: Number(t.amount),
            date: t.createdAt,
            category: null,
            type: t.type === 'EXPENSE' ? 'EXPENSE' : 'INCOME',
            status: t.status,
            source: 'LOCAL' as const,
            localTransaction: t,
          })),
        );
        return;
      }

      const connectionsResponse = await getConnections(accessToken);
      const connection = (connectionsResponse.connections ?? []).find(
        (item: { status: string }) => item.status === 'connected',
      );

      if (!connection) {
        const localTransactions = await getLocalTransactions();
        setOpenFinanceConnected(false);
        setTransactions(
          localTransactions.map((t) => ({
            id: t.id,
            description: t.description,
            amount: Number(t.amount),
            date: t.createdAt,
            category: null,
            type: t.type === 'EXPENSE' ? 'EXPENSE' : 'INCOME',
            status: t.status,
            source: 'LOCAL' as const,
            localTransaction: t,
          })),
        );
        return;
      }

      setOpenFinanceConnected(true);
      const accountsResponse = await getAccounts(accessToken, connection.id);
      const account = accountsResponse.accounts?.[0];

      if (!account) {
        setTransactions([]);
        return;
      }

      const bankTransactions = await getOpenFinanceTransactions(
        accessToken,
        connection.id,
        account.id,
      );

      const formattedTransactions: DashboardTransaction[] = (
        bankTransactions.transactions ?? bankTransactions ?? []
      ).map((t: OpenFinanceTransaction) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        date: t.date,
        category: translateCategory(t.category),
        type: t.type === 'DEBIT' ? 'EXPENSE' : 'INCOME',
        status: t.status,
        source: 'OPEN_FINANCE' as const,
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions]),
  );

  /** Pull to refresh re-reads the same source, without unmounting the list. */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, [loadTransactions]);

  const headerEntrance = useEntrance({ start: !loading });

  if (loading) {
    return <AppLoading message="Carregando transações" description="Sincronizando suas movimentações" />;
  }

  return (
    <Screen tabBar>
      <FlatList
        data={transactions}
        keyExtractor={(item) => `${item.source}-${item.id}`}
        style={styles.flex}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        windowSize={11}
        removeClippedSubviews
        refreshControl={
          onRefresh ? (
            <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        ListHeaderComponent={
          <Animated.View style={headerEntrance}>
            <AppText variant="micro" tone="tertiary">
              CONTROLE FINANCEIRO
            </AppText>
            <AppText variant="screenTitle" tone="primary" style={styles.title}>
              Transações
            </AppText>
            <AppText variant="bodySmall" tone="secondary" style={styles.subtitle}>
              {openFinanceConnected
                ? 'Movimentações sincronizadas automaticamente'
                : 'Acompanhe suas movimentações financeiras'}
            </AppText>

            {openFinanceConnected ? (
              <Surface variant="plain" radius="group" padding="md" style={styles.connection}>
                <View style={styles.connectionRow}>
                  <Ionicons
                    name="shield-checkmark"
                    size={16}
                    color={appColors.income}
                  />
                  <View style={styles.connectionText}>
                    <AppText variant="captionStrong" tone="primary">
                      Banco conectado
                    </AppText>
                    <AppText variant="meta" tone="tertiary">
                      Dados sincronizados via Open Finance
                    </AppText>
                  </View>
                  <View style={styles.connectionDot} />
                </View>
              </Surface>
            ) : (
              <Button
                title="Nova transação"
                onPress={() => navigation.navigate('CreateTransaction')}
                size="md"
                icon="add"
                fullWidth
                style={styles.addButton}
              />
            )}

            {/*
             * Manual finance, stated where the user already works with
             * movement: fixed monthly costs are a transaction that has not
             * happened yet, so they live beside the transactions rather than
             * behind a bank connection.
             */}
            <Section
              title="Gastos recorrentes"
              eyebrow="Automação"
              style={styles.recurring}
            >
              <ListRow
                title="Ver e gerenciar"
                meta="Aluguel, assinaturas e contas fixas"
                icon="repeat"
                iconTone="accent"
                showChevron
                onPress={() => navigation.navigate('RecurringExpenses')}
              />
            </Section>

            <Section
              title="Escanear recibo"
              eyebrow="Recibo"
              description="Fotografe o recibo para registrar a leitura"
              style={styles.recurring}
            >
              <ListRow
                title="Digitalizar recibo"
                meta="Câmera ou galeria • JPG, PNG ou WEBP"
                icon="scan-outline"
                iconTone="accent"
                showChevron
                onPress={() => navigation.navigate('ScanReceipt')}
              />
            </Section>

            <Section
              title="Movimentações"
              /*
               * Counted only when there is something to count. Leaving the
               * "nenhuma movimentação" line here as well restated the empty
               * state directly beneath it.
               */
              description={
                transactions.length === 0
                  ? undefined
                  : `${transactions.length} ${
                      transactions.length === 1
                        ? 'movimentação'
                        : 'movimentações'
                    }`
              }
              style={styles.section}
            />
          </Animated.View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={openFinanceConnected ? 'card-outline' : 'receipt-outline'}
            title={
              openFinanceConnected ? 'Nenhuma movimentação' : 'Nenhuma transação'
            }
            description={
              openFinanceConnected
                ? 'Não encontramos transações na conta conectada.'
                : 'Suas transações aparecerão aqui assim que forem registradas.'
            }
          />
        }
        renderItem={({ item, index }) => {
          const isExpense = item.type === 'EXPENSE';

          return (
            <Reanimated.View
              entering={ROW_ENTER[Math.min(index, 8)]}
              layout={ROW_LAYOUT}
            >
              <ListRow
                divider={index > 0}
                title={item.description}
                meta={formatTransactionStatus(item.status)}
                amount={`${isExpense ? '-' : '+'}${formatCurrency(item.amount)}`}
                amountTone={isExpense ? 'negative' : 'positive'}
                icon={isExpense ? 'arrow-up' : 'arrow-down'}
                iconTone={isExpense ? 'negative' : 'positive'}
                showChevron
                onPress={() => {
                  if (item.source === 'LOCAL') {
                    navigationRef.navigate('TransactionDetails', {
                      transactionId: item.id,
                      source: 'LOCAL',
                    });
                  }
                  if (item.source === 'OPEN_FINANCE') {
                    navigationRef.navigate('TransactionDetails', {
                      transactionId: item.id,
                      source: 'OPEN_FINANCE',
                    });
                  }
                }}
              />
            </Reanimated.View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  list: {
    flexGrow: 1,
    paddingTop: appLayout.screenTop,
    paddingHorizontal: appLayout.gutter,
  },

  title: {
    marginTop: appSpace.xs,
    marginBottom: appSpace.xs,
  },

  subtitle: {
    marginBottom: appSpace.xl,
  },

  connection: {
    borderBottomWidth: 1,
    borderBottomColor: appColors.border,
    borderRadius: 0,
    paddingHorizontal: 0,
    marginBottom: appSpace.xl,
  },

  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.md,
  },

  connectionText: {
    flex: 1,
  },

  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: appColors.income,
  },

  addButton: {
    marginBottom: appSpace.xl,
  },

  recurring: {
    marginBottom: appSpace.xxl,
  },

  section: {
    marginBottom: appSpace.sm,
  },
});
