/**
 * Econva — Transaction Details
 *
 * A focused financial-detail experience. The amount is the subject; the type,
 * the merchant and the metadata support it. Spacing and type do the work, so
 * there is one container on the screen rather than a stack of cards.
 *
 * Data, source resolution and error handling are unchanged.
 */

import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getTransactionById } from '../api/transactionApi';
import type { Transaction } from '../types/transaction';
import {
  getConnections,
  getAccounts,
  getTransactions as getOpenFinanceTransactions,
} from '../services/openFinanceService';
import { getAccessToken } from '../api/authApi';
import { formatCurrency } from '../utils/formatCurrency';
import {
  formatCurrencyName,
  formatTransactionDate,
  translateCategory,
  translateTransactionStatus,
} from '../utils/transaction';
import { getCategories } from '../api/categoryApi';
import { AppLoading } from '../components/AppLoading';
import { appColors, appSpace, appMotion } from '../theme/app';
import { useEntrance } from '../components/ui';
import {
  AppHeader,
  AppText,
  ErrorState,
  ScrollScreen,
  Section,
} from '../components/app';

type TransactionDetailsRouteProp = RouteProp<
  RootStackParamList,
  'TransactionDetails'
>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type OpenFinanceTransaction = {
  id: string;
  description: string;
  descriptionRaw: string | null;
  currencyCode: string;
  amount: number;
  amountInAccountCurrency: number | null;
  date: string;
  category: string | null;
  categoryId: string | null;
  balance: number | null;
  accountId: string;
  providerCode: string | null;
  status: string;
  paymentData: unknown;
  type: 'DEBIT' | 'CREDIT';
  operationType: string | null;
  operationTypeAdditionalInfo: string | null;
  creditCardMetadata: unknown;
  merchant: {
    cnae: string | null;
    cnpj: string | null;
    category: string | null;
    businessName: string | null;
  } | null;
  providerId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export function TransactionDetailsScreen() {
  const route = useRoute<TransactionDetailsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { transactionId, source } = route.params;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [openFinanceTransaction, setOpenFinanceTransaction] =
    useState<OpenFinanceTransaction | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransaction() {
      try {
        setLoading(true);

        if (source === 'LOCAL') {
          const data = await getTransactionById(transactionId);
          setTransaction(data);

          if (data.categoryId) {
            const categories = await getCategories();
            const category = categories.find((item) => item.id === data.categoryId);
            setCategoryName(category?.name ?? 'Categoria não encontrada');
          }
          return;
        }

        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error('Token de acesso não encontrado');

        const connectionsResponse = await getConnections(accessToken);
        const connection = (connectionsResponse.connections ?? []).find(
          (item: { status: string }) => item.status === 'connected',
        );
        if (!connection) throw new Error('Nenhuma conexão Open Finance encontrada');

        const accountsResponse = await getAccounts(accessToken, connection.id);
        const account = accountsResponse.accounts?.[0];
        if (!account) throw new Error('Nenhuma conta encontrada');

        const response = await getOpenFinanceTransactions(
          accessToken,
          connection.id,
          account.id,
        );
        const bankTransactions: OpenFinanceTransaction[] =
          response.transactions ?? response ?? [];
        const foundTransaction = bankTransactions.find(
          (item) => item.id === transactionId,
        );

        if (!foundTransaction) throw new Error('Transação não encontrada');
        setOpenFinanceTransaction(foundTransaction);
      } catch (error) {
        console.error('Erro ao buscar detalhes da transação:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTransaction();
  }, [transactionId, source]);

  const heroEntrance = useEntrance({ start: !loading });
  const metaEntrance = useEntrance({
    start: !loading,
    delay: appMotion.stagger,
  });

  if (loading) {
    return <AppLoading message="Carregando transação" description="Buscando os detalhes da movimentação" />;
  }

  const isOpenFinance = source === 'OPEN_FINANCE';
  const isExpense = isOpenFinance
    ? openFinanceTransaction?.type === 'DEBIT'
    : transaction?.type === 'EXPENSE';

  if (
    (!isOpenFinance && !transaction) ||
    (isOpenFinance && !openFinanceTransaction)
  ) {
    return (
      <ErrorState
        title="Não foi possível carregar"
        description="Tente novamente mais tarde."
        retryLabel="Voltar"
        onRetry={() => navigation.goBack()}
        style={styles.errorState}
      />
    );
  }

  const description = isOpenFinance
    ? openFinanceTransaction!.description
    : transaction!.description;
  const amount = isOpenFinance
    ? Number(openFinanceTransaction!.amount)
    : Number(transaction!.amount);
  const category = isOpenFinance
    ? translateCategory(openFinanceTransaction!.category)
    : categoryName || 'Sem categoria';
  const status = translateTransactionStatus(
    isOpenFinance ? openFinanceTransaction!.status : transaction!.status,
  );
  const date = isOpenFinance
    ? openFinanceTransaction!.date
    : transaction!.createdAt;
  const merchantName = isOpenFinance
    ? openFinanceTransaction!.merchant?.businessName
    : null;

  return (
    <ScrollScreen topInset={false}>
      <AppHeader
        title="Detalhes"
        eyebrow="Movimentação"
        onBackPress={() => navigation.goBack()}
      />

      <Animated.View style={heroEntrance}>
        <View style={styles.hero}>
          <View
            style={[
              styles.heroIcon,
              isExpense ? styles.heroIconNegative : styles.heroIconPositive,
            ]}
          >
            <Ionicons
              name={isExpense ? 'arrow-up' : 'arrow-down'}
              size={22}
              color={isExpense ? appColors.expense : appColors.income}
            />
          </View>

          <AppText variant="micro" tone="tertiary">
            {isExpense ? 'DESPESA' : 'RECEITA'}
          </AppText>

          <AppText
            variant="amountHero"
            color={isExpense ? appColors.expense : appColors.income}
            style={styles.amount}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {isExpense
              ? `-${formatCurrency(Math.abs(amount))}`
              : `+${formatCurrency(Math.abs(amount))}`}
          </AppText>

          <AppText variant="body" tone="primary" style={styles.description} numberOfLines={3}>
            {description}
          </AppText>
        </View>

        {isOpenFinance ? (
          <View style={styles.sourceRow}>
            <Ionicons name="shield-checkmark" size={14} color={appColors.income} />
            <AppText variant="meta" tone="tertiary" style={styles.sourceText}>
              Sincronizada via Open Finance
            </AppText>
          </View>
        ) : null}
      </Animated.View>

      <Animated.View style={[metaEntrance, styles.meta]}>
        <Section title="Detalhes" eyebrow="Metadados">
          {merchantName ? (
            <InfoRow icon="storefront-outline" label="Estabelecimento" value={merchantName} />
          ) : null}

          <InfoRow icon="pricetag-outline" label="Categoria" value={category} />

          <InfoRow icon="checkmark-circle-outline" label="Status" value={status} />

          <InfoRow
            icon="calendar-outline"
            label="Data"
            value={
              isOpenFinance
                ? new Date(date).toLocaleDateString('pt-BR')
                : formatTransactionDate(date)
            }
          />

          {isOpenFinance && openFinanceTransaction!.currencyCode ? (
            <InfoRow
              icon="cash-outline"
              label="Moeda"
              value={formatCurrencyName(openFinanceTransaction!.currencyCode)}
            />
          ) : null}
        </Section>
      </Animated.View>
    </ScrollScreen>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={appColors.textTertiary} />
      </View>

      <View style={styles.infoText}>
        <AppText variant="micro" tone="tertiary">
          {label.toUpperCase()}
        </AppText>
        <AppText variant="bodySemibold" tone="primary" numberOfLines={2}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  errorState: {
    marginTop: 120,
  },

  /* Hero */
  hero: {
    alignItems: 'center',
    paddingTop: appSpace.lg,
    paddingBottom: appSpace.xl,
  },

  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: appSpace.lg,
  },

  heroIconNegative: {
    backgroundColor: appColors.expenseSubtle,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.24)',
  },

  heroIconPositive: {
    backgroundColor: appColors.incomeSubtle,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.24)',
  },

  amount: {
    marginTop: appSpace.md,
    marginBottom: appSpace.md,
  },

  description: {
    textAlign: 'center',
    maxWidth: 320,
  },

  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: appSpace.xs,
    paddingBottom: appSpace.xl,
  },

  sourceText: {
    flexShrink: 1,
  },

  /* Metadata */
  meta: {
    marginTop: appSpace.sm,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.md,
    paddingVertical: appSpace.md,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },

  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: appColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
