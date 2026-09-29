import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import {
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import type { RootStackParamList } from '../navigation/AppNavigator'

import { getTransactionById } from '../api/transactionApi'
import type { Transaction } from '../types/transaction'

import {
  getConnections,
  getAccounts,
  getTransactions as getOpenFinanceTransactions,
} from '../services/openFinanceService'

import { getAccessToken } from '../api/authApi'

import { formatCurrency } from '../utils/formatCurrency'
import {
  formatTransactionDate,
  formatTransactionStatus,
} from '../utils/transaction'

import { getCategories } from '../api/categoryApi'
import { AppLoading } from '../components/AppLoading'

type TransactionDetailsRouteProp = RouteProp<
  RootStackParamList,
  'TransactionDetails'
>

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>

type OpenFinanceTransaction = {
  id: string
  description: string
  descriptionRaw: string | null
  currencyCode: string
  amount: number
  amountInAccountCurrency: number | null
  date: string
  category: string | null
  categoryId: string | null
  balance: number | null
  accountId: string
  providerCode: string | null
  status: string
  paymentData: unknown
  type: 'DEBIT' | 'CREDIT'
  operationType: string | null
  operationTypeAdditionalInfo: string | null
  creditCardMetadata: unknown

  merchant: {
    cnae: string | null
    cnpj: string | null
    category: string | null
    businessName: string | null
  } | null

  providerId: string | null
  order: number
  createdAt: string
  updatedAt: string
}

export function TransactionDetailsScreen() {
  const route =
    useRoute<TransactionDetailsRouteProp>()

  const navigation =
    useNavigation<NavigationProp>()

  const {
    transactionId,
    source,
  } = route.params

  const [transaction, setTransaction] =
    useState<Transaction | null>(null)

  const [openFinanceTransaction, setOpenFinanceTransaction] =
    useState<OpenFinanceTransaction | null>(null)

  const [categoryName, setCategoryName] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    async function loadTransaction() {
      try {
        setLoading(true)

        if (source === 'LOCAL') {
          const data =
            await getTransactionById(
              transactionId,
            )

          setTransaction(data)

          if (data.categoryId) {
            const categories =
              await getCategories()

            const category =
              categories.find(
                (item) =>
                  item.id === data.categoryId,
              )

            setCategoryName(
              category?.name ??
                'Categoria não encontrada',
            )
          }

          return
        }

        const accessToken =
          await getAccessToken()

        if (!accessToken) {
          throw new Error(
            'Token de acesso não encontrado',
          )
        }

        const connectionsResponse =
          await getConnections(
            accessToken,
          )

        const connection =
          (
            connectionsResponse.connections ??
            []
          ).find(
            (item: { status: string }) =>
              item.status === 'connected',
          )

        if (!connection) {
          throw new Error(
            'Nenhuma conexão Open Finance encontrada',
          )
        }

        const accountsResponse =
          await getAccounts(
            accessToken,
            connection.id,
          )

        const account =
          accountsResponse.accounts?.[0]

        if (!account) {
          throw new Error(
            'Nenhuma conta encontrada',
          )
        }

        const response =
          await getOpenFinanceTransactions(
            accessToken,
            connection.id,
            account.id,
          )

        const bankTransactions: OpenFinanceTransaction[] =
          (
            response.transactions ??
            response ??
            []
          )

        const foundTransaction =
          bankTransactions.find(
            (item) =>
              item.id === transactionId,
          )

        if (!foundTransaction) {
          throw new Error(
            'Transação não encontrada',
          )
        }

        setOpenFinanceTransaction(
          foundTransaction,
        )
      } catch (error) {
        console.error(
          'Erro ao buscar detalhes da transação:',
          error,
        )
      } finally {
        setLoading(false)
      }
    }

    loadTransaction()
  }, [
    transactionId,
    source,
  ])

  if (loading) {
    return (
      <AppLoading
        message="Carregando transação"
        description="Buscando os detalhes da movimentação"
      />
    )
  }

  const isOpenFinance =
    source === 'OPEN_FINANCE'

  const isExpense = isOpenFinance
    ? openFinanceTransaction?.type ===
      'DEBIT'
    : transaction?.type === 'EXPENSE'

  if (
    (!isOpenFinance && !transaction) ||
    (isOpenFinance &&
      !openFinanceTransaction)
  ) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIcon}>
          <Ionicons
            name="alert-circle-outline"
            size={28}
            color="#dc2626"
          />
        </View>

        <Text style={styles.errorTitle}>
          Não foi possível carregar
        </Text>

        <Text style={styles.errorDescription}>
          Tente novamente mais tarde.
        </Text>

        <TouchableOpacity
          style={styles.backErrorButton}
          onPress={() =>
            navigation.goBack()
          }
          activeOpacity={0.8}
        >
          <Text
            style={
              styles.backErrorButtonText
            }
          >
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  const description = isOpenFinance
    ? openFinanceTransaction!.description
    : transaction!.description

  const amount = isOpenFinance
    ? Number(
        openFinanceTransaction!.amount,
      )
    : Number(transaction!.amount)

  const category = isOpenFinance
    ? openFinanceTransaction!.category ??
      'Sem categoria'
    : categoryName || 'Sem categoria'

  const status = isOpenFinance
    ? openFinanceTransaction!.status
    : formatTransactionStatus(
        transaction!.status,
      )

  const date = isOpenFinance
    ? openFinanceTransaction!.date
    : transaction!.createdAt

  const merchantName =
    isOpenFinance
      ? openFinanceTransaction!.merchant
          ?.businessName
      : null

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            navigation.goBack()
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color="#101828"
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>
            MOVIMENTAÇÃO
          </Text>

          <Text style={styles.headerTitle}>
            Detalhes
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        {/* HERO */}
        <View style={styles.hero}>
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
                  ? 'arrow-down-outline'
                  : 'arrow-up-outline'
              }
              size={28}
              color="#ffffff"
            />
          </View>

          <View
            style={[
              styles.typeBadge,
              isExpense
                ? styles.expenseBadge
                : styles.incomeBadge,
            ]}
          >
            <View
              style={[
                styles.badgeDot,
                isExpense
                  ? styles.expenseDot
                  : styles.incomeDot,
              ]}
            />

            <Text
              style={[
                styles.typeBadgeText,
                isExpense
                  ? styles.expenseBadgeText
                  : styles.incomeBadgeText,
              ]}
            >
              {isExpense
                ? 'Despesa'
                : 'Receita'}
            </Text>
          </View>

          <Text
            style={styles.description}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {description}
          </Text>

          <Text
            style={[
              styles.amount,
              isExpense
                ? styles.expense
                : styles.income,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {isExpense
              ? formatCurrency(
                  -Math.abs(amount),
                )
              : `+${formatCurrency(
                  Math.abs(amount),
                )}`}
          </Text>
        </View>

        {/* SOURCE */}
        {isOpenFinance && (
          <View style={styles.connectionCard}>
            <View style={styles.connectionIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#16803c"
              />
            </View>

            <View style={styles.connectionContent}>
              <Text style={styles.connectionTitle}>
                Sincronizada via Open Finance
              </Text>

              <Text
                style={styles.connectionDescription}
              >
                Esta movimentação veio diretamente da
                sua conta conectada.
              </Text>
            </View>

            <View style={styles.connectionDot} />
          </View>
        )}

        {/* INFORMATION */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardEyebrow}>
                RESUMO
              </Text>

              <Text style={styles.cardTitle}>
                Informações
              </Text>
            </View>

            <View style={styles.cardHeaderIcon}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#2563eb"
              />
            </View>
          </View>

          {/* MERCHANT */}
          {merchantName && (
            <>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="storefront-outline"
                    size={18}
                    color="#667085"
                  />
                </View>

                <View
                  style={styles.infoContent}
                >
                  <Text style={styles.label}>
                    Estabelecimento
                  </Text>

                  <Text
                    style={styles.value}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {merchantName}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />
            </>
          )}

          {/* CATEGORY */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="pricetag-outline"
                size={18}
                color="#667085"
              />
            </View>

            <View
              style={styles.infoContent}
            >
              <Text style={styles.label}>
                Categoria
              </Text>

              <Text
                style={styles.value}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {category}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* STATUS */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#667085"
              />
            </View>

            <View
              style={styles.infoContent}
            >
              <Text style={styles.label}>
                Status
              </Text>

              <Text
                style={styles.value}
                numberOfLines={1}
              >
                {status}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* DATE */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#667085"
              />
            </View>

            <View
              style={styles.infoContent}
            >
              <Text style={styles.label}>
                Data
              </Text>

              <Text style={styles.value}>
                {isOpenFinance
                  ? new Date(
                      date,
                    ).toLocaleDateString(
                      'pt-BR',
                    )
                  : formatTransactionDate(
                      date,
                    )}
              </Text>
            </View>
          </View>

          {/* CURRENCY */}
          {isOpenFinance &&
            openFinanceTransaction!
              .currencyCode && (
              <>
                <View
                  style={styles.divider}
                />

                <View
                  style={styles.infoRow}
                >
                  <View
                    style={styles.infoIcon}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={18}
                      color="#667085"
                    />
                  </View>

                  <View
                    style={
                      styles.infoContent
                    }
                  >
                    <Text
                      style={styles.label}
                    >
                      Moeda
                    </Text>

                    <Text
                      style={styles.value}
                    >
                      {
                        openFinanceTransaction!
                          .currencyCode
                      }
                    </Text>
                  </View>
                </View>
              </>
            )}
        </View>

        {/* BOTTOM ACTION */}
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() =>
            navigation.goBack()
          }
          activeOpacity={0.85}
        >
          <Ionicons
            name="arrow-back-outline"
            size={19}
            color="#ffffff"
          />

          <Text
            style={styles.bottomButtonText}
          >
            Voltar para transações
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#f5f7fb',
  },

  /* HEADER */

  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eaecf0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#98a2b3',
    marginBottom: 2,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
  },

  headerSpacer: {
    width: 44,
  },

  /* CONTENT */

  content: {
    paddingTop: 18,
    paddingBottom: 32,
  },

  /* HERO */

  hero: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 30,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eaecf0',
  },

  transactionIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  expenseIcon: {
    backgroundColor: '#dc2626',
  },

  incomeIcon: {
    backgroundColor: '#16803c',
  },

  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    marginBottom: 13,
  },

  expenseBadge: {
    backgroundColor: '#fef2f2',
  },

  incomeBadge: {
    backgroundColor: '#ecfdf3',
  },

  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 6,
  },

  expenseDot: {
    backgroundColor: '#dc2626',
  },

  incomeDot: {
    backgroundColor: '#16803c',
  },

  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  expenseBadgeText: {
    color: '#dc2626',
  },

  incomeBadgeText: {
    color: '#16803c',
  },

  description: {
    width: '100%',
    maxWidth: 310,
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },

  amount: {
    width: '100%',
    marginTop: 10,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '800',
    textAlign: 'center',
  },

  expense: {
    color: '#dc2626',
  },

  income: {
    color: '#16803c',
  },

  /* OPEN FINANCE */

  connectionCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5f2e9',
    flexDirection: 'row',
    alignItems: 'center',
  },

  connectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#eaf7ef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  connectionContent: {
    flex: 1,
    minWidth: 0,
  },

  connectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16803c',
  },

  connectionDescription: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: '#667085',
  },

  connectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginLeft: 8,
  },

  /* INFORMATION CARD */

  card: {
    marginTop: 14,
    padding: 20,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eaecf0',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  cardEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#98a2b3',
    marginBottom: 2,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },

  cardHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#eaf2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#98a2b3',
    marginBottom: 3,
  },

  value: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    color: '#101828',
  },

  divider: {
    height: 1,
    backgroundColor: '#f0f2f5',
  },

  /* BOTTOM ACTION */

  bottomButton: {
    height: 52,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#101828',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  bottomButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },

  /* ERROR */

  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eaecf0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },

  errorDescription: {
    marginTop: 6,
    fontSize: 13,
    color: '#98a2b3',
    textAlign: 'center',
  },

  backErrorButton: {
    marginTop: 22,
    paddingHorizontal: 25,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#101828',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backErrorButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
})