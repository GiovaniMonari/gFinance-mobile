import { useCallback, useState } from 'react'
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  NativeStackScreenProps,
} from '@react-navigation/native-stack'
import { useFocusEffect } from '@react-navigation/native'

import {
  addGoalProgress,
  deleteGoal,
  getGoalById,
  getGoalTransactions,
  removeGoalProgress,
} from '../api/goalApi'

import type {
  FinancialGoal,
  GoalStatus,
  GoalTransaction,
} from '../types/goal'

import type { RootStackParamList } from '../navigation/AppNavigator'
import { AppLoading } from '../components/AppLoading'

type Props = NativeStackScreenProps<
  RootStackParamList,
  'GoalDetails'
>

type ActionType = 'add' | 'remove' | null

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Sem prazo definido'
  }

  return new Date(value).toLocaleDateString('pt-BR')
}

function getStatusConfig(status: GoalStatus) {
  switch (status) {
    case 'COMPLETED':
      return {
        label: 'Concluída',
        color: '#16803c',
        background: '#ecfdf3',
        icon: 'checkmark-circle' as const,
      }

    case 'OVERDUE':
      return {
        label: 'Prazo encerrado',
        color: '#dc2626',
        background: '#fef2f2',
        icon: 'alert-circle' as const,
      }

    default:
      return {
        label: 'Em andamento',
        color: '#2563eb',
        background: '#eaf2ff',
        icon: 'flag' as const,
      }
  }
}

function formatTransactionDate(value: string) {
  return new Date(value).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  )
}

