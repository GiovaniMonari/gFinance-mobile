import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { createGoal } from '../api/goalApi'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'

type Props = NativeStackScreenProps<
  RootStackParamList,
  'CreateGoal'
>

export function CreateGoalScreen({
  navigation,
}: Props) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)

  function parseAmount(value: string) {
    const normalized = value
      .replace(/\./g, '')
      .replace(',', '.')

    const amount = Number(normalized)

    return Number.isFinite(amount) ? amount : 0
  }

  function formatDateToIso(value: string) {
    if (!value.trim()) {
      return undefined
    }

    const match = value.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/,
    )

    if (!match) {
      return null
    }

    const [, day, month, year] = match

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    )

    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day)
    ) {
      return null
    }

    return date.toISOString()
  }

  async function handleCreate() {
    const trimmedName = name.trim()
    const amount = parseAmount(targetAmount)

    if (!trimmedName) {
      Alert.alert(
        'Nome da meta',
        'Digite um nome para sua meta.',
      )
      return
    }

    if (amount <= 0) {
      Alert.alert(
        'Valor inválido',
        'Digite um valor maior que zero.',
      )
      return
    }

    const formattedDeadline = formatDateToIso(deadline)

    if (formattedDeadline === null) {
      Alert.alert(
        'Data inválida',
        'Informe a data no formato DD/MM/AAAA.',
      )
      return
    }

    try {
      setLoading(true)

      const goal = await createGoal({
        name: trimmedName,
        targetAmount: amount,
        ...(formattedDeadline
          ? { deadline: formattedDeadline }
          : {}),
      })

      navigation.replace('GoalDetails', {
        goalId: goal.id,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível criar sua meta.'

      Alert.alert('Não foi possível criar a meta', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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

          <View>
            <Text style={styles.eyebrow}>
              PLANEJAMENTO
            </Text>

            <Text style={styles.title}>
              Nova meta
            </Text>
          </View>
        </View>

        <View style={styles.intro}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="flag"
              size={25}
              color="#2563eb"
            />
          </View>

          <Text style={styles.introTitle}>
            Dê um objetivo ao seu dinheiro
          </Text>

          <Text style={styles.introDescription}>
            Defina quanto você quer alcançar e acompanhe
            seu progresso ao longo do tempo.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>
              Nome da meta
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex.: Reserva de emergência"
              placeholderTextColor="#98a2b3"
              style={styles.input}
              maxLength={60}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Valor desejado
            </Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.prefix}>
                R$
              </Text>

              <TextInput
                value={targetAmount}
                onChangeText={setTargetAmount}
                placeholder="0,00"
                placeholderTextColor="#98a2b3"
                style={[
                  styles.input,
                  styles.amountInput,
                ]}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                Prazo
              </Text>

              <Text style={styles.optional}>
                Opcional
              </Text>
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="calendar-outline"
                size={19}
                color="#98a2b3"
                style={styles.inputIcon}
              />

              <TextInput
                value={deadline}
                onChangeText={setDeadline}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#98a2b3"
                style={[
                  styles.input,
                  styles.dateInput,
                ]}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>
        </View>

        <View style={styles.tip}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color="#2563eb"
          />

          <Text style={styles.tipText}>
            Você poderá adicionar ou retirar valores da
            meta depois que ela for criada.
          </Text>
        </View>

        <Pressable
          onPress={handleCreate}
          disabled={loading}
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
        >
          {loading ? (
            <Text style={styles.buttonText}>
              Criando meta...
            </Text>
          ) : (
            <>
              <Text style={styles.buttonText}>
                Criar meta
              </Text>

              <Ionicons
                name="arrow-forward"
                size={19}
                color="#ffffff"
              />
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 58,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 34,
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

  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#98a2b3',
    marginBottom: 3,
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#101828',
  },

  intro: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#eaecf0',
    marginBottom: 22,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  introTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 7,
  },

  introDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: '#667085',
  },

  form: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eaecf0',
    gap: 21,
  },

  field: {
    gap: 8,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#344054',
  },

  optional: {
    fontSize: 11,
    color: '#98a2b3',
    fontWeight: '600',
  },

  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#101828',
  },

  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },

  prefix: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#667085',
  },

  amountInput: {
    flex: 1,
    paddingLeft: 42,
  },

  inputIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },

  dateInput: {
    flex: 1,
    paddingLeft: 44,
  },

  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#eaf2ff',
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    marginBottom: 20,
  },

  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#475467',
  },

  button: {
    height: 56,
    borderRadius: 17,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
})