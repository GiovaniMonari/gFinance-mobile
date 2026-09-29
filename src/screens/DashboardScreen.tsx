
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { AppLoading } from '../components/AppLoading'
import { formatCurrency } from '../utils/formatCurrency'
import { getTransactions } from '../api/transactionApi'
import { getFinance } from '../api/financeApi'
import { calculateTotals } from '../utils/finance'
import { Finance } from '../types/finance'
import { formatTransactionStatus } from '../utils/transaction'
import type { RootStackParamList } from '../navigation/AppNavigator'

import {
  getConnections,
  getAccounts,
  getTransactions as getOpenFinanceTransactions,
} from '../services/openFinanceService'

import { getAccessToken } from '../api/authApi'

type OpenFinanceTransaction = {
  id: string
  description: string
  amount: number
  date: string
  category: string | null
  type: 'DEBIT' | 'CREDIT'
  status: string
}

type DashboardTransaction = {
  id: string
  description: string
  amount: number
  date: string
  category: string | null
  type: 'EXPENSE' | 'INCOME'
  status: string
}

export function DashboardScreen() {
  const [finance, setFinance] = useState<Finance | null>(null)
  const [loading, setLoading] = useState(true)

  const [totals, setTotals] = useState({
    expenses: 0,
    income: 0,
  })

  const [openFinanceBalance, setOpenFinanceBalance] =
    useState<number | null>(null)

  const [financialAnalysis, setFinancialAnalysis] = useState({
    expensePercentage: 0,
    savingsPercentage: 0,
    savings: 0,
    mainCategory: null as string | null,
    mainCategoryAmount: 0,
  })

  const [openFinanceTransactions, setOpenFinanceTransactions] =
    useState<DashboardTransaction[]>([])

  useFocusEffect(
    useCallback(() => {
      async function loadFinance() {
        try {
          const data = await getFinance()

          const accessToken = await getAccessToken()

          const connectionsResponse = accessToken
            ? await getConnections(accessToken)
            : null

          const connected = connectionsResponse?.connections?.[0]

          if (connected && accessToken) {
            const accountsResponse = await getAccounts(
              accessToken,
              connected.id,
            )

            const account = accountsResponse.accounts?.[0]

            if (account) {
              setOpenFinanceBalance(account.balance ?? null)

              const transactionsResponse =
                await getOpenFinanceTransactions(
                  accessToken,
                  connected.id,
                  account.id,
                )

              const bankTransactions: OpenFinanceTransaction[] =
                transactionsResponse.transactions ?? []

              const income = bankTransactions
                .filter(
                  (transaction) => transaction.type === 'CREDIT',
                )
                .reduce(
                  (total, transaction) => total + transaction.amount,
                  0,
                )

              const expenses = bankTransactions
                .filter(
                  (transaction) => transaction.type === 'DEBIT',
                )
                .reduce(
                  (total, transaction) => total + transaction.amount,
                  0,
                )

              setTotals({
                income,
                expenses,
              })

              const categoryTotals: Record<string, number> = {}

              bankTransactions.forEach((transaction) => {
                if (
                  transaction.type === 'DEBIT' &&
                  transaction.category
                ) {
                  categoryTotals[transaction.category] =
                    (categoryTotals[transaction.category] ?? 0) +
                    transaction.amount
                }
              })

              const mainCategory = Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b - a)[0]

              setFinancialAnalysis({
                expensePercentage:
                  income > 0 ? (expenses / income) * 100 : 0,

                savingsPercentage:
                  income > 0
                    ? ((income - expenses) / income) * 100
                    : 0,

                savings: income - expenses,

                mainCategory: mainCategory?.[0] ?? null,

                mainCategoryAmount: mainCategory?.[1] ?? 0,
              })

              setOpenFinanceTransactions(
                bankTransactions.map((transaction) => ({
                  id: transaction.id,
                  description: transaction.description,
                  amount: transaction.amount,
                  date: transaction.date,
                  category: transaction.category,
                  type:
                    transaction.type === 'DEBIT'
                      ? 'EXPENSE'
                      : 'INCOME',
                  status: transaction.status,
                })),
              )
            }
          }

          if (!connected) {
            const transactionsData = await getTransactions()

            setOpenFinanceTransactions(
              transactionsData.map((transaction) => ({
                id: transaction.id,
                description: transaction.description,
                amount: Number(transaction.amount),
                date: transaction.createdAt,
                category: null,
                type:
                  transaction.type === 'EXPENSE'
                    ? 'EXPENSE'
                    : 'INCOME',
                status: transaction.status,
              })),
            )

            const calculatedTotals = calculateTotals(
              transactionsData,
            )

            setTotals(calculatedTotals)

            const categoryTotals: Record<string, number> = {}

            transactionsData.forEach((transaction) => {
              if (transaction.type === 'EXPENSE') {
                const category =
                  transaction.categoryId ?? 'Sem categoria'

                categoryTotals[category] =
                  (categoryTotals[category] ?? 0) +
                  Number(transaction.amount)
              }
            })

            const mainCategory = Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)[0]

            setFinancialAnalysis({
              expensePercentage:
                calculatedTotals.income > 0
                  ? (calculatedTotals.expenses /
                      calculatedTotals.income) *
                    100
                  : 0,

              savingsPercentage:
                calculatedTotals.income > 0
                  ? ((calculatedTotals.income -
                      calculatedTotals.expenses) /
                      calculatedTotals.income) *
                    100
                  : 0,

              savings:
                calculatedTotals.income -
                calculatedTotals.expenses,

              mainCategory: mainCategory?.[0] ?? null,

              mainCategoryAmount:
                mainCategory?.[1] ?? 0,
            })
          }

          setFinance(data)
        } catch (error) {
          console.error('Erro ao buscar finanças:', error)
        } finally {
          setLoading(false)
        }
      }

      loadFinance()
    }, []),
  )

  const balance =
    openFinanceBalance ?? totals.income - totals.expenses

  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList>
    >()

  const isPositive = balance >= 0

  const insightText = financialAnalysis.mainCategory
      ? `Seus maiores gastos estão em ${financialAnalysis.mainCategory}.`
      : 'Adicione transações para receber uma análise financeira.'

    if (loading) {
    return (
      <AppLoading
        message="Preparando seu resumo"
        description="Buscando seus dados financeiros"
      />
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.brandArea}>
          <Image
            source={require('../../assets/logogFinance.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <View>
            <Text style={styles.greeting}>Olá</Text>
            <Text style={styles.headerSubtitle}>
              Sua vida financeira, em um só lugar.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons
            name="notifications-outline"
            size={21}
            color="#101828"
          />
        </TouchableOpacity>
      </View>

      {/* TITLE */}

      <View style={styles.titleArea}>
        <Text style={styles.title}>Visão geral</Text>

        {openFinanceBalance !== null && (
          <View style={styles.connectedBadge}>
            <View style={styles.connectedDot} />

            <Text style={styles.connectedText}>
              Conta conectada
            </Text>
          </View>
        )}
      </View>

      {/* BALANCE */}

      <View style={styles.balanceCard}>
        <View style={styles.balanceTop}>
          <Text style={styles.balanceLabel}>
            SALDO TOTAL
          </Text>

          <View style={styles.balanceIcon}>
            <Ionicons
              name="wallet-outline"
              size={19}
              color="#ffffff"
            />
          </View>
        </View>

        <Text
          style={[
            styles.balanceValue,
            isPositive
              ? styles.balancePositive
              : styles.balanceNegative,
          ]}
        >
          {formatCurrency(balance)}
        </Text>

        <View style={styles.balanceBottom}>
          <View style={styles.balanceStatus}>
            <Ionicons
              name={
                isPositive
                  ? 'trending-up-outline'
                  : 'trending-down-outline'
              }
              size={15}
              color={isPositive ? '#4ade80' : '#fb7185'}
            />

            <Text
              style={[
                styles.balanceStatusText,
                {
                  color: isPositive ? '#86efac' : '#fda4af',
                },
              ]}
            >
              {isPositive
                ? 'Saldo positivo'
                : 'Saldo negativo'}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward-outline"
            size={17}
            color="#667085"
          />
        </View>
      </View>

      {/* SUMMARY */}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEyebrow}>
          RESUMO
        </Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconIncome}>
            <Ionicons
              name="arrow-up-outline"
              size={17}
              color="#16a34a"
            />
          </View>

          <Text style={styles.summaryLabel}>
            Receitas
          </Text>

          <Text style={styles.summaryValue}>
            {formatCurrency(totals.income)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIconExpense}>
            <Ionicons
              name="arrow-down-outline"
              size={17}
              color="#dc2626"
            />
          </View>

          <Text style={styles.summaryLabel}>
            Despesas
          </Text>

          <Text style={styles.summaryValue}>
            {formatCurrency(totals.expenses)}
          </Text>
        </View>
      </View>

      {/* MONEY ANALYSIS */}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEyebrow}>
          SEU DINHEIRO
        </Text>
      </View>

      <View style={styles.moneyCard}>
        <View style={styles.moneyHeader}>
          <View>
            <Text style={styles.moneyTitle}>
              Comprometimento da renda
            </Text>

            <Text style={styles.moneySubtitle}>
              Quanto da sua renda já foi utilizada
            </Text>
          </View>

          <Text style={styles.moneyPercentage}>
            {financialAnalysis.expensePercentage.toFixed(0)}%
          </Text>
        </View>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(
                  financialAnalysis.expensePercentage,
                  100,
                )}%`,
              },
            ]}
          />
        </View>

        <View style={styles.moneyStats}>
          <View style={styles.moneyStat}>
            <Text style={styles.moneyStatLabel}>
              DISPONÍVEL
            </Text>

            <Text
              style={[
                styles.moneyStatValue,
                financialAnalysis.savings < 0
                  ? styles.expense
                  : styles.income,
              ]}
            >
              {formatCurrency(
                financialAnalysis.savings,
              )}
            </Text>

            <Text style={styles.moneyStatDescription}>
              {financialAnalysis.savingsPercentage.toFixed(
                0,
              )}
              % da renda
            </Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.moneyStat}>
            <Text style={styles.moneyStatLabel}>
              MAIOR CATEGORIA
            </Text>

            <Text
              style={styles.categoryValue}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {financialAnalysis.mainCategory ??
                'Sem categoria'}
            </Text>

            <Text style={styles.moneyStatDescription}>
              {formatCurrency(
                financialAnalysis.mainCategoryAmount,
              )}
            </Text>
          </View>
        </View>
      </View>

      {/* INSIGHT */}

      <View style={styles.insightCard}>
        <View style={styles.insightIcon}>
          <Ionicons
            name="sparkles-outline"
            size={20}
            color="#2563eb"
          />
        </View>

        <View style={styles.insightContent}>
          <Text style={styles.insightLabel}>
            INSIGHT DO GFINANCE
          </Text>

          <Text style={styles.insightText}>
            {insightText}
          </Text>

          {financialAnalysis.mainCategory && (
            <Text style={styles.insightDescription}>
              {formatCurrency(
                financialAnalysis.mainCategoryAmount,
              )}{' '}
              representam sua principal concentração
              de despesas.
            </Text>
          )}
        </View>
      </View>

      {/* TRANSACTIONS */}

      <View style={styles.transactionsHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>
            MOVIMENTAÇÕES
          </Text>

          <Text style={styles.transactionsTitle}>
            Transações recentes
          </Text>
        </View>

        <TouchableOpacity>
          <Text style={styles.seeAll}>
            Ver todas
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsCard}>
        {openFinanceTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="receipt-outline"
                size={23}
                color="#98a2b3"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Nenhuma transação
            </Text>

            <Text style={styles.emptyText}>
              Suas movimentações aparecerão aqui.
            </Text>
          </View>
        ) : (
          openFinanceTransactions
            .slice(0, 5)
            .map((transaction, index) => (
              <View
                key={transaction.id}
                style={[
                  styles.transactionRow,
                  index ===
                    Math.min(
                      openFinanceTransactions.length,
                      5,
                    ) -
                      1 && styles.lastTransaction,
                ]}
              >
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIcon,
                      transaction.type === 'EXPENSE'
                        ? styles.expenseIcon
                        : styles.incomeIcon,
                    ]}
                  >
                    <Ionicons
                      name={
                        transaction.type === 'EXPENSE'
                          ? 'arrow-down-outline'
                          : 'arrow-up-outline'
                      }
                      size={17}
                      color={
                        transaction.type === 'EXPENSE'
                          ? '#dc2626'
                          : '#16a34a'
                      }
                    />
                  </View>

                  <View style={styles.transactionInfo}>
                    <Text
                      style={styles.transactionDescription}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {transaction.description}
                    </Text>

                    <Text style={styles.transactionStatus}>
                      {formatTransactionStatus(
                        transaction.status,
                      )}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.type === 'EXPENSE'
                      ? styles.expense
                      : styles.income,
                  ]}
                >
                  {transaction.type === 'EXPENSE'
                    ? '- '
                    : '+ '}
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))
        )}
      </View>

      {/* ADD TRANSACTION */}

      {openFinanceBalance === null && (
        <TouchableOpacity
          style={styles.addTransactionButton}
          onPress={() =>
            navigation.navigate('CreateTransaction')
          }
          activeOpacity={0.85}
        >
          <View style={styles.addIcon}>
            <Ionicons
              name="add-outline"
              size={21}
              color="#ffffff"
            />
          </View>

          <View style={styles.addContent}>
            <Text style={styles.addTitle}>
              Nova transação
            </Text>

            <Text style={styles.addSubtitle}>
              Registre uma entrada ou saída
            </Text>
          </View>

          <Ionicons
            name="arrow-forward-outline"
            size={19}
            color="#ffffff"
          />
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 48,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  brandArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  logo: {
    width: 43,
    height: 43,
  },

  greeting: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 2,
  },

  headerSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#98a2b3',
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8edf3',
  },

  /* TITLE */

  titleArea: {
    marginBottom: 15,
  },

  title: {
    fontSize: 29,
    fontWeight: '800',
    color: '#101828',
    letterSpacing: -1,
    marginBottom: 8,
  },

  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },

  connectedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#12b76a',
  },

  connectedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#667085',
  },

  /* BALANCE */

  balanceCard: {
    backgroundColor: '#101828',
    borderRadius: 25,
    padding: 21,
    marginBottom: 24,
    shadowColor: '#101828',
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },

  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  balanceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#98a2b3',
    letterSpacing: 0.8,
  },

  balanceIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#1d2939',
    alignItems: 'center',
    justifyContent: 'center',
  },

  balanceValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.3,
    marginTop: 17,
    marginBottom: 20,
  },

  balancePositive: {
    color: '#ffffff',
  },

  balanceNegative: {
    color: '#fb7185',
  },

  balanceBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1d2939',
  },

  balanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  balanceStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* SECTION */

  sectionHeader: {
    marginBottom: 10,
  },

  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#98a2b3',
    letterSpacing: 1,
  },

  /* SUMMARY */

  summaryContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 25,
  },

  summaryCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#ffffff',
    borderRadius: 19,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e8edf3',
  },

  summaryIconIncome: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: '#ecfdf3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  summaryIconExpense: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: '#fff1f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#667085',
    marginBottom: 5,
  },

  summaryValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#101828',
    letterSpacing: -0.4,
  },

  /* MONEY */

  moneyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 23,
    padding: 19,
    borderWidth: 1,
    borderColor: '#e8edf3',
    marginBottom: 12,
  },

  moneyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 17,
  },

  moneyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 4,
  },

  moneySubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#98a2b3',
  },

  moneyPercentage: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563eb',
  },

  progressBackground: {
    height: 9,
    width: '100%',
    backgroundColor: '#edf1f5',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 20,
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 99,
  },

  moneyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  moneyStat: {
    flex: 1,
    minWidth: 0,
  },

  moneyStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#98a2b3',
    letterSpacing: 0.5,
    marginBottom: 7,
  },

  moneyStatValue: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 3,
  },

  categoryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 4,
  },

  moneyStatDescription: {
    fontSize: 10,
    fontWeight: '500',
    color: '#98a2b3',
  },

  verticalDivider: {
    width: 1,
    height: 52,
    backgroundColor: '#edf0f4',
    marginHorizontal: 15,
  },

  /* INSIGHT */

  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#eef5ff',
    borderRadius: 21,
    padding: 16,
    marginBottom: 27,
    borderWidth: 1,
    borderColor: '#dceaff',
    gap: 12,
  },

  insightIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  insightContent: {
    flex: 1,
    minWidth: 0,
  },

  insightLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.7,
    marginBottom: 5,
  },

  insightText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: '#172033',
  },

  insightDescription: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '500',
    color: '#667085',
    marginTop: 5,
  },

  /* TRANSACTIONS */

  transactionsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  transactionsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#101828',
    marginTop: 4,
  },

  seeAll: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 2,
  },

  transactionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 17,
    borderWidth: 1,
    borderColor: '#e8edf3',
    marginBottom: 14,
  },

  transactionRow: {
    minHeight: 69,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },

  lastTransaction: {
    borderBottomWidth: 0,
  },

  transactionLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  transactionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  expenseIcon: {
    backgroundColor: '#fff1f0',
  },

  incomeIcon: {
    backgroundColor: '#ecfdf3',
  },

  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },

  transactionDescription: {
    fontSize: 12,
    fontWeight: '700',
    color: '#172033',
    marginBottom: 4,
  },

  transactionStatus: {
    fontSize: 9,
    fontWeight: '600',
    color: '#98a2b3',
  },

  transactionAmount: {
    flexShrink: 0,
    maxWidth: 105,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },

  /* EMPTY */

  emptyState: {
    alignItems: 'center',
    paddingVertical: 27,
  },

  emptyIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#f2f4f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#344054',
    marginBottom: 4,
  },

  emptyText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#98a2b3',
  },

  /* ADD TRANSACTION */

  addTransactionButton: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },

  addIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addContent: {
    flex: 1,
  },

  addTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 3,
  },

  addSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#bfdbfe',
  },

  income: {
    color: '#16a34a',
  },

  expense: {
    color: '#dc2626',
  },
})
