/**
 * Econva — Create Goal
 *
 * A focused product form. It borrows the language of the authentication
 * experience — the same field system, the same focus state, the same action
 * weight — and adapts it to an authenticated context: no illustration, no
 * long explanation, just a title, three fields and a commitment.
 *
 * Parsing, validation, the API call and navigation are unchanged.
 */

import { useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createGoal } from '../api/goalApi';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { appColors, appSpace, appMotion } from '../theme/app';
import { Button, Field, useEntrance } from '../components/ui';
import {
  AppHeader,
  AppText,
  ScrollScreen,
  Section,
  showAlert,
} from '../components/app';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateGoal'>;

export function CreateGoalScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const headerEntrance = useEntrance();
  const formEntrance = useEntrance({ delay: appMotion.stagger });
  const actionEntrance = useEntrance({ delay: appMotion.stagger * 2 });

  function parseAmount(value: string) {
    const normalized = value.replace(/\./g, '').replace(',', '.');
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : 0;
  }

  function formatDateToIso(value: string) {
    if (!value.trim()) return undefined;
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, day, month, year] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day)
    ) {
      return null;
    }
    return date.toISOString();
  }

  async function handleCreate() {
    const trimmedName = name.trim();
    const amount = parseAmount(targetAmount);

    if (!trimmedName) {
      showAlert({
        title: 'Nome da meta',
        message: 'Digite um nome para sua meta.',
        tone: 'warning',
      });
      return;
    }
    if (amount <= 0) {
      showAlert({
        title: 'Valor inválido',
        message: 'Digite um valor maior que zero.',
        tone: 'warning',
      });
      return;
    }

    const formattedDeadline = formatDateToIso(deadline);
    if (formattedDeadline === null) {
      showAlert({
        title: 'Data inválida',
        message: 'Informe a data no formato DD/MM/AAAA.',
        tone: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      const goal = await createGoal({
        name: trimmedName,
        targetAmount: amount,
        ...(formattedDeadline ? { deadline: formattedDeadline } : {}),
      });
      navigation.replace('GoalDetails', { goalId: goal.id });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível criar sua meta.';
      showAlert({ title: 'Não foi possível criar a meta', message, tone: 'danger' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollScreen topInset={false}>
      <Animated.View style={headerEntrance}>
        <AppHeader
          title="Nova meta"
          eyebrow="Planejamento"
          onBackPress={() => navigation.goBack()}
        />
      </Animated.View>

      <Animated.View style={formEntrance}>
        <AppText variant="screenTitle" tone="primary">
          Dê um objetivo ao seu dinheiro
        </AppText>
        <AppText variant="bodySmall" tone="secondary" style={styles.intro}>
          Defina quanto você quer alcançar e acompanhe seu progresso ao longo do
          tempo.
        </AppText>

        <Section title="Sua meta" eyebrow="Objetivo" style={styles.form}>
          <Field
            label="Nome da meta"
            placeholder="Ex.: Reserva de emergência"
            icon="flag-outline"
            value={name}
            onChangeText={setName}
            maxLength={60}
            returnKeyType="next"
          />

          <Field
            label="Valor desejado"
            placeholder="0,00"
            icon="cash-outline"
            keyboardType="decimal-pad"
            value={targetAmount}
            onChangeText={setTargetAmount}
            returnKeyType="next"
          />

          <Field
            label="Prazo"
            placeholder="DD/MM/AAAA"
            icon="calendar-outline"
            keyboardType="number-pad"
            maxLength={10}
            value={deadline}
            onChangeText={setDeadline}
            helperText="Opcional"
            flush
          />
        </Section>

        <View style={styles.tip}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={appColors.accentBright}
          />
          <AppText variant="caption" tone="secondary" style={styles.tipText}>
            Você poderá adicionar ou retirar valores da meta depois que ela for
            criada.
          </AppText>
        </View>
      </Animated.View>

      <Animated.View style={[actionEntrance, styles.action]}>
        <Button
          title={loading ? 'Criando meta...' : 'Criar meta'}
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
    marginBottom: appSpace.xl,
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
