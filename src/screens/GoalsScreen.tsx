import { useCallback, useState } from 'react'
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  NativeStackScreenProps,
} from '@react-navigation/native-stack'
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native'

import { getGoals } from '../api/goalApi'
import type {
  FinancialGoal,
  GoalStatus,
} from '../types/goal'

import type { RootStackParamList } from '../navigation/AppNavigator'
import { AppLoading } from '../components/AppLoading'
import { TabParamList } from '../navigation/TabNavigator'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Goals'>,
  NativeStackScreenProps<RootStackParamList>
>

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDeadline(deadline: string | null) {
  if (!deadline) {
    return 'Sem prazo'
  }

  return new Date(deadline).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  )
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

function GoalCard({
  goal,
  onPress,
}: {
  goal: FinancialGoal
  onPress: () => void
}) {
  const status = getStatusConfig(goal.status)

  const progress = Math.min(
    Math.max(goal.progress, 0),
    100,
  )

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.goalCard,
        pressed && styles.goalCardPressed,
      ]}
    >
      <View style={styles.goalHeader}>
        <View style={styles.goalIcon}>
          <Ionicons
            name={
              goal.status === 'COMPLETED'
                ? 'checkmark'
                : 'flag'
            }
            size={19}
            color="#2563eb"
          />
        </View>

        <View style={styles.goalTitleContainer}>
          <Text
            style={styles.goalName}
            numberOfLines={1}
          >
            {goal.name}
          </Text>

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
              size={12}
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
        </View>

        <Ionicons
          name="chevron-forward"
          size={19}
          color="#98a2b3"
        />
      </View>

      <View style={styles.goalAmounts}>
        <View>
          <Text style={styles.amountLabel}>
            Acumulado
          </Text>

          <Text style={styles.currentAmount}>
            {formatCurrency(goal.currentAmount)}
          </Text>
        </View>

        <View style={styles.targetAmountContainer}>
          <Text style={styles.amountLabel}>
            Objetivo
          </Text>

          <Text style={styles.targetAmount}>
            {formatCurrency(goal.targetAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          {goal.progress.toFixed(0)}%
        </Text>
      </View>

      <View style={styles.goalFooter}>
        <View style={styles.footerItem}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color="#98a2b3"
          />

          <Text style={styles.footerText}>
            {formatDeadline(goal.deadline)}
          </Text>
        </View>

        <Text style={styles.remainingText}>
          {goal.status === 'COMPLETED'
            ? 'Objetivo alcançado'
            : `${formatCurrency(
                Math.max(goal.remainingAmount, 0),
              )} restantes`}
        </Text>
      </View>
    </Pressable>
  )
}

