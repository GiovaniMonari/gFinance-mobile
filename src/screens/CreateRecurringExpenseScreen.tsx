/**
 * Econva — Create Recurring Expense
 *
 * A focused form in the same language as the rest of the app: three fields,
 * the categories the account already has as chips, and one action.
 *
 * It asks for nothing a bank would supply — no account, no institution, no
 * connection. That is the point: the account writing this has no Open Finance
 * link and still needs fixed monthly costs recorded.
 *
 * Two animation drivers share this screen, and they do not mix. The screen
 * entrances come from `useEntrance`, which is built on React Native's own
 * `Animated` and hands back an `Animated.Value` sitting in `translateY` — so
 * those go on React Native's `Animated.View`. The press feedback comes from
 * `usePressScale`, which is built on Reanimated and hands back a UI-thread
 * style — so the chip goes on Reanimated's `Animated.View`. Putting a React
 * Native interpolation into a Reanimated transform is what breaks.
 *
 * Parsing, validation and the API call follow the shape the backend already
 * expects (`amount`, `description`, `categoryId`, `dayOfMonth`).
 */

import { useCallback, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, type Category } from '../api/categoryApi';
import { createRecurringExpense } from '../api/recurringApi';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  appColors,
  appMotion,
  appMotionScale,
  appRadius,
  appSpace,
} from '../theme/app';
import { Button, Field, useEntrance } from '../components/ui';
import { usePressScale } from '../components/app/motion';
import {
  AppHeader,
  AppText,
  ScrollScreen,
  Section,
  showAlert,
} from '../components/app';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'CreateRecurringExpense'
>;

/** One category option — the same selection language as the transaction form. */
function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const {
    style: pressStyle,
    onPressIn,
    onPressOut,
  } = usePressScale({ scale: appMotionScale.control, dim: 0.7 });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Reanimated.View style={[styles.chipContent, pressStyle]}>
        <AppText
          variant="captionStrong"
          tone={active ? 'accent' : 'secondary'}
        >
          {label}
        </AppText>
      </Reanimated.View>
    </Pressable>
  );
}

export function CreateRecurringExpenseScreen({ navigation }: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const headerEntrance = useEntrance();
  const formEntrance = useEntrance({ delay: appMotion.stagger });
  const actionEntrance = useEntrance({ delay: appMotion.stagger * 2 });

  /**
   * The same read every other screen makes, so the chips show the predefined
   * set a new account is given before it has recorded anything.
   */
  const loadCategories = useCallback(async () => {
    try {
      setCategories(await getCategories());
    } catch (error) {
      console.error('ERRO AO CARREGAR CATEGORIAS:', error);
      setCategories([]);
    }
  }, []);

  /**
   * Focus rather than mount, matching every other screen that reads
   * categories: returning here re-reads them, so a category added elsewhere
   * shows up without restarting the screen.
   */
  useFocusEffect(
    useCallback(() => {
      void loadCategories();
    }, [loadCategories]),
  );

  function parseAmount(value: string) {
    const normalized = value.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async function handleCreate() {
    const trimmedDescription = description.trim();
    const parsedAmount = parseAmount(amount);
    const day = Number(dayOfMonth.trim());

    if (parsedAmount <= 0) {
      showAlert({
        title: 'Valor inválido',
        message: 'Digite um valor maior que zero.',
        tone: 'warning',
      });
      return;
    }

    if (!Number.isInteger(day) || day < 1 || day > 31) {
      showAlert({
        title: 'Dia do mês inválido',
        message: 'Informe um dia entre 1 e 31.',
        tone: 'warning',
      });
      return;
    }

    try {
      setLoading(true);

      await createRecurringExpense({
        amount: parsedAmount,
        dayOfMonth: day,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
        ...(categoryId ? { categoryId } : {}),
      });

      showAlert({
        title: 'Gasto recorrente criado',
        message: `Será registrado todo dia ${day}.`,
        tone: 'success',
      });

      navigation.goBack();
    } catch (error) {
      showAlert({
        title: 'Não foi possível criar o gasto recorrente',
        message:
          error instanceof Error
            ? error.message
            : 'Tente novamente em instantes.',
        tone: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollScreen topInset={false}>
      <Animated.View style={headerEntrance}>
        <AppHeader
          title="Novo gasto recorrente"
          eyebrow="Automação"
          onBackPress={() => navigation.goBack()}
        />
      </Animated.View>

      <Animated.View style={formEntrance}>
        <AppText variant="screenTitle" tone="primary">
          O que se repete todo mês?
        </AppText>
        <AppText variant="bodySmall" tone="secondary" style={styles.intro}>
          Defina o valor e o dia. O Econva registra a despesa na data
          combinada, sem precisar de um banco conectado.
        </AppText>

        <Section
          title="Gasto recorrente"
          eyebrow="Automação"
          style={styles.form}
        >
          <Field
            label="Descrição"
            placeholder="Ex.: Internet"
            icon="receipt-outline"
            value={description}
            onChangeText={setDescription}
            maxLength={100}
            returnKeyType="next"
            helperText="Opcional"
          />

          <Field
            label="Valor"
            placeholder="0,00"
            icon="cash-outline"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            returnKeyType="next"
          />

          <Field
            label="Dia do mês"
            placeholder="10"
            icon="calendar-outline"
            keyboardType="number-pad"
            maxLength={2}
            value={dayOfMonth}
            onChangeText={setDayOfMonth}
            helperText="De 1 a 31"
            flush
          />
        </Section>

        <Section
          title="Categoria"
          eyebrow="Opcional"
          description="Escolha onde esta despesa deve ser contabilizada."
          style={styles.form}
        >
          <View style={styles.chips}>
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                active={categoryId === category.id}
                onPress={() =>
                  setCategoryId((current) =>
                    current === category.id ? '' : category.id,
                  )
                }
              />
            ))}
          </View>
        </Section>

        <View style={styles.tip}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={appColors.accentBright}
          />
          <AppText variant="caption" tone="secondary" style={styles.tipText}>
            Você pode excluir este gasto a qualquer momento na lista de
            recorrentes.
          </AppText>
        </View>
      </Animated.View>

      <Animated.View style={[actionEntrance, styles.action]}>
        <Button
          title={
            loading ? 'Criando gasto recorrente...' : 'Criar gasto recorrente'
          }
          onPress={handleCreate}
          loading={loading}
          size="lg"
          fullWidth
          trailingIcon={loading ? undefined : 'arrow-forward'}
        />
      </Animated.View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginTop: appSpace.xs,
    marginBottom: appSpace.xxl,
  },

  form: {
    marginBottom: appSpace.xxl,
  },

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appSpace.sm,
  },

  chip: {
    paddingHorizontal: appSpace.lg,
    height: 36,
    justifyContent: 'center',
    borderRadius: appRadius.md,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    overflow: 'hidden',
  },

  chipActive: {
    backgroundColor: appColors.accentWash,
    borderColor: appColors.borderAccentStrong,
  },

  chipContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appSpace.md,
    paddingVertical: appSpace.md,
    marginBottom: appSpace.xl,
  },

  tipText: {
    flex: 1,
  },

  action: {
    marginTop: appSpace.sm,
  },
});
