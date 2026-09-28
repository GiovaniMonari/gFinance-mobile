import { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { getTransactions } from '../api/transactionApi'
import type { Transaction } from '../types/transaction'
import { formatCurrency } from '../utils/formatCurrency'
import { Ionicons } from '@expo/vector-icons'
import { formatTransactionStatus } from '../utils/transaction'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { navigationRef } from '../navigation/navigationRef'
import type { RootStackParamList } from '../navigation/AppNavigator'

export function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true)

      const data = await getTransactions()

      setTransactions(data)
    } catch (error) {
      console.error('Erro ao buscar transações:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadTransactions()
    }, [loadTransactions]),
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transações</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('CreateTransaction')}
      >
        <Ionicons
          name="add-outline"
          size={22}
          color="#fff"
        />

        <Text style={styles.addButtonText}>
          Nova transação
        </Text>
      </TouchableOpacity>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.transactionRow}
            onPress={() => {
              navigationRef.navigate('TransactionDetails', {
                transactionId: item.id,
              })
            }}
          >
            <View
                style={[
                styles.transactionIcon,
                item.type === 'EXPENSE'
                    ? styles.expenseIcon
                    : styles.incomeIcon,
                ]}
            >
                <Ionicons
                name={
                    item.type === 'EXPENSE'
                    ? 'arrow-down-outline'
                    : 'arrow-up-outline'
                }
                size={20}
                color="#fff"
                />
            </View>

            <View style={styles.transactionInfo}>
              <Text style={styles.description}>
                {item.description}
              </Text>

              <Text style={styles.status}>
                {formatTransactionStatus(item.status)}
              </Text>
            </View>

            <Text
              style={[
                styles.amount,
                item.type === 'EXPENSE'
                  ? styles.expense
                  : styles.income,
              ]}
            >
              {item.type === 'EXPENSE' ? '- ' : '+ '}
              {formatCurrency(item.amount)}
            </Text>
          </TouchableOpacity>
        )}
      />
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
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
  },

  list: {
    paddingTop: 16,
  },

  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  transactionInfo: {
    flex: 1,
    marginRight: 16,
  },

  description: {
    fontSize: 16,
    fontWeight: '600',
  },

  status: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },

  amount: {
    fontSize: 16,
    fontWeight: '700',
  },

  expense: {
    color: '#d00',
  },

  income: {
    color: '#080',
  },
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    },

    expenseIcon: {
    backgroundColor: '#d00',
    },

    incomeIcon: {
    backgroundColor: '#080',
  },
  addButton: {
  height: 52,
  borderRadius: 14,
  backgroundColor: '#111',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
},

  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
})