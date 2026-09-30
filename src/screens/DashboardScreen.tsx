/**
 * Econva — Dashboard
 *
 * The central expression of the brand: one dominant number, then a calm
 * hierarchy of context, movement and intent. The balance owns the top of the
 * screen at display scale; everything after it is deliberately quieter.
 *
 * Layout intent:
 *   1  greeting + brand      context
 *   2  balance                the single most important figure
 *   3  income / expenses      direction, side by side
 *   4  income analysis        how much of the month is committed
 *   5  insight                one sentence, no chart theatre
 *   6  recent transactions    a list, not a grid of cards
 *   7  primary action         only when the user has no bank connected
 *
 * Data, calculations and navigation are unchanged from the previous version.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { AppLoading } from '../components/AppLoading';
import { formatCurrency } from '../utils/formatCurrency';
import { getTransactions } from '../api/transactionApi';
import { getFinance } from '../api/financeApi';
import { getCategories } from '../api/categoryApi';
import { calculateTotals } from '../utils/finance';
import { Finance } from '../types/finance';
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
import { appColors, appSpace, appMotion } from '../theme/app';
import { Button, Logo, useEntrance } from '../components/ui';
import {
  AppText,
  CategoryShare,
  EmptyState,
  ListRow,
  ScrollScreen,
  Section,
  Stat,
  StatGrid,
  Surface,
  showAlert,
  type CategoryShareRow,
} from '../components/app';

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
};

export function DashboardScreen() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [finance, setFinance] = useState<Finance | null>(null);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ expenses: 0, income: 0 });
  const [openFinanceBalance, setOpenFinanceBalance] = useState<number | null>(null);
  const [financialAnalysis, setFinancialAnalysis] = useState({
    expensePercentage: 0,
    savingsPercentage: 0,
    savings: 0,
    mainCategory: null as string | null,
    mainCategoryAmount: 0,
    /**
     * Everything the category ranking counted, which is not the same as
     * `totals.expenses`: totals drop anything not yet settled, the ranking
     * counts it. Each category's share divides by this so numerator and
     * denominator cover the same money.
     */
    categoryTotal: 0,
    /**
     * The categories themselves, largest first — the same sort that picks
     * `mainCategory`, kept whole so the dashboard can show what sits behind
     * the top figure and not only the top figure.
     */
    categoryRanking: [] as { name: string; amount: number }[],
  });
  const [openFinanceTransactions, setOpenFinanceTransactions] = useState<DashboardTransaction[]>([]);

  /**
   * Whether a bank is connected — deliberately not derived from
   * `openFinanceBalance`. A link made moments ago reports no account yet, and
   * the screen still has to present it as connected instead of asking the
   * user to connect the account they just connected.
   */
  const [bankConnected, setBankConnected] = useState(false);

  /**
   * The alert's "Tentar novamente" is built inside `loadFinance`, which
   * cannot reference itself — so the current load is kept here for that button
   * to call. Kept in sync by an effect, where the latest version of a
   * callback belongs, well before any alert can be on screen.
   */
  const reloadRef = useRef<() => void>(() => {});

  /**
   * Local (manually entered) transactions: the list, the totals and the
   * category ranking behind them.
   *
   * Its own stage because the dashboard reads it twice over — as the whole
   * story when nothing is connected, and as the fallback when the bank side
   * cannot be read. Collapsing the two into one chain is what used to blank
   * the screen the moment a single request failed.
   */
  const loadLocalData = useCallback(async () => {
    const transactionsData = await getTransactions();
    setOpenFinanceTransactions(
      transactionsData.map((t) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        date: t.createdAt,
        category: null,
        type: t.type === 'EXPENSE' ? 'EXPENSE' : 'INCOME',
        status: t.status,
      })),
    );
    const calculatedTotals = calculateTotals(transactionsData);
    setTotals(calculatedTotals);

    // Category names live behind an id, so the ranking has to be keyed
    // on the name the reader actually sees. Rolling up on the raw id
    // would report every category as its own uuid.
    let categoryNames: Record<string, string> = {};
    try {
      const categories = await getCategories();
      categoryNames = Object.fromEntries(
        categories.map((c) => [c.id, c.name]),
      );
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }

    const categoryTotals: Record<string, number> = {};
    let categoryTotal = 0;
    transactionsData.forEach((t) => {
      if (t.type !== 'EXPENSE') return;
      const name = t.categoryId ? categoryNames[t.categoryId] : undefined;
      const cat = name ?? 'Sem categoria';
      const amount = Number(t.amount);
      categoryTotals[cat] = (categoryTotals[cat] ?? 0) + amount;
      categoryTotal += amount;
    });
    const ranking = Object.entries(categoryTotals).sort(
      ([, a], [, b]) => b - a,
    );
    const mainCategory = ranking[0];
    setFinancialAnalysis({
      expensePercentage: calculatedTotals.income > 0 ? (calculatedTotals.expenses / calculatedTotals.income) * 100 : 0,
      savingsPercentage: calculatedTotals.income > 0 ? ((calculatedTotals.income - calculatedTotals.expenses) / calculatedTotals.income) * 100 : 0,
      savings: calculatedTotals.income - calculatedTotals.expenses,
      mainCategory: mainCategory?.[0] ?? null,
      mainCategoryAmount: mainCategory?.[1] ?? 0,
      categoryTotal,
      categoryRanking: ranking.map(([name, amount]) => ({
        name,
        amount,
      })),
    });
  }, []);

  /**
   * The bank's balance, totals, ranking and list.
   *
   * Returns `false` — deliberately distinct from throwing — when the
   * connection exists but the provider has no account for it yet. A link made
   * seconds ago simply has nothing to report; that is a state to render, not
   * a failure to surface, so the caller falls back to local data instead of
   * leaving an empty dashboard behind.
   */
  const loadBankData = useCallback(
    async (connectionId: string, token: string) => {
      const accountsResponse = await getAccounts(token, connectionId);
      const account = accountsResponse.accounts?.[0];

      if (!account) return false;

      const bankBalance = account.balance ?? null;
      const transactionsResponse = await getOpenFinanceTransactions(
        token,
        connectionId,
        account.id,
      );
      const bankTransactions: OpenFinanceTransaction[] =
        transactionsResponse.transactions ?? [];
      const income = bankTransactions
        .filter((t) => t.type === 'CREDIT')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = bankTransactions
        .filter((t) => t.type === 'DEBIT')
        .reduce((sum, t) => sum + t.amount, 0);

      setTotals({ income, expenses });

      // Spending without a category still has to be counted, otherwise
      // the ranking silently drops part of what was spent.
      const categoryTotals: Record<string, number> = {};
      let categoryTotal = 0;
      bankTransactions.forEach((t) => {
        if (t.type === 'DEBIT') {
          const cat = translateCategory(t.category);
          categoryTotals[cat] = (categoryTotals[cat] ?? 0) + t.amount;
          categoryTotal += t.amount;
        }
      });
      const ranking = Object.entries(categoryTotals).sort(
        ([, a], [, b]) => b - a,
      );
      const mainCategory = ranking[0];

      // Available money is what the bank actually reports. Deriving it
      // from income minus expenses ignores transfers, pending items and
      // anything else between the two figures.
      const available = bankBalance ?? (income - expenses);

      setFinancialAnalysis({
        expensePercentage: income > 0 ? (expenses / income) * 100 : 0,
        savingsPercentage: income > 0 ? (available / income) * 100 : 0,
        savings: available,
        mainCategory: mainCategory?.[0] ?? null,
        mainCategoryAmount: mainCategory?.[1] ?? 0,
        categoryTotal,
        categoryRanking: ranking.map(([name, amount]) => ({
          name,
          amount,
        })),
      });

      setOpenFinanceTransactions(
        bankTransactions.map((t) => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          date: t.date,
          category: translateCategory(t.category),
          type: t.type === 'DEBIT' ? 'EXPENSE' : 'INCOME',
          status: t.status,
        })),
      );

      // Published only now that the whole read completed: a balance sitting
      // above totals that never arrived would put two sources of money on
      // the same screen.
      setOpenFinanceBalance(bankBalance);

      return true;
    },
    [],
  );

  const loadFinance = useCallback(async () => {
    setLoading(true);

    // Cleared for every load so a failed or still-synchronising read cannot
    // leave last time's bank balance sitting above this time's local figures.
    // The loader covers the screen while it is null, so nothing flickers.
    setOpenFinanceBalance(null);

    /**
     * One dialog for the whole load. Each stage records why it could not
     * contribute and the screen reports the first of those once at the end:
     * several failing requests must not stack several alerts, and a stage
     * that quietly fell back to other data must not speak for one that did not.
     */
    const problems: { title: string; message: string }[] = [];

    /** The local read, wherever it is reached from — one failure, one entry. */
    const readLocal = async () => {
      try {
        await loadLocalData();
      } catch (error) {
        console.error('Erro ao buscar transações:', error);
        problems.push({
          title: 'Não foi possível carregar suas transações',
          message:
            'Suas movimentações não responderam. Verifique sua conexão e tente novamente.',
        });
      }
    };

    // 1 — the account every other query is scoped by. Categories, goals and
    // transaction writes all resolve it first and answer 404 without it, so
    // nothing below is worth attempting until this has landed.
    let ready = false;
    try {
      const data = await getFinance();
      setFinance(data);
      ready = true;
    } catch (error) {
      console.error('Erro ao buscar finanças:', error);
      problems.push({
        title: 'Sua conta ainda não está pronta',
        message:
          'Não foi possível preparar seus dados financeiros. Verifique sua conexão e tente novamente.',
      });
    }

    if (ready) {
      // 2 — is a bank connected? Reported rather than swallowed: without it
      // the screen would confidently present a disconnected account to
      // somebody who has just connected one.
      let connection: { id: string } | null = null;
      const token = await getAccessToken().catch(() => null);

      if (token) {
        try {
          const connectionsResponse = await getConnections(token);
          connection = connectionsResponse?.connections?.[0] ?? null;
        } catch (error) {
          console.error('Erro ao buscar conexões:', error);
          problems.push({
            title: 'Não foi possível verificar suas contas',
            message:
              'Suas conexões bancárias não responderam. Tente novamente em instantes.',
          });
        }
      }

      // Being connected and holding a balance are different facts. A link
      // with no account yet is still a link, so the screen has to say
      // "connected" while showing nothing from the bank.
      setBankConnected(Boolean(connection));

      // 3 — the bank's data. A failure here falls through to stage 4 instead
      // of aborting the load, which is what used to blank the dashboard.
      if (connection && token) {
        try {
          const loaded = await loadBankData(connection.id, token);
          if (!loaded) {
            // Connected, synchronising. Local data is the honest answer
            // until the provider returns an account.
            await readLocal();
          }
        } catch (error) {
          console.error('Erro ao buscar dados do banco:', error);
          problems.push({
            title: 'Não foi possível carregar seu banco',
            message:
              'As movimentações da sua conta conectada não chegaram. Tente novamente em instantes.',
          });
          await readLocal();
        }
      } else if (!connection) {
        // 4 — local data is the whole story when nothing is connected.
        await readLocal();
      }
    }

    setLoading(false);

    if (problems.length > 0) {
      const [first] = problems;
      showAlert({
        title: first.title,
        message: first.message,
        tone: 'danger',
        actions: [
          {
            label: 'Tentar novamente',
            style: 'primary',
            onPress: () => reloadRef.current(),
          },
          { label: 'Fechar', style: 'secondary' },
        ],
      });
    }
  }, [loadLocalData, loadBankData]);

  useEffect(() => {
    reloadRef.current = loadFinance;
  }, [loadFinance]);

  useFocusEffect(
    useCallback(() => {
      loadFinance();
    }, [loadFinance]),
  );

  const balance = openFinanceBalance ?? totals.income - totals.expenses;
  const navigation = useNavigation<any>();
  const isPositive = balance >= 0;

  const hasCategoryAnalysis =
    Boolean(financialAnalysis.mainCategory) && financialAnalysis.categoryTotal > 0;

  /**
   * What each category cost, as a share of all spending.
   *
   * Divided by the same total the ranking accumulated, not by `totals.expenses`:
   * totals exclude anything still pending while the ranking includes it, so
   * mixing the two could report a category as more than 100% of spending.
   */
  const categoryShares: CategoryShareRow[] = hasCategoryAnalysis
    ? financialAnalysis.categoryRanking.map((row) => ({
        ...row,
        share: (row.amount / financialAnalysis.categoryTotal) * 100,
      }))
    : [];

  const insightText = financialAnalysis.mainCategory
    ? `Seus maiores gastos estão em ${financialAnalysis.mainCategory}.`
    : 'Adicione transações para receber uma análise financeira.';

  /*
   * The loader owns the screen until the data lands, so every entrance is held
   * back until then. Ungated, these run the moment the screen mounts — against
   * `AppLoading` — and are long finished by the time this content appears,
   * which is why the dashboard used to arrive with a hard cut instead of a
   * stagger.
   */
  const contentReady = !loading;

  const headerEntrance = useEntrance({ start: contentReady });
  const balanceEntrance = useEntrance({
    start: contentReady,
    delay: appMotion.stagger,
  });
  const statsEntrance = useEntrance({
    start: contentReady,
    delay: appMotion.stagger * 2,
  });
  const analysisEntrance = useEntrance({
    start: contentReady,
    delay: appMotion.stagger * 3,
  });
  const listEntrance = useEntrance({
    start: contentReady,
    delay: appMotion.stagger * 5,
  });

  if (loading) {
    return <AppLoading message="Preparando seu resumo" description="Buscando seus dados financeiros" />;
  }

  return (
    <ScrollScreen tabBar>
      {/* 1 — Context */}
      <Animated.View style={[styles.header, headerEntrance]}>
        <Logo variant="mark" size={34} />
        <View style={styles.headerText}>
          <AppText variant="micro" tone="tertiary">
            Econva
          </AppText>
          <AppText variant="bodySemibold" tone="primary">
            Olá
          </AppText>
        </View>
      </Animated.View>

      {/* 2 — Balance */}
      <Animated.View style={balanceEntrance}>
        <Surface variant="elevated" radius="panel" padding="xl" style={styles.balance}>
          <View style={styles.balanceTop}>
            <AppText variant="micro" tone="tertiary">
              SALDO TOTAL
            </AppText>

            {bankConnected ? (
              <View style={styles.connectedBadge}>
                <View style={styles.connectedDot} />
                <AppText variant="meta" tone="secondary">
                  Conta conectada
                </AppText>
              </View>
            ) : null}
          </View>

          <AppText
            variant="value"
            color={isPositive ? appColors.textPrimary : appColors.expense}
            style={styles.balanceValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {formatCurrency(balance)}
          </AppText>

          <View style={styles.balanceFooter}>
            <Ionicons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={15}
              color={isPositive ? appColors.income : appColors.expense}
            />
            <AppText
              variant="captionStrong"
              color={isPositive ? appColors.income : appColors.expense}
            >
              {isPositive ? 'Saldo positivo' : 'Saldo negativo'}
            </AppText>
          </View>
        </Surface>
      </Animated.View>

      {/* 3 — Income and expenses */}
      <Animated.View style={statsEntrance}>
        <StatGrid style={styles.stats}>
          <Stat
            label="Receitas"
            value={formatCurrency(totals.income)}
            direction="positive"
            icon="arrow-down"
          />
          <Stat
            label="Despesas"
            value={formatCurrency(totals.expenses)}
            direction="negative"
            icon="arrow-up"
          />
        </StatGrid>
      </Animated.View>

      {/*
        4 — Spending concentration.

        The income-commitment ring was dropped: it restated the expenses tile
        directly beside it. This reads the same money from a different angle —
        how concentrated the spending is, which is what actually tells you where
        to cut — and it absorbs the separate insight line, whose only content was
        naming the top category.

        The ring that answered it was then dropped too. It carried a single
        percentage through a chart library that would not draw it on device,
        and a ranked list says strictly more: the runner-up, the gap between
        them, and how much of the total the leader actually holds.
      */}
      <Animated.View style={[analysisEntrance, styles.block]}>
        <Section
          title="Concentração de gastos"
          eyebrow="Análise"
          description="Em qual categoria seus gastos estão concentrados"
        >
          {hasCategoryAnalysis ? (
            <>
              <AppText variant="caption" tone="tertiary" style={styles.shareHint}>
                {formatCurrency(financialAnalysis.mainCategoryAmount)} de{' '}
                {formatCurrency(financialAnalysis.categoryTotal)} em despesas
              </AppText>

              <CategoryShare rows={categoryShares} formatAmount={formatCurrency} />
            </>
          ) : (
            <AppText variant="bodySmall" tone="tertiary">
              {insightText}
            </AppText>
          )}
        </Section>
      </Animated.View>

      {/* 5 — Recent transactions */}
      <Animated.View style={[listEntrance, styles.block]}>
        <Section
          title="Transações recentes"
          eyebrow="Movimentações"
          actionLabel={
            openFinanceTransactions.length > 0 ? 'Ver todas' : undefined
          }
          onActionPress={
            openFinanceTransactions.length > 0
              ? () => navigation.navigate('Transactions')
              : undefined
          }
        >
          {openFinanceTransactions.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="Nenhuma transação"
              description="Suas movimentações aparecerão aqui."
            />
          ) : (
            <View>
              {openFinanceTransactions.slice(0, 5).map((transaction, index) => {
                const isExpense = transaction.type === 'EXPENSE';

                return (
                  <ListRow
                    key={transaction.id}
                    divider={index > 0}
                    title={transaction.description}
                    meta={formatTransactionStatus(transaction.status)}
                    amount={`${isExpense ? '-' : '+'}${formatCurrency(transaction.amount)}`}
                    amountTone={isExpense ? 'negative' : 'positive'}
                    icon={isExpense ? 'arrow-up' : 'arrow-down'}
                    iconTone={isExpense ? 'negative' : 'positive'}
                  />
                );
              })}
            </View>
          )}
        </Section>
      </Animated.View>

      {/* 6 — Primary action */}
      {openFinanceBalance === null ? (
        <Button
          title="Nova transação"
          onPress={() => navigation.navigate('CreateTransaction')}
          size="lg"
          fullWidth
          icon="add"
          style={styles.addButton}
        />
      ) : null}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  /* Context */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.md,
    marginBottom: appSpace.xl,
  },

  headerText: {
    flex: 1,
  },

  /* Balance */
  balance: {
    marginBottom: appSpace.lg,
  },

  balanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: appSpace.md,
    marginBottom: appSpace.md,
  },

  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.xs,
  },

  connectedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: appColors.income,
  },

  balanceValue: {
    marginBottom: appSpace.lg,
  },

  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.xs,
    paddingTop: appSpace.md,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },

  /* Stats */
  stats: {
    marginBottom: appSpace.xxl,
  },

  /* Blocks */
  block: {
    marginBottom: appSpace.xxl,
  },

  /* Analysis */
  shareHint: {
    marginBottom: appSpace.md,
  },

  /* Action */
  addButton: {
    marginTop: appSpace.xs,
  },
});
