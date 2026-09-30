/**
 * Econva — Recurring Expenses
 *
 * The list of what repeats. Rows carry the amount and the day, the category
 * sits under the description, and deletion is behind the same confirmation
 * panel the rest of the app uses for anything destructive.
 *
 * This is a manual-finance feature: it reads nothing from Open Finance and
 * works on an account with no bank link at all, which is exactly the account
 * this screen exists for.
 *
 * Reads are unchanged from the API it calls. The list shows active records
 * only — the backend keeps the row after a removal rather than deleting it,
 * so filtering here is what makes the entry actually disappear.
 */

import { useCallback, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import Reanimated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  deleteRecurringExpense,
  getRecurringExpenses,
  type RecurringExpense,
} from '../api/recurringApi';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { AppLoading } from '../components/AppLoading';
import { formatCurrency } from '../utils/formatCurrency';
import { appColors, appMotion, appSpace } from '../theme/app';
import { useEntrance } from '../components/ui';
import {
  AppHeader,
  AppText,
  EmptyState,
  ListRow,
  ScrollScreen,
  Section,
  showAlert,
} from '../components/app';

const ROW_LAYOUT = LinearTransition.duration(appMotion.layout);

const ROW_ENTER = Array.from({ length: 9 }, (_, i) =>
  FadeIn.duration(appMotion.layout).delay(i * appMotion.stagger),
);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** `10/11`, written out rather than through `Intl`, which Hermes may not have. */
function formatShortDate(iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return '';

  return `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`;
}

export function RecurringExpensesScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const all = await getRecurringExpenses();

      setItems(
        all.filter((item) => item.active !== false),
      );
    } catch (error) {
      console.error('ERRO AO CARREGAR RECORRENTES:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const headerEntrance = useEntrance({ start: !loading });
  const listEntrance = useEntrance({
    start: !loading,
    delay: appMotion.stagger,
  });

  /**
   * Destructive, so nothing happens on a single tap. The panel states what
   * stops and what stays: future charges cease, the transactions already
   * recorded remain.
   */
  function confirmDelete(item: RecurringExpense) {
    if (deletingId) return;

    showAlert({
      title: 'Excluir gasto recorrente?',
      message:
        'As próximas cobranças deixarão de ser registradas. As transações já criadas permanecem no seu histórico.',
      tone: 'warning',
      icon: 'trash-outline',
      actions: [
        { label: 'Cancelar', style: 'secondary' },
        {
          label: 'Excluir',
          style: 'danger',
          onPress: () => void handleDelete(item.id),
        },
      ],
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      await deleteRecurringExpense(id);

      // Dropped locally so the row leaves immediately rather than waiting for
      // a refetch the user did not ask for.
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error('ERRO AO EXCLUIR RECORRENTE:', error);

      showAlert({
        title: 'Não foi possível excluir',
        message:
          error instanceof Error
            ? error.message
            : 'Tente novamente em instantes.',
        tone: 'danger',
      });
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <AppLoading
        message="Carregando gastos recorrentes"
        description="Buscando suas cobranças fixas"
      />
    );
  }

  return (
    <ScrollScreen topInset={false}>
      <Animated.View style={headerEntrance}>
        <AppHeader
          title="Gastos recorrentes"
          eyebrow="Automação"
          onBackPress={() => navigation.goBack()}
        />

        <AppText variant="screenTitle" tone="primary" style={styles.title}>
          O que se repete todo mês
        </AppText>
        <AppText variant="bodySmall" tone="secondary" style={styles.subtitle}>
          Aluguel, assinaturas e contas fixas, registrados por você — sem
          depender de um banco conectado.
        </AppText>
      </Animated.View>

      <Animated.View style={listEntrance}>
        {items.length === 0 ? (
          <EmptyState
            icon="repeat-outline"
            title="Nenhum gasto recorrente"
            description="Crie suas primeiras cobranças fixas e o Econva acompanha o dia de cada uma."
            actionLabel="Criar gasto recorrente"
            onActionPress={() =>
              navigation.navigate('CreateRecurringExpense')
            }
          />
        ) : (
          <Section
            title="Seus recorrentes"
            eyebrow="Automação"
            description={`${items.length} ${
              items.length === 1
                ? 'gasto recorrente'
                : 'gastos recorrentes'
            }`}
            actionLabel="Novo"
            onActionPress={() =>
              navigation.navigate('CreateRecurringExpense')
            }
          >
            {items.map((item, index) => {
              const title =
                item.description?.trim() || 'Gasto recorrente';
              const amount = Number(item.amount);

              return (
                <Reanimated.View
                  key={item.id}
                  entering={ROW_ENTER[Math.min(index, 8)]}
                  layout={ROW_LAYOUT}
                >
                  <ListRow
                    divider={index > 0}
                    title={title}
                    meta={`Todo dia ${item.dayOfMonth} · ${
                      item.category?.name ?? 'Sem categoria'
                    }`}
                    amount={`-${formatCurrency(amount)}`}
                    amountTone="negative"
                    footnote={
                      item.nextExecution
                        ? `Próximo ${formatShortDate(item.nextExecution)}`
                        : undefined
                    }
                    icon="repeat"
                    iconTone="accent"
                    trailing={
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          confirmDelete(item);
                        }}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={`Excluir ${title}`}
                        style={styles.remove}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={17}
                          color={appColors.expense}
                        />
                      </Pressable>
                    }
                  />
                </Reanimated.View>
              );
            })}
          </Section>
        )}
      </Animated.View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: appSpace.xs,
    marginBottom: appSpace.xs,
  },

  subtitle: {
    marginBottom: appSpace.xxl,
  },

  remove: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
