import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import {
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'

import type { RootStackParamList } from '../navigation/AppNavigator'
import { getTransactionById } from '../api/transactionApi'
import type { Transaction } from '../types/transaction'
import { formatCurrency } from '../utils/formatCurrency'
import {
  formatTransactionDate,
  formatTransactionStatus,
} from '../utils/transaction'
import { Ionicons } from '@expo/vector-icons'
import { getCategories } from '../api/categoryApi'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

type TransactionDetailsRouteProp = RouteProp<
  RootStackParamList,
  'TransactionDetails'
>

export function TransactionDetailsScreen() {
  const route = useRoute<TransactionDetailsRouteProp>()

  const { transactionId } = route.params

  const [transaction, setTransaction] =
    useState<Transaction | null>(null)

  const [categoryName, setCategoryName] = useState('')

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTransaction() {
      try {
        const data = await getTransactionById(transactionId)

        setTransaction(data)

        if (data.categoryId) {
            const categories = await getCategories()

            const category = categories.find(
                (item) => item.id === data.categoryId,
            )

            setCategoryName(category?.name ?? 'Categoria não encontrada')
            }
      } catch (error) {
        console.error(
          'Erro ao buscar transação:',
          error,
        )
      } finally {
        setLoading(false)
      }
    }

    loadTransaction()
  }, [transactionId])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  
  if (!transaction) {
    return (
      <View style={styles.center}>
        <Text>Não foi possível carregar a transação.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
        <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
        >
            <Ionicons
            name="arrow-back"
            size={24}
            color="#111"
            />
        </TouchableOpacity>

        <Text style={styles.title}>
            Detalhes da transação
        </Text>

      <View style={styles.card}>
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
                size={24}
                color="#fff"
            />
            </View>
        <Text style={styles.label}>Descrição</Text>

        <Text style={styles.description}>
          {transaction.description}
        </Text>

        <Text style={styles.label}>Categoria</Text>

        <Text style={styles.value}>
            {categoryName || 'Sem categoria'}
        </Text>

        <Text style={styles.label}>Valor</Text>

        <Text
          style={[
            styles.amount,
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

        <Text style={styles.label}>Tipo</Text>

        <Text style={styles.value}>
          {transaction.type === 'EXPENSE'
            ? 'Despesa'
            : transaction.type === 'INCOME'
              ? 'Receita'
              : 'Depósito'}
        </Text>

        <Text style={styles.label}>Status</Text>

        <Text style={styles.value}>
          {formatTransactionStatus(
            transaction.status,
          )}
        </Text>

        <Text style={styles.label}>Data</Text>

        <Text style={styles.value}>
          {formatTransactionDate(
            transaction.createdAt,
          )}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },

  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    padding: 20,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#777',
    marginTop: 16,
    marginBottom: 6,
  },

  description: {
    fontSize: 20,
    fontWeight: '700',
  },

  amount: {
    fontSize: 26,
    fontWeight: '700',
  },

  expense: {
    color: '#c00',
  },

  income: {
    color: '#080',
  },

  value: {
    fontSize: 16,
    color: '#222',
  },
  transactionIcon: {
  width: 52,
  height: 52,
  borderRadius: 26,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 8,
},

expenseIcon: {
  backgroundColor: '#c00',
},

incomeIcon: {
  backgroundColor: '#080',
},
backButton: {
  width: 40,
  height: 40,
  justifyContent: 'center',
  marginBottom: 8,
},
})