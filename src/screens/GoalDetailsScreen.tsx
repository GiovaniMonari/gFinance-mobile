/**
 * Econva — Goal Details
 *
 * A deeper version of the Goals experience: the same progress language at a
 * larger scale, the figures that matter, the action that moves the number, and
 * the history behind it. Hierarchy comes from scale and spacing, not from
 * stacking cards.
 *
 * Progress mutation, validation, deletion and history are unchanged.
 */

import { useCallback, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Reanimated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  addGoalProgress,
  deleteGoal,
  getGoalById,
  getGoalTransactions,
  removeGoalProgress,
} from '../api/goalApi';
import type {
  FinancialGoal,
  GoalStatus,
  GoalTransaction,
} from '../types/goal';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { AppLoading } from '../components/AppLoading';
import { appColors, appMotion, appRadius, appSpace } from '../theme/app';
import {
  Button,
  Field,
  Progress,
  ProgressLabel,
  useEntrance,
  type ProgressTone,
} from '../components/ui';
import {
  AppHeader,
  AppText,
  EmptyState,
  IconButton,
  ListRow,
  Metric,
  MetricDivider,
  ScrollScreen,
  Section,
  Surface,
  showAlert,
} from '../components/app';

/*
 * Layout animation definitions live at module scope, not inline in JSX.
 * `FadeIn.duration(...)` builds a new object every time it is called, and an
 * `entering` prop that changes identity re-triggers the entrance — so a screen
 * that merely re-renders would replay its fade from zero opacity and look like
 * it had blanked. Stable references, stable behaviour.
 */
const ENTER = FadeIn.duration(appMotion.layout);
const EXIT = FadeOut.duration(appMotion.state);
const ROW_LAYOUT = LinearTransition.duration(appMotion.layout);

/** Pre-built staggered entrances, so a row's animation never changes identity. */
const ROW_ENTER = Array.from({ length: 9 }, (_, i) =>
  FadeInDown.duration(appMotion.layout).delay(i * appMotion.stagger),
);

type Props = NativeStackScreenProps<RootStackParamList, 'GoalDetails'>;

type ActionType = 'add' | 'remove' | null;

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(value: string | null) {
  if (!value) return 'Sem prazo definido';
  return new Date(value).toLocaleDateString('pt-BR');
}

function formatTransactionDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusConfig(status: GoalStatus) {
  switch (status) {
    case 'COMPLETED':
      return {
        label: 'Concluída',
        color: appColors.income,
        background: appColors.incomeSubtle,
        icon: 'checkmark-circle' as const,
        tone: 'income' as ProgressTone,
      };
    case 'OVERDUE':
      return {
        label: 'Prazo encerrado',
        color: appColors.expense,
        background: appColors.expenseSubtle,
        icon: 'alert-circle' as const,
        tone: 'expense' as ProgressTone,
      };
    default:
      return {
        label: 'Em andamento',
        color: appColors.accentBright,
        background: appColors.accentWash,
        icon: 'flag' as const,
        tone: 'accent' as ProgressTone,
      };
  }
}

