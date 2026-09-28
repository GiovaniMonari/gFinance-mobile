import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { formatCurrency } from '../utils/formatCurrency'
import { getTransactions } from '../api/transactionApi'
import { getFinance } from '../api/financeApi'
import { calculateTotals } from '../utils/finance'
import { Transaction } from '../types/transaction'
import { Finance } from '../types/finance'
import { formatTransactionStatus } from '../utils/transaction'
import { TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { Ionicons } from '@expo/vector-icons'

export function DashboardScreen() {
  const [finance, setFinance] = useState<Finance | null>(null)
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({
    expenses: 0,
    income: 0,
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useFocusEffect(
    useCallback(() => {
    async function loadFinance() {
      try {
        const data = await getFinance()

        const transactionsData = await getTransactions()

        setTransactions(transactionsData)

        const calculatedTotals = calculateTotals(
          transactionsData,
        )

        setTotals(calculatedTotals)

        setFinance(data)
      } catch (error) {
        console.error('Erro ao buscar finanças:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFinance()
  }, []))

  const balance = totals.income - totals.expenses

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Olá</Text>

      <Text style={styles.title}>Visão geral</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>
          Saldo atual
        </Text>

        <Text
          style={[
            styles.balance,
            balance < 0 ? styles.expense : styles.income,
          ]}
        >
          {loading
            ? 'Carregando...'
            : formatCurrency(balance)}
        </Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            Receitas
          </Text>

          <Text style={styles.summaryValue}>
            {formatCurrency(totals.income)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            Despesas
          </Text>

          <Text style={styles.summaryValue}>
            {formatCurrency(totals.expenses)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            Saldo
          </Text>

          <Text
            style={[
              styles.summaryValue,
              balance < 0 ? styles.expense : styles.income,
            ]}
          >
            {formatCurrency(balance)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            Renda mensal
          </Text>

          <Text style={styles.summaryValue}>
            {formatCurrency(finance?.monthlyIncome ?? 0)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.addTransactionButton}
        onPress={() => navigation.navigate('CreateTransaction')}
      >
        <Ionicons
          name="add-outline"
          size={22}
          color="#fff"
        />

        <Text style={styles.addTransactionText}>
          Nova transação
        </Text>
      </TouchableOpacity>

      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>
          Transações recentes
        </Text>

        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhuma transação encontrada.
          </Text>
        ) : (
          transactions.slice(0, 5).map((transaction) => (
            <View key={transaction.id} style={styles.transactionRow}>
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
                    size={18}
                    color="#fff"
                  />
                </View>

                <View>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>

                  <Text style={styles.transactionStatus}>
                    {formatTransactionStatus(transaction.status)}
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
                {transaction.type === 'EXPENSE' ? '- ' : '+ '}
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
  },

  greeting: {
    fontSize: 16,
    color: '#666',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 24,
  },

  balanceCard: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#f2f2f2',
  },

  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },

  balance: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },

  summaryCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#f2f2f2',
  },

  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },

  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  transactionsSection: {
    marginTop: 28,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },

  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
  },

  transactionStatus: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },

  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },

  expense: {
    color: '#d00',
  },

  income: {
    color: '#080',
  },
  emptyText: {
    color: '#888',
    fontSize: 15,
    paddingVertical: 16,
  },
  transactionLeft: {
  flexDirection: 'row',
  alignItems: 'center',
},

transactionIcon: {
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10,
},

expenseIcon: {
  backgroundColor: '#d00',
},

incomeIcon: {
  backgroundColor: '#080',
},
addTransactionButton: {
  marginTop: 20,
  height: 52,
  borderRadius: 14,
  backgroundColor: '#111',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
},

addTransactionText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},
})