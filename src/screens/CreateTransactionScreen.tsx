import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import type { TransactionType } from '../types/transaction'
import { createTransaction } from '../api/transactionApi'
import { getCategories, Category } from '../api/categoryApi'
import { useFocusEffect } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/AppNavigator'

import { Ionicons } from '@expo/vector-icons'

export function CreateTransactionScreen() {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [transactionType, setTransactionType] = useState<TransactionType>('EXPENSE')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<string>('')

    const loadCategories = useCallback(async () => {
        try {
            const data = await getCategories()

            setCategories(data)
        } catch (error) {
            console.error('Erro ao buscar categorias:', error)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadCategories()
        }, [loadCategories]),
    )

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  async function handleCreate() {
    if (!amount) {
        Alert.alert('Atenção', 'Informe o valor da transação.')
        return
    }

    try {
        setLoading(true)

        const normalizedAmount = Number(
        amount.replace(',', '.'),
        )

        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        Alert.alert('Atenção', 'Informe um valor válido.')
        return
        }

        if (transactionType === 'EXPENSE' && !categoryId) {
            Alert.alert(
                'Atenção',
                'Selecione uma categoria para a despesa.',
            )
            return
        }

        await createTransaction({
            amount: normalizedAmount,
            transactionType,
            description: description || undefined,
            categoryId: categoryId || undefined,
        })

        setAmount('')
        setDescription('')
        setCategoryId('')
        setTransactionType('EXPENSE')

        Alert.alert(
            'Sucesso',
            'Transação criada com sucesso.',
            [
                {
                text: 'OK',
                onPress: () => navigation.goBack(),
                },
            ],
        )
    } catch (error) {
        Alert.alert(
        'Erro',
        error instanceof Error
            ? error.message
            : 'Não foi possível criar a transação.',
        )
    } finally {
        setLoading(false)
    }
    }

return (
    <View style={styles.container}>
        <Text style={styles.title}>Nova transação</Text>

        <Text style={styles.label}>Valor</Text>

        <TextInput
            style={styles.input}
            placeholder="R$ 0,00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
        />

        <Text style={styles.label}>Descrição</Text>

        <TextInput
        style={styles.input}
        placeholder="Ex.: Mercado"
        value={description}
        onChangeText={setDescription}
        />

        <Text style={styles.label}>Tipo</Text>

        <View style={styles.typeContainer}>
        <TouchableOpacity
            style={[
            styles.typeButton,
            transactionType === 'EXPENSE' &&
                styles.typeButtonActive,
            ]}
            onPress={() => setTransactionType('EXPENSE')}
        >
            <Ionicons
                name="arrow-down-outline"
                size={20}
                color={
                    transactionType === 'EXPENSE'
                    ? '#fff'
                    : '#555'
                }
                />

                <Text
                style={[
                    styles.typeButtonText,
                    transactionType === 'EXPENSE' &&
                    styles.typeButtonTextActive,
                ]}
                >
                Despesa
                </Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[
            styles.typeButton,
            transactionType === 'INCOME' &&
                styles.typeButtonActive,
            ]}
           onPress={() => {
            setTransactionType('INCOME')
            setCategoryId('')
            }}
        >
            <Ionicons
                name="arrow-up-outline"
                size={20}
                color={
                    transactionType === 'INCOME'
                    ? '#fff'
                    : '#555'
                }
                />

                <Text
                style={[
                    styles.typeButtonText,
                    transactionType === 'INCOME' &&
                    styles.typeButtonTextActive,
                ]}
                >
                Receita
                </Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[
            styles.typeButton,
            transactionType === 'DEPOSIT' &&
                styles.typeButtonActive,
            ]}
            onPress={() => {
            setTransactionType('DEPOSIT')
            setCategoryId('')
            }}
        >
            <Ionicons
                name="wallet-outline"
                size={20}
                color={
                    transactionType === 'DEPOSIT'
                    ? '#fff'
                    : '#555'
                }
                />

                <Text
                style={[
                    styles.typeButtonText,
                    transactionType === 'DEPOSIT' &&
                    styles.typeButtonTextActive,
                ]}
                >
                Depósito
                </Text>
        </TouchableOpacity>
        </View>

        {transactionType === 'EXPENSE' && (
        <>
            <Text style={styles.label}>Categoria</Text>

            <View style={styles.categoryContainer}>
            {categories.map((category) => (
                <TouchableOpacity
                key={category.id}
                style={[
                    styles.categoryButton,
                    categoryId === category.id &&
                    styles.categoryButtonActive,
                ]}
                onPress={() => setCategoryId(category.id)}
                >
                <>
                <Ionicons
                    name="pricetag-outline"
                    size={18}
                    color={
                    categoryId === category.id
                        ? '#fff'
                        : '#555'
                    }
                />

                <Text
                    style={[
                    styles.categoryButtonText,
                    categoryId === category.id &&
                        styles.categoryButtonTextActive,
                    ]}
                >
                    {category.name}
                </Text>
                </>
                </TouchableOpacity>
            ))}
            </View>
        </>
        )}

        <TouchableOpacity
            style={styles.button}
            onPress={handleCreate}
            disabled={loading}
            >
            {!loading && (
                <Ionicons
                name="add-circle-outline"
                size={22}
                color="#fff"
                />
            )}

            <Text style={styles.buttonText}>
                {loading
                ? 'Adicionando...'
                : 'Adicionar transação'}
            </Text>
        </TouchableOpacity>
    </View>
    )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
  },

  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    flexDirection: 'row',
    gap: 8,
    },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    },

    typeButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    },

    typeButtonActive: {
    backgroundColor: '#111',
    borderColor: '#111',
    },

    typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    },

    typeButtonTextActive: {
    color: '#fff',
    },
    categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
    },

    categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    },

    categoryButtonActive: {
    backgroundColor: '#111',
    borderColor: '#111',
    },

    categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    },

    categoryButtonTextActive: {
    color: '#fff',
    },
})