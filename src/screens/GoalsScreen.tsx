/**
 * Econva — Goals
 *
 * Goals communicate progress, target and remaining amount without becoming
 * gamified. The brand accent carries the progress; semantic colour appears only
 * where it means something: a completed goal, an expired one.
 *
 * Each goal is a row in a list, not a card floating in space, so the screen
 * stays calm as the number of goals grows.
 *
 * Data, calculations and navigation are unchanged.
 */

import { useCallback, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Reanimated, {
  FadeInDown,
  LinearTransition,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { getGoals } from '../api/goalApi';
import type { FinancialGoal, GoalStatus } from '../types/goal';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { AppLoading } from '../components/AppLoading';
import type { TabParamList } from '../navigation/TabNavigator';
import { appColors, appMotion, appMotionScale, appRadius, appSpace } from '../theme/app';
import { Button, Progress, ProgressLabel, useEntrance } from '../components/ui';
import {
  AppText,
  EmptyState,
  Metric,
  MetricDivider,
  ScrollScreen,
  Section,
  Surface,
  showAlert,
  usePressScale,
} from '../components/app';

/*
 * Layout animation definitions live at module scope, not inline in JSX.
 * `FadeInDown.duration(...)` builds a new object every time it is called, and
 * an `entering` prop that changes identity re-triggers the entrance — so a
 * screen that merely re-renders would replay its fade from zero opacity and
 * look like it had blanked. Stable references, stable behaviour.
 */
const ROW_LAYOUT = LinearTransition.duration(appMotion.layout);

/** Pre-built staggered entrances, so a row's animation never changes identity. */
const ROW_ENTER = Array.from({ length: 9 }, (_, i) =>
  FadeInDown.duration(appMotion.layout).delay(i * appMotion.stagger),
);

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Goals'>,
  NativeStackScreenProps<RootStackParamList>
>;

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return 'Sem prazo';
  return new Date(deadline).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
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
        tone: 'income' as const,
      };
    case 'OVERDUE':
      return {
        label: 'Prazo encerrado',
        color: appColors.expense,
        background: appColors.expenseSubtle,
        icon: 'alert-circle' as const,
        tone: 'expense' as const,
      };
    default:
      return {
        label: 'Em andamento',
        color: appColors.accentBright,
        background: appColors.accentWash,
        icon: 'flag' as const,
        tone: 'accent' as const,
      };
  }
}

function GoalRow({
  goal,
  onPress,
  isFirst,
}: {
  goal: FinancialGoal;
  onPress: () => void;
  isFirst: boolean;
}) {
  const status = getStatusConfig(goal.status);
  const progress = Math.min(Math.max(goal.progress, 0), 100);
  const tone = status.tone;

  const { style: pressStyle, onPressIn, onPressOut } = usePressScale({
    scale: appMotionScale.row,
    dim: 0.6,
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`Abrir meta ${goal.name}`}
      style={[styles.goal, !isFirst && styles.goalDivided]}
    >
      <Reanimated.View style={pressStyle}>
      <View style={styles.goalHeader}>
        <AppText variant="section" tone="primary" numberOfLines={1} style={styles.goalName}>
          {goal.name}
        </AppText>
        <Ionicons name="chevron-forward" size={16} color={appColors.textTertiary} />
      </View>

      <View style={styles.goalMeta}>
        <View style={[styles.statusPill, { backgroundColor: status.background }]}>
          <Ionicons name={status.icon} size={11} color={status.color} />
          <AppText variant="micro" color={status.color}>
            {status.label.toUpperCase()}
          </AppText>
        </View>

        <View style={styles.deadline}>
          <Ionicons name="calendar-outline" size={12} color={appColors.textTertiary} />
          <AppText variant="meta" tone="tertiary" numberOfLines={1}>
            {formatDeadline(goal.deadline)}
          </AppText>
        </View>
      </View>

      <View style={styles.goalValues}>
        <AppText variant="valueLarge" tone="primary">
          {formatCurrency(goal.currentAmount)}
        </AppText>
        <AppText variant="amount" tone="tertiary">
          de {formatCurrency(goal.targetAmount)}
        </AppText>
      </View>

      <View style={styles.goalProgress}>
        <Progress value={progress} size="thin" tone={tone} animate={false} />
        <ProgressLabel value={progress} tone={tone} style={styles.goalPercent} />
      </View>

      <AppText variant="meta" tone="tertiary" style={styles.goalRemaining}>
        {goal.status === 'COMPLETED'
          ? 'Objetivo alcançado'
          : `${formatCurrency(Math.max(goal.remainingAmount, 0))} restantes`}
      </AppText>
      </Reanimated.View>
    </Pressable>
  );
}