export function GoalDetailsScreen({ navigation, route }: Props) {
  const { goalId } = route.params;

  const [goal, setGoal] = useState<FinancialGoal | null>(null);
  const [transactions, setTransactions] = useState<GoalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [action, setAction] = useState<ActionType>(null);
  const [amount, setAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadGoal = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const [goalData, transactionData] = await Promise.all([
          getGoalById(goalId),
          getGoalTransactions(goalId),
        ]);
        setGoal(goalData);
        setTransactions(transactionData);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar a meta.';
        showAlert({
          title: 'Erro',
          message,
          tone: 'danger',
          actions: [
            { label: 'Voltar', onPress: () => navigation.goBack() },
          ],
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [goalId, navigation],
  );

  useFocusEffect(
    useCallback(() => {
      loadGoal();
    }, [loadGoal]),
  );

  function parseAmount(value: string) {
    const normalized = value.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async function handleProgress() {
    const parsedAmount = parseAmount(amount);
    if (parsedAmount <= 0) {
      showAlert({
        title: 'Valor inválido',
        message: 'Digite um valor maior que zero.',
        tone: 'warning',
      });
      return;
    }
    if (!goal) return;

    if (action === 'add' && parsedAmount > goal.remainingAmount) {
      showAlert({
        title: 'Valor acima do restante',
        message: `Você ainda precisa de ${formatCurrency(goal.remainingAmount)} para concluir essa meta.`,
        tone: 'warning',
      });
      return;
    }
    if (action === 'remove' && parsedAmount > goal.currentAmount) {
      showAlert({
        title: 'Valor inválido',
        message: 'Você não pode retirar mais do que já foi acumulado.',
        tone: 'warning',
      });
      return;
    }

    try {
      setActionLoading(true);
      if (action === 'add') {
        await addGoalProgress(goalId, { amount: parsedAmount });
      } else if (action === 'remove') {
        await removeGoalProgress(goalId, { amount: parsedAmount });
      }
      setAmount('');
      setAction(null);
      await loadGoal(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a meta.';
      showAlert({
        title: 'Não foi possível atualizar',
        message,
        tone: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  }

  function handleDelete() {
    showAlert({
      title: 'Excluir meta?',
      message: 'Essa ação não poderá ser desfeita.',
      tone: 'warning',
      actions: [
        { label: 'Cancelar', style: 'secondary' },
        {
          label: 'Excluir',
          style: 'danger',
          onPress: async () => {
            try {
              await deleteGoal(goalId);
              navigation.goBack();
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : 'Não foi possível excluir a meta.';
              showAlert({ title: 'Erro', message, tone: 'danger' });
            }
          },
        },
      ],
    });
  }

  /*
   * The loader stays up until the goal itself has arrived, so the entrances
   * wait on both conditions — not just the fetch flag.
   */
  const contentReady = !(loading || !goal);

  const heroEntrance = useEntrance({ start: contentReady });
  const statsEntrance = useEntrance({
    start: contentReady,
    delay: appMotion.stagger,
  });
  const actionEntrance = useEntrance({
    start: contentReady,
    delay: appMotion.stagger * 2,
  });
  const historyEntrance = useEntrance({
    start: contentReady,
    delay: appMotion.stagger * 3,
  });

  if (loading || !goal) {
    return (
      <AppLoading
        message="Carregando sua meta"
        description="Buscando seu progresso e histórico"
      />
    );
  }

  const status = getStatusConfig(goal.status);
  const progressWidth = Math.min(Math.max(goal.progress, 0), 100);

  return (
    <ScrollScreen
      topInset={false}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        loadGoal(false);
      }}
    >
      <AppHeader
        title={goal.name}
        eyebrow="Meta financeira"
        onBackPress={() => navigation.goBack()}
        action={
          <IconButton
            icon="trash-outline"
            tone="negative"
            onPress={handleDelete}
            accessibilityLabel="Excluir meta"
          />
        }
      />

      {/* Hero — the goal at display scale */}
      <Animated.View style={heroEntrance}>
        <Surface variant="elevated" radius="panel" padding="xl">
          <View style={styles.heroTop}>
            <View style={[styles.statusPill, { backgroundColor: status.background }]}>
              <Ionicons name={status.icon} size={12} color={status.color} />
              <AppText variant="micro" color={status.color}>
                {status.label.toUpperCase()}
              </AppText>
            </View>
            <ProgressLabel
              value={progressWidth}
              tone={status.tone}
              style={styles.heroPercent}
            />
          </View>

          <AppText
            variant="value"
            tone="primary"
            style={styles.heroValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {formatCurrency(goal.currentAmount)}
          </AppText>
          <AppText variant="bodySmall" tone="secondary">
            de {formatCurrency(goal.targetAmount)}
          </AppText>

          <View style={styles.heroProgress}>
            <Progress value={progressWidth} size="regular" tone={status.tone} marker />
          </View>
        </Surface>
      </Animated.View>

      {/* Remaining and deadline */}
      <Animated.View style={[statsEntrance, styles.metricsRow]}>
        <Metric
          label="Falta"
          value={formatCurrency(Math.max(goal.remainingAmount, 0))}
          icon="wallet-outline"
        />
        <MetricDivider style={styles.metricsDivider} />
        <Metric
          label="Prazo"
          value={formatDate(goal.deadline)}
          icon="calendar-outline"
          align="end"
        />
      </Animated.View>

      {/* Progress action */}
      {goal.status !== 'COMPLETED' ? (
        <Animated.View style={[actionEntrance, styles.block]}>
          <Section
            title="Atualizar progresso"
            eyebrow="Ação"
            description="Registre valores que você adicionou ou retirou dessa meta."
          >
            {!action ? (
              <View style={styles.actionRow}>
                <Button
                  title="Adicionar"
                  onPress={() => {
                    setAction('add');
                    setAmount('');
                  }}
                  size="md"
                  icon="add"
                  style={styles.actionButton}
                />
                <Button
                  title="Retirar"
                  onPress={() => {
                    setAction('remove');
                    setAmount('');
                  }}
                  variant="secondary"
                  size="md"
                  icon="remove"
                  style={styles.actionButton}
                />
              </View>
            ) : (
              /*
                The form takes the place of the two buttons rather than
                appearing under them. `FadeIn`/`FadeOut` give it a direction to
                travel so the swap reads as one control opening, not as the
                layout jumping.
              */
              <Reanimated.View
                entering={ENTER}
                exiting={EXIT}
                layout={ROW_LAYOUT}
                style={styles.progressForm}
              >
                <View style={styles.formHeader}>
                  <AppText variant="captionStrong" tone="primary">
                    {action === 'add' ? 'Adicionar valor' : 'Retirar valor'}
                  </AppText>
                  <IconButton
                    icon="close"
                    onPress={() => {
                      setAction(null);
                      setAmount('');
                    }}
                    accessibilityLabel="Fechar"
                  />
                </View>

                <Field
                  label="Valor"
                  placeholder="0,00"
                  icon="cash-outline"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                  flush
                />

                <Button
                  title={actionLoading ? 'Atualizando...' : 'Confirmar'}
                  onPress={handleProgress}
                  loading={actionLoading}
                  size="md"
                  fullWidth
                  style={styles.confirmButton}
                />
              </Reanimated.View>
            )}
          </Section>
        </Animated.View>
      ) : (
        /*
          `actionEntrance` is a React Native Animated style, so it has to stay
          on an `Animated.View` — Reanimated cannot read RN Animated values and
          throws on them. The layout animation therefore goes on an inner view
          that carries no RN styles.
        */
        <Animated.View style={[actionEntrance, styles.block]}>
          <Reanimated.View
            entering={ENTER}
            exiting={EXIT}
            layout={ROW_LAYOUT}
          >
            <Surface variant="positive" radius="group" padding="md">
              <View style={styles.completedRow}>
                <Ionicons name="checkmark-circle" size={18} color={appColors.income} />
                <View style={styles.completedText}>
                  <AppText variant="captionStrong" tone="positive">
                    Meta concluída
                  </AppText>
                  <AppText variant="caption" tone="secondary">
                    Você alcançou o valor que definiu para esse objetivo.
                  </AppText>
                </View>
              </View>
            </Surface>
          </Reanimated.View>
        </Animated.View>
      )}

      {/* History */}
      <Animated.View style={historyEntrance}>
        <Section
          title="Histórico"
          eyebrow="Movimentações"
          description={
            transactions.length > 0
              ? `${transactions.length} ${transactions.length === 1 ? 'registro' : 'registros'}`
              : 'Movimentações dessa meta'
          }
        >
          {transactions.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="Nenhuma movimentação"
              description="Os valores adicionados ou retirados aparecerão aqui."
            />
          ) : (
            <View>
              {transactions.map((transaction, index) => {
                const isDeposit = transaction.type === 'DEPOSIT';

                return (
                  <Reanimated.View
                    key={transaction.id}
                    entering={ROW_ENTER[Math.min(index, 8)]}
                    layout={ROW_LAYOUT}
                  >
                    <ListRow
                      divider={index > 0}
                      title={isDeposit ? 'Valor adicionado' : 'Valor retirado'}
                      meta={formatTransactionDate(transaction.createdAt)}
                      amount={`${isDeposit ? '+' : '-'}${formatCurrency(transaction.amount)}`}
                      amountTone={isDeposit ? 'positive' : 'negative'}
                      icon={isDeposit ? 'arrow-down' : 'arrow-up'}
                      iconTone={isDeposit ? 'positive' : 'negative'}
                    />
                  </Reanimated.View>
                );
              })}
            </View>
          )}
        </Section>
      </Animated.View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  /* Hero */
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: appSpace.md,
    marginBottom: appSpace.lg,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.xs,
    paddingHorizontal: appSpace.sm,
    paddingVertical: 3,
    borderRadius: appRadius.full,
  },

  heroPercent: {
    fontSize: 22,
  },

  heroValue: {
    marginBottom: 2,
  },

  heroProgress: {
    marginTop: appSpace.xl,
  },

  /* Metrics */
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: appSpace.xxl,
    marginBottom: appSpace.xl,
  },

  metricsDivider: {
    height: 40,
  },

  /* Blocks */
  block: {
    marginBottom: appSpace.xxl,
  },

  /* Action */
  actionRow: {
    flexDirection: 'row',
    gap: appSpace.md,
  },

  actionButton: {
    flex: 1,
  },

  progressForm: {
    paddingTop: appSpace.lg,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },

  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: appSpace.md,
  },

  confirmButton: {
    marginTop: appSpace.lg,
  },

  /* Completed */
  completedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appSpace.md,
  },

  completedText: {
    flex: 1,
    gap: 2,
  },
});