export function GoalDetailsScreen({
  navigation,
  route,
}: Props) {
  const { goalId } = route.params

  const [goal, setGoal] =
    useState<FinancialGoal | null>(null)

  const [transactions, setTransactions] =
    useState<GoalTransaction[]>([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [action, setAction] =
    useState<ActionType>(null)

  const [amount, setAmount] = useState('')
  const [actionLoading, setActionLoading] =
    useState(false)

  const loadGoal = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true)
        }

        const [goalData, transactionData] =
          await Promise.all([
            getGoalById(goalId),
            getGoalTransactions(goalId),
          ])

        setGoal(goalData)
        setTransactions(transactionData)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar a meta.'

        Alert.alert(
          'Erro',
          message,
          [
            {
              text: 'Voltar',
              onPress: () => navigation.goBack(),
            },
          ],
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [goalId, navigation],
  )

  useFocusEffect(
    useCallback(() => {
      loadGoal()
    }, [loadGoal]),
  )

  function parseAmount(value: string) {
    const normalized = value
      .replace(/\./g, '')
      .replace(',', '.')

    const parsed = Number(normalized)

    return Number.isFinite(parsed) ? parsed : 0
  }

  async function handleProgress() {
    const parsedAmount = parseAmount(amount)

    if (parsedAmount <= 0) {
      Alert.alert(
        'Valor inválido',
        'Digite um valor maior que zero.',
      )
      return
    }

    if (!goal) {
      return
    }

    if (
      action === 'add' &&
      parsedAmount > goal.remainingAmount
    ) {
      Alert.alert(
        'Valor acima do restante',
        `Você ainda precisa de ${formatCurrency(
          goal.remainingAmount,
        )} para concluir essa meta.`,
      )
      return
    }

    if (
      action === 'remove' &&
      parsedAmount > goal.currentAmount
    ) {
      Alert.alert(
        'Valor inválido',
        'Você não pode retirar mais do que já foi acumulado.',
      )
      return
    }

    try {
      setActionLoading(true)

      if (action === 'add') {
        await addGoalProgress(goalId, {
          amount: parsedAmount,
        })
      } else if (action === 'remove') {
        await removeGoalProgress(goalId, {
          amount: parsedAmount,
        })
      }

      setAmount('')
      setAction(null)

      await loadGoal(false)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a meta.'

      Alert.alert(
        'Não foi possível atualizar',
        message,
      )
    } finally {
      setActionLoading(false)
    }
  }

  function handleDelete() {
    Alert.alert(
      'Excluir meta?',
      'Essa ação não poderá ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goalId)

              navigation.goBack()
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : 'Não foi possível excluir a meta.'

              Alert.alert(
                'Erro',
                message,
              )
            }
          },
        },
      ],
    )
  }

  if (loading || !goal) {
    return (
      <AppLoading
        message="Carregando sua meta"
        description="Buscando seu progresso e histórico"
      />
    )
  }

  const status = getStatusConfig(goal.status)

  const progressWidth = Math.min(
    Math.max(goal.progress, 0),
    100,
  )

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadGoal(false)
            }}
            tintColor="#2563eb"
          />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#101828"
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              META FINANCEIRA
            </Text>

            <Text
              style={styles.title}
              numberOfLines={1}
            >
              {goal.name}
            </Text>
          </View>

          <Pressable
            onPress={handleDelete}
            style={styles.deleteButton}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color="#dc2626"
            />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    status.background,
                },
              ]}
            >
              <Ionicons
                name={status.icon}
                size={15}
                color={status.color}
              />

              <Text
                style={[
                  styles.statusText,
                  {
                    color: status.color,
                  },
                ]}
              >
                {status.label}
              </Text>
            </View>

            <Text style={styles.progressPercentage}>
              {goal.progress.toFixed(0)}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressWidth}%`,
                },
              ]}
            />
          </View>

          <View style={styles.heroValues}>
            <View>
              <Text style={styles.valueLabel}>
                Acumulado
              </Text>

              <Text style={styles.currentValue}>
                {formatCurrency(goal.currentAmount)}
              </Text>
            </View>

            <View style={styles.targetContainer}>
              <Text style={styles.valueLabel}>
                Objetivo
              </Text>

              <Text style={styles.targetValue}>
                {formatCurrency(goal.targetAmount)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="wallet-outline"
                size={18}
                color="#2563eb"
              />
            </View>

            <Text style={styles.statLabel}>
              Falta
            </Text>

            <Text style={styles.statValue}>
              {formatCurrency(
                Math.max(goal.remainingAmount, 0),
              )}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#2563eb"
              />
            </View>

            <Text style={styles.statLabel}>
              Prazo
            </Text>

            <Text style={styles.statValue}>
              {formatDate(goal.deadline)}
            </Text>
          </View>
        </View>

        {goal.status !== 'COMPLETED' && (
          <View style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>
              Atualizar progresso
            </Text>

            <Text style={styles.sectionDescription}>
              Registre valores que você adicionou ou
              retirou dessa meta.
            </Text>

            <View style={styles.actionButtons}>
              <Pressable
                onPress={() => {
                  setAction('add')
                  setAmount('')
                }}
                style={[
                  styles.actionButton,
                  styles.addButton,
                ]}
              >
                <Ionicons
                  name="add"
                  size={21}
                  color="#ffffff"
                />

                <Text style={styles.addButtonText}>
                  Adicionar
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setAction('remove')
                  setAmount('')
                }}
                style={[
                  styles.actionButton,
                  styles.removeButton,
                ]}
              >
                <Ionicons
                  name="remove"
                  size={21}
                  color="#344054"
                />

                <Text style={styles.removeButtonText}>
                  Retirar
                </Text>
              </Pressable>
            </View>

            {action && (
              <View style={styles.progressForm}>
                <View style={styles.progressFormHeader}>
                  <Text style={styles.formTitle}>
                    {action === 'add'
                      ? 'Adicionar valor'
                      : 'Retirar valor'}
                  </Text>

                  <Pressable
                    onPress={() => {
                      setAction(null)
                      setAmount('')
                    }}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color="#98a2b3"
                    />
                  </Pressable>
                </View>

                <View style={styles.amountInputWrapper}>
                  <Text style={styles.amountPrefix}>
                    R$
                  </Text>

                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0,00"
                    placeholderTextColor="#98a2b3"
                    keyboardType="decimal-pad"
                    style={styles.amountInput}
                    autoFocus
                  />
                </View>

                <Pressable
                  onPress={handleProgress}
                  disabled={actionLoading}
                  style={[
                    styles.confirmButton,
                    actionLoading &&
                      styles.confirmButtonDisabled,
                  ]}
                >
                  <Text style={styles.confirmButtonText}>
                    {actionLoading
                      ? 'Atualizando...'
                      : 'Confirmar'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {goal.status === 'COMPLETED' && (
          <View style={styles.completedCard}>
            <View style={styles.completedIcon}>
              <Ionicons
                name="checkmark"
                size={22}
                color="#16803c"
              />
            </View>

            <View style={styles.completedContent}>
              <Text style={styles.completedTitle}>
                Meta concluída
              </Text>

              <Text style={styles.completedDescription}>
                Você alcançou o valor que definiu para
                esse objetivo.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Histórico
              </Text>

              <Text style={styles.sectionDescription}>
                Movimentações dessa meta
              </Text>
            </View>

            <View style={styles.historyCount}>
              <Text style={styles.historyCountText}>
                {transactions.length}
              </Text>
            </View>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyHistory}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={22}
                  color="#98a2b3"
                />
              </View>

              <Text style={styles.emptyTitle}>
                Nenhuma movimentação
              </Text>

              <Text style={styles.emptyDescription}>
                Os valores adicionados ou retirados
                aparecerão aqui.
              </Text>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {transactions.map(
                (transaction) => {
                  const isDeposit =
                    transaction.type === 'DEPOSIT'

                  return (
                    <View
                      key={transaction.id}
                      style={styles.transaction}
                    >
                      <View
                        style={[
                          styles.transactionIcon,
                          {
                            backgroundColor:
                              isDeposit
                                ? '#ecfdf3'
                                : '#fef2f2',
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            isDeposit
                              ? 'arrow-down'
                              : 'arrow-up'
                          }
                          size={17}
                          color={
                            isDeposit
                              ? '#16803c'
                              : '#dc2626'
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.transactionInfo
                        }
                      >
                        <Text
                          style={
                            styles.transactionTitle
                          }
                        >
                          {isDeposit
                            ? 'Valor adicionado'
                            : 'Valor retirado'}
                        </Text>

                        <Text
                          style={
                            styles.transactionDate
                          }
                        >
                          {formatTransactionDate(
                            transaction.createdAt,
                          )}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.transactionAmount,
                          {
                            color: isDeposit
                              ? '#16803c'
                              : '#dc2626',
                          },
                        ]}
                      >
                        {isDeposit ? '+' : '-'}
                        {formatCurrency(
                          transaction.amount,
                        )}
                      </Text>
                    </View>
                  )
                },
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 120,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eaecf0',
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#98a2b3',
    marginBottom: 3,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#101828',
  },

  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },

  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 21,
    borderWidth: 1,
    borderColor: '#eaecf0',
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 19,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  progressPercentage: {
    fontSize: 28,
    fontWeight: '800',
    color: '#101828',
  },

  progressTrack: {
    height: 10,
    backgroundColor: '#eef2f6',
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 10,
  },

  heroValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 17,
  },

  valueLabel: {
    fontSize: 11,
    color: '#98a2b3',
    fontWeight: '600',
    marginBottom: 4,
  },

  currentValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101828',
  },

  targetContainer: {
    alignItems: 'flex-end',
  },

  targetValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667085',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 19,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eaecf0',
  },

  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  statLabel: {
    fontSize: 11,
    color: '#98a2b3',
    marginBottom: 4,
  },

  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#101828',
  },

  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eaecf0',
    marginTop: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#101828',
  },

  sectionDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: '#98a2b3',
    marginTop: 4,
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  addButton: {
    backgroundColor: '#2563eb',
  },

  addButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  removeButton: {
    backgroundColor: '#f2f4f7',
  },

  removeButtonText: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '800',
  },

  progressForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eaecf0',
  },

  progressFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  formTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#344054',
  },

  amountInputWrapper: {
    height: 52,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  amountPrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667085',
    marginLeft: 15,
  },

  amountInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#101828',
  },

  confirmButton: {
    height: 48,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  confirmButtonDisabled: {
    opacity: 0.6,
  },

  confirmButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  completedCard: {
    marginTop: 12,
    backgroundColor: '#ecfdf3',
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  completedIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  completedContent: {
    flex: 1,
  },

  completedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },

  completedDescription: {
    fontSize: 11,
    lineHeight: 17,
    color: '#3f6212',
    marginTop: 3,
  },

  historySection: {
    marginTop: 28,
  },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  historyCount: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  historyCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
  },

  emptyHistory: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eaecf0',
    alignItems: 'center',
    padding: 28,
  },

  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#f2f4f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#344054',
  },

  emptyDescription: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#98a2b3',
  },

  transactionList: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eaecf0',
    overflow: 'hidden',
  },

  transaction: {
    minHeight: 72,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f2f4f7',
  },

  transactionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  transactionInfo: {
    flex: 1,
  },

  transactionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#344054',
  },

  transactionDate: {
    fontSize: 10,
    color: '#98a2b3',
    marginTop: 4,
  },

  transactionAmount: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
})