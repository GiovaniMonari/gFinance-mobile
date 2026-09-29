import { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { AppLoading } from '../components/AppLoading'
import {
  getTransactions as getLocalTransactions,
} from '../api/transactionApi'

import type { Transaction } from '../types/transaction'

import { formatCurrency } from '../utils/formatCurrency'
import { formatTransactionStatus } from '../utils/transaction'

import {
  getConnections,
  getAccounts,
  getTransactions as getOpenFinanceTransactions,
} from '../services/openFinanceService'

import { getAccessToken } from '../api/authApi'

import { navigationRef } from '../navigation/navigationRef'
import type { RootStackParamList } from '../navigation/AppNavigator'

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>

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
  source: 'OPEN_FINANCE' | 'LOCAL'
  localTransaction?: Transaction
}

export function TransactionsScreen() {
  const [transactions, setTransactions] =
    useState<DashboardTransaction[]>([])

  const [loading, setLoading] = useState(true)

  const [openFinanceConnected, setOpenFinanceConnected] =
    useState(false)

  const navigation =
    useNavigation<NavigationProp>()

  const loadTransactions = useCallback(
    async () => {
      try {
        setLoading(true)

        const accessToken =
          await getAccessToken()

        if (!accessToken) {
          const localTransactions =
            await getLocalTransactions()

          setOpenFinanceConnected(false)

          setTransactions(
            localTransactions.map(
              (transaction) => ({
                id: transaction.id,
                description:
                  transaction.description,
                amount: Number(
                  transaction.amount,
                ),
                date: transaction.createdAt,
                category: null,
                type:
                  transaction.type ===
                  'EXPENSE'
                    ? 'EXPENSE'
                    : 'INCOME',
                status: transaction.status,
                source: 'LOCAL',
                localTransaction:
                  transaction,
              }),
            ),
          )

          return
        }

        const connectionsResponse =
          await getConnections(accessToken)

        const connection =
          (
            connectionsResponse.connections ??
            []
          ).find(
            (item: { status: string }) =>
              item.status === 'connected',
          )

        if (!connection) {
          const localTransactions =
            await getLocalTransactions()

          setOpenFinanceConnected(false)

          setTransactions(
            localTransactions.map(
              (transaction) => ({
                id: transaction.id,
                description:
                  transaction.description,
                amount: Number(
                  transaction.amount,
                ),
                date: transaction.createdAt,
                category: null,
                type:
                  transaction.type ===
                  'EXPENSE'
                    ? 'EXPENSE'
                    : 'INCOME',
                status: transaction.status,
                source: 'LOCAL',
                localTransaction:
                  transaction,
              }),
            ),
          )

          return
        }

        setOpenFinanceConnected(true)

        const accountsResponse =
          await getAccounts(
            accessToken,
            connection.id,
          )

        const account =
          accountsResponse.accounts?.[0]

        if (!account) {
          setTransactions([])
          return
        }

        const bankTransactions =
          await getOpenFinanceTransactions(
            accessToken,
            connection.id,
            account.id,
          )

        console.log(
          'OPEN FINANCE TRANSACTIONS:',
          JSON.stringify(
            bankTransactions,
            null,
            2,
          ),
        )

        const formattedTransactions: DashboardTransaction[] =
          (
            bankTransactions.transactions ??
            bankTransactions ??
            []
          ).map(
            (
              transaction: OpenFinanceTransaction,
            ) => ({
              id: transaction.id,
              description:
                transaction.description,
              amount: Number(
                transaction.amount,
              ),
              date: transaction.date,
              category:
                transaction.category,
              type:
                transaction.type === 'DEBIT'
                  ? 'EXPENSE'
                  : 'INCOME',
              status: transaction.status,
              source: 'OPEN_FINANCE',
            }),
          )

        setTransactions(
          formattedTransactions,
        )
      } catch (error) {
        console.error(
          'Erro ao buscar transações:',
          error,
        )
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useFocusEffect(
    useCallback(() => {
      loadTransactions()
    }, [loadTransactions]),
  )

  if (loading) {
    return (
      <AppLoading
        message="Carregando transações"
        description="Sincronizando suas movimentações"
      />
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>
            Controle financeiro
          </Text>

          <Text style={styles.title}>
            Transações
          </Text>

          <Text style={styles.subtitle}>
            {openFinanceConnected
              ? 'Movimentações sincronizadas automaticamente'
              : 'Acompanhe suas movimentações financeiras'}
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="swap-horizontal"
            size={21}
            color="#2563eb"
          />
        </View>
      </View>

      {/* Connection status */}
      {openFinanceConnected && (
        <View style={styles.connectionCard}>
          <View style={styles.connectionIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#16803c"
            />
          </View>

          <View style={styles.connectionInfo}>
            <Text style={styles.connectionTitle}>
              Banco conectado
            </Text>

            <Text style={styles.connectionSubtitle}>
              Dados sincronizados via Open Finance
            </Text>
          </View>

          <View style={styles.connectionDot} />
        </View>
      )}

      {/* Local transaction action */}
      {!openFinanceConnected && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate(
              'CreateTransaction',
            )
          }
          activeOpacity={0.82}
        >
          <View style={styles.addIcon}>
            <Ionicons
              name="add"
              size={20}
              color="#ffffff"
            />
          </View>

          <View style={styles.addTextContainer}>
            <Text style={styles.addTitle}>
              Nova transação
            </Text>

            <Text style={styles.addSubtitle}>
              Registre uma nova movimentação
            </Text>
          </View>

          <Ionicons
            name="arrow-forward"
            size={18}
            color="#ffffff"
          />
        </TouchableOpacity>
      )}

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Movimentações
          </Text>

          <Text style={styles.sectionSubtitle}>
            {transactions.length === 0
              ? 'Nenhuma movimentação encontrada'
              : `${transactions.length} ${
                  transactions.length === 1
                    ? 'movimentação'
                    : 'movimentações'
                }`}
          </Text>
        </View>

        {transactions.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {transactions.length}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) =>
          `${item.source}-${item.id}`
        }
        contentContainerStyle={[
          styles.list,
          transactions.length === 0 &&
            styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isExpense =
            item.type === 'EXPENSE'

          return (
            <TouchableOpacity
              style={styles.transactionCard}
              activeOpacity={0.78}
              onPress={() => {
                if (item.source === 'LOCAL') {
                  navigationRef.navigate(
                    'TransactionDetails',
                    {
                      transactionId: item.id,
                      source: 'LOCAL',
                    },
                  )
                }

                if (
                  item.source ===
                  'OPEN_FINANCE'
                ) {
                  navigationRef.navigate(
                    'TransactionDetails',
                    {
                      transactionId: item.id,
                      source: 'OPEN_FINANCE',
                    },
                  )
                }
              }}
            >
              {/* Transaction icon */}
              <View
                style={[
                  styles.transactionIcon,
                  isExpense
                    ? styles.expenseIcon
                    : styles.incomeIcon,
                ]}
              >
                <Ionicons
                  name={
                    isExpense
                      ? 'arrow-down'
                      : 'arrow-up'
                  }
                  size={18}
                  color={
                    isExpense
                      ? '#dc2626'
                      : '#16803c'
                  }
                />
              </View>

              {/* Information */}
              <View
                style={styles.transactionInfo}
              >
                <Text
                  style={styles.description}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.description}
                </Text>

                <View
                  style={styles.metaRow}
                >
                  {item.category && (
                    <View
                      style={styles.categoryTag}
                    >
                      <Ionicons
                        name="pricetag-outline"
                        size={10}
                        color="#667085"
                      />

                      <Text
                        style={styles.category}
                        numberOfLines={1}
                      >
                        {item.category}
                      </Text>
                    </View>
                  )}

                  <View
                    style={styles.statusTag}
                  >
                    <Text
                      style={styles.status}
                      numberOfLines={1}
                    >
                      {formatTransactionStatus(
                        item.status,
                      )}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Amount */}
              <View
                style={styles.amountContainer}
              >
                <Text
                  style={[
                    styles.amount,
                    isExpense
                      ? styles.expense
                      : styles.income,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  {isExpense
                    ? formatCurrency(
                        -Math.abs(
                          item.amount,
                        ),
                      )
                    : `+${formatCurrency(
                        Math.abs(
                          item.amount,
                        ),
                      )}`}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#c4c9d1"
                />
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={
                  openFinanceConnected
                    ? 'card-outline'
                    : 'receipt-outline'
                }
                size={28}
                color="#98a2b3"
              />
            </View>

            <Text style={styles.emptyTitle}>
              {openFinanceConnected
                ? 'Nenhuma movimentação'
                : 'Nenhuma transação'}
            </Text>

            <Text
              style={styles.emptyDescription}
            >
              {openFinanceConnected
                ? 'Não encontramos transações na conta conectada.'
                : 'Suas transações aparecerão aqui assim que forem registradas.'}
            </Text>

            {!openFinanceConnected && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() =>
                  navigation.navigate(
                    'CreateTransaction',
                  )
                }
                activeOpacity={0.8}
              >
                <Text
                  style={styles.emptyButtonText}
                >
                  Criar transação
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#2563eb"
                />
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    paddingHorizontal: 20,
    paddingTop: 58,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fb',
  },

  /* Header */

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 16,
  },

  eyebrow: {
    fontSize: 13,
    fontWeight: '500',
    color: '#667085',
    marginBottom: 3,
  },

  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.7,
    color: '#101828',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#98a2b3',
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Connection */

  connectionCard: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6f2ea',
  },

  connectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#eaf7ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  connectionInfo: {
    flex: 1,
    minWidth: 0,
  },

  connectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#101828',
  },

  connectionSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#98a2b3',
  },

  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginLeft: 8,
  },

  /* Add button */

  addButton: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 22,
    borderRadius: 18,
    backgroundColor: '#101828',
  },

  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  addTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  addTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  addSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#98a2b3',
  },

  /* Section */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: '#98a2b3',
  },

  countBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#edf0f4',
  },

  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667085',
  },

  /* Transactions */

  list: {
    paddingTop: 2,
    paddingBottom: 110,
  },

  emptyList: {
    flexGrow: 1,
    paddingBottom: 110,
  },

  transactionCard: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 12,
    paddingVertical: 11,

    marginBottom: 9,

    borderRadius: 18,
    backgroundColor: '#ffffff',

    borderWidth: 1,
    borderColor: '#edf0f4',
  },

  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 11,
  },

  expenseIcon: {
    backgroundColor: '#fff0f0',
  },

  incomeIcon: {
    backgroundColor: '#eaf7ef',
  },

  transactionInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },

  description: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
    color: '#101828',
    flexShrink: 1,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    marginTop: 6,
    gap: 5,
  },

  categoryTag: {
    maxWidth: 105,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: '#f5f7fa',
  },

  category: {
    maxWidth: 86,
    fontSize: 10,
    color: '#667085',
    flexShrink: 1,
  },

  statusTag: {
    maxWidth: 82,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: '#f5f7fa',
  },

  status: {
    fontSize: 10,
    color: '#98a2b3',
    flexShrink: 1,
  },

  amountContainer: {
    width: 108,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },

  amount: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'right',
  },

  expense: {
    color: '#dc2626',
  },

  income: {
    color: '#16803c',
  },

  /* Empty */

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 35,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#edf0f4',
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
  },

  emptyDescription: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#98a2b3',
    textAlign: 'center',
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#eaf2ff',
  },

  emptyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
})