export function GoalsScreen({
  navigation,
}: Props) {
  const [goals, setGoals] =
    useState<FinancialGoal[]>([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] =
    useState(false)

  const loadGoals = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true)
        }

        const data = await getGoals()

        setGoals(data)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar suas metas.'

        Alert.alert('Erro', message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [],
  )

  useFocusEffect(
    useCallback(() => {
      loadGoals()
    }, [loadGoals]),
  )

  if (loading) {
    return (
      <AppLoading
        message="Carregando suas metas"
        description="Buscando seus objetivos financeiros"
      />
    )
  }

  const totalTarget = goals.reduce(
    (total, goal) => total + goal.targetAmount,
    0,
  )

  const totalCurrent = goals.reduce(
    (total, goal) => total + goal.currentAmount,
    0,
  )

  const completedGoals = goals.filter(
    (goal) => goal.status === 'COMPLETED',
  ).length

  const overallProgress =
    totalTarget > 0
      ? Math.min(
          (totalCurrent / totalTarget) * 100,
          100,
        )
      : 0

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadGoals(false)
            }}
            tintColor="#2563eb"
          />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              PLANEJAMENTO
            </Text>

            <Text style={styles.title}>
              Minhas metas
            </Text>

            <Text style={styles.subtitle}>
              Transforme seus objetivos em planos.
            </Text>
          </View>

          <Pressable
            onPress={() =>
              navigation.navigate('CreateGoal')
            }
            style={styles.addButton}
          >
            <Ionicons
              name="add"
              size={22}
              color="#ffffff"
            />
          </Pressable>
        </View>

        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="flag-outline"
                size={31}
                color="#2563eb"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Comece sua primeira meta
            </Text>

            <Text style={styles.emptyDescription}>
              Crie um objetivo financeiro e acompanhe
              seu progresso de forma simples.
            </Text>

            <Pressable
              onPress={() =>
                navigation.navigate('CreateGoal')
              }
              style={styles.emptyButton}
            >
              <Ionicons
                name="add"
                size={18}
                color="#ffffff"
              />

              <Text style={styles.emptyButtonText}>
                Criar primeira meta
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.summaryLabel}>
                    Progresso geral
                  </Text>

                  <Text style={styles.summaryValue}>
                    {formatCurrency(totalCurrent)}
                  </Text>
                </View>

                <View style={styles.summaryPercentage}>
                  <Text
                    style={
                      styles.summaryPercentageText
                    }
                  >
                    {overallProgress.toFixed(0)}%
                  </Text>
                </View>
              </View>

              <View style={styles.summaryTrack}>
                <View
                  style={[
                    styles.summaryFill,
                    {
                      width: `${overallProgress}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.summaryFooter}>
                <Text style={styles.summaryFooterText}>
                  de {formatCurrency(totalTarget)}
                </Text>

                <Text style={styles.summaryFooterText}>
                  {completedGoals}{' '}
                  {completedGoals === 1
                    ? 'concluída'
                    : 'concluídas'}
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Seus objetivos
                </Text>

                <Text style={styles.sectionDescription}>
                  {goals.length}{' '}
                  {goals.length === 1
                    ? 'meta ativa'
                    : 'metas ativas'}
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  navigation.navigate('CreateGoal')
                }
                style={styles.newGoalLink}
              >
                <Ionicons
                  name="add"
                  size={17}
                  color="#2563eb"
                />

                <Text style={styles.newGoalText}>
                  Nova meta
                </Text>
              </Pressable>
            </View>

            <View style={styles.goalsList}>
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onPress={() =>
                    navigation.navigate(
                      'GoalDetails',
                      {
                        goalId: goal.id,
                      },
                    )
                  }
                />
              ))}
            </View>
          </>
        )}
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
    paddingTop: 58,
    paddingBottom: 120,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#98a2b3',
    marginBottom: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#101828',
  },

  subtitle: {
    marginTop: 5,
    fontSize: 12,
    color: '#98a2b3',
  },

  addButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 23,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eaecf0',
    marginBottom: 25,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  summaryLabel: {
    fontSize: 11,
    color: '#98a2b3',
    fontWeight: '600',
    marginBottom: 5,
  },

  summaryValue: {
    fontSize: 23,
    fontWeight: '800',
    color: '#101828',
  },

  summaryPercentage: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryPercentageText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563eb',
  },

  summaryTrack: {
    height: 9,
    borderRadius: 10,
    backgroundColor: '#eef2f6',
    overflow: 'hidden',
  },

  summaryFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 10,
  },

  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 11,
  },

  summaryFooterText: {
    fontSize: 11,
    color: '#98a2b3',
    fontWeight: '600',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#101828',
  },

  sectionDescription: {
    fontSize: 11,
    color: '#98a2b3',
    marginTop: 3,
  },

  newGoalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
  },

  newGoalText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '800',
  },

  goalsList: {
    gap: 12,
  },

  goalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 21,
    padding: 18,
    borderWidth: 1,
    borderColor: '#eaecf0',
  },

  goalCardPressed: {
    opacity: 0.72,
  },

  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  goalIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  goalTitleContainer: {
    flex: 1,
  },

  goalName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 6,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },

  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 13,
  },

  amountLabel: {
    fontSize: 10,
    color: '#98a2b3',
    marginBottom: 4,
  },

  currentAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#101828',
  },

  targetAmountContainer: {
    alignItems: 'flex-end',
  },

  targetAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667085',
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 10,
    backgroundColor: '#eef2f6',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#2563eb',
  },

  progressText: {
    width: 34,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '800',
    color: '#344054',
  },

  goalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#f2f4f7',
  },

  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  footerText: {
    fontSize: 10,
    color: '#98a2b3',
  },

  remainingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#667085',
    marginLeft: 8,
  },

  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#eaecf0',
    paddingHorizontal: 25,
    paddingVertical: 42,
    alignItems: 'center',
    marginTop: 10,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 19,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101828',
    textAlign: 'center',
  },

  emptyDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: '#98a2b3',
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 280,
  },

  emptyButton: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 15,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 22,
  },

  emptyButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
})