export function GoalsScreen({ navigation }: Props) {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGoals = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const data = await getGoals();
        setGoals(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar suas metas.';
        showAlert({ title: 'Erro', message, tone: 'danger' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals]),
  );

  const headerEntrance = useEntrance({ start: !loading });
  const summaryEntrance = useEntrance({
    start: !loading,
    delay: appMotion.stagger,
  });
  const listEntrance = useEntrance({
    start: !loading,
    delay: appMotion.stagger * 2,
  });

  if (loading) {
    return (
      <AppLoading
        message="Carregando suas metas"
        description="Buscando seus objetivos financeiros"
      />
    );
  }

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const completedGoals = goals.filter((g) => g.status === 'COMPLETED').length;
  const overallProgress =
    totalTarget > 0 ? Math.min((totalCurrent / totalTarget) * 100, 100) : 0;

  return (
    <ScrollScreen
      tabBar
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        loadGoals(false);
      }}
    >
      <Animated.View style={headerEntrance}>
        <AppText variant="micro" tone="tertiary">
          PLANEJAMENTO
        </AppText>
        <AppText variant="screenTitle" tone="primary" style={styles.title}>
          Minhas metas
        </AppText>
        <AppText variant="bodySmall" tone="secondary" style={styles.subtitle}>
          Transforme seus objetivos em planos.
        </AppText>

        {goals.length > 0 ? (
          <Button
            title="Nova meta"
            onPress={() => navigation.navigate('CreateGoal')}
            size="md"
            icon="add"
            fullWidth
            style={styles.newGoalButton}
          />
        ) : null}
      </Animated.View>

      {goals.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState
            icon="flag-outline"
            title="Comece sua primeira meta"
            description="Crie um objetivo financeiro e acompanhe seu progresso de forma simples."
            actionLabel="Criar primeira meta"
            onActionPress={() => navigation.navigate('CreateGoal')}
          />
        </View>
      ) : (
        <>
          <Animated.View style={summaryEntrance}>
            <Surface variant="elevated" radius="panel" padding="xl">
              <AppText variant="micro" tone="tertiary">
                PROGRESSO GERAL
              </AppText>

              <AppText
                variant="value"
                tone="primary"
                style={styles.summaryValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {formatCurrency(totalCurrent)}
              </AppText>

              <View style={styles.summaryProgress}>
                <Progress value={overallProgress} size="regular" marker />
                <ProgressLabel value={overallProgress} style={styles.summaryPercent} />
              </View>

              <View style={styles.metrics}>
                <Metric
                  label="Objetivo total"
                  value={formatCurrency(totalTarget)}
                />
                <MetricDivider style={styles.metricsDivider} />
                <Metric
                  label="Concluídas"
                  value={String(completedGoals)}
                  tone={completedGoals > 0 ? 'positive' : 'primary'}
                  align="end"
                />
              </View>
            </Surface>
          </Animated.View>

          <Animated.View style={[listEntrance, styles.list]}>
            <Section
              title="Seus objetivos"
              description={`${goals.length} ${goals.length === 1 ? 'meta ativa' : 'metas ativas'}`}
            >
              {goals.map((goal, index) => (
                <Reanimated.View
                  key={goal.id}
                  entering={ROW_ENTER[Math.min(index, 8)]}
                  layout={ROW_LAYOUT}
                >
                  <GoalRow
                    goal={goal}
                    isFirst={index === 0}
                    onPress={() =>
                      navigation.navigate('GoalDetails', { goalId: goal.id })
                    }
                  />
                </Reanimated.View>
              ))}
            </Section>
          </Animated.View>
        </>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: appSpace.xs,
    marginBottom: appSpace.xs,
  },

  subtitle: {
    marginBottom: appSpace.xl,
  },

  newGoalButton: {
    marginBottom: appSpace.xxl,
  },

  empty: {
    marginTop: appSpace.xxxl,
  },

  /* Summary */
  summaryValue: {
    marginTop: appSpace.md,
    marginBottom: appSpace.lg,
  },

  summaryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.md,
  },

  summaryPercent: {
    width: 52,
    textAlign: 'right',
  },

  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: appSpace.xl,
  },

  metricsDivider: {
    height: 40,
  },

  /* List */
  list: {
    marginTop: appSpace.xxl,
  },

  goal: {
    paddingVertical: appSpace.lg,
  },

  goalDivided: {
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },

  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.md,
    marginBottom: appSpace.sm,
  },

  goalName: {
    flex: 1,
  },

  goalMeta: {
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

  deadline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.xs,
    flexShrink: 1,
  },

  goalValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: appSpace.sm,
    marginBottom: appSpace.md,
  },

  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.md,
  },

  goalPercent: {
    width: 44,
    textAlign: 'right',
  },

  goalRemaining: {
    marginTop: appSpace.sm,
  },
});
