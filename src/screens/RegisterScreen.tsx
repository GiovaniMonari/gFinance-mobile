
import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

import logo from '../../assets/logogFinance.png'
import { RootStackParamList } from '../navigation/AppNavigator'
import { register } from '../api/authApi'

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Register'
>

export function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  async function handleRegister() {
    const cleanName = name.trim()
    const cleanEmail = email.trim()

    if (
        !cleanName ||
        !cleanEmail ||
        !password ||
        !confirmPassword
    ) {
        Alert.alert(
        'Atenção',
        'Preencha todos os campos.',
        )
        return
    }

    if (password.length < 6) {
        Alert.alert(
        'Senha inválida',
        'A senha deve ter pelo menos 6 caracteres.',
        )
        return
    }

    if (password !== confirmPassword) {
        Alert.alert(
        'Senhas diferentes',
        'A confirmação da senha não corresponde à senha informada.',
        )
        return
    }

    try {
        setLoading(true)

        await register(
        cleanEmail,
        password,
        )

        Alert.alert(
        'Conta criada',
        'Sua conta foi criada com sucesso. Agora você já pode entrar.',
        [
            {
            text: 'Entrar',
            onPress: () => navigation.replace('Login'),
            },
        ],
        )
    } catch (error) {
        Alert.alert(
        'Não foi possível criar sua conta',
        error instanceof Error
            ? error.message
            : 'Tente novamente em alguns instantes.',
        )
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
        {/* HEADER */}

        <View style={styles.header}>
          <Image
            source={logo}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.subtitle}>
            Comece a organizar sua vida financeira.
          </Text>

          <View style={styles.headerAccent}>
            <View style={styles.accentDot} />

            <Text style={styles.accentText}>
              gFinance V2
            </Text>
          </View>
        </View>

        {/* REGISTER CARD */}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderContent}>
              <Text style={styles.cardTitle}>
                Crie sua conta
              </Text>

              <Text style={styles.cardSubtitle}>
                Preencha seus dados para começar.
              </Text>
            </View>

            <View style={styles.cardIcon}>
              <Ionicons
                name="person-add-outline"
                size={18}
                color="#2563eb"
              />
            </View>
          </View>

          <View style={styles.form}>
            {/* E-MAIL */}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                E-mail
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color="#98a2b3"
                />

                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#98a2b3"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>
            </View>

            {/* SENHA */}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Senha
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#98a2b3"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Crie uma senha"
                  placeholderTextColor="#98a2b3"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowPassword((value) => !value)
                  }
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      showPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={19}
                    color="#98a2b3"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* CONFIRMAR SENHA */}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Confirmar senha
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color="#98a2b3"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Digite a senha novamente"
                  placeholderTextColor="#98a2b3"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword(
                      (value) => !value,
                    )
                  }
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      showConfirmPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={19}
                    color="#98a2b3"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* BUTTON */}

            <TouchableOpacity
              style={[
                styles.button,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <Text style={styles.buttonText}>
                  Criando conta...
                </Text>
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    Criar conta
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#ffffff"
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Já possui uma conta?
          </Text>

          <TouchableOpacity
            onPress={() => navigation.replace('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.registerText}>
              Entrar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 34,
  },

  /* HEADER */

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },

  logo: {
    width: 300,
    height: 120,
    alignSelf: 'center',
  },

  subtitle: {
    marginTop: 8,

    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',

    color: '#667085',
    textAlign: 'center',
  },

  headerAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,

    marginTop: 14,
  },

  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563eb',
  },

  accentText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: '#2563eb',
  },

  /* CARD */

  card: {
    width: '100%',
    padding: 24,

    borderRadius: 20,
    backgroundColor: '#ffffff',

    borderWidth: 1,
    borderColor: '#eaecf0',

    shadowColor: '#101828',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',

    marginBottom: 26,
  },

  cardHeaderContent: {
    flex: 1,
    paddingRight: 16,
  },

  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.45,
    color: '#101828',
  },

  cardSubtitle: {
    marginTop: 5,

    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
  },

  cardIcon: {
    width: 36,
    height: 36,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 11,
    backgroundColor: '#eff6ff',
  },

  /* FORM */

  form: {
    width: '100%',
  },

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    marginBottom: 8,

    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',

    color: '#344054',
  },

  inputContainer: {
    height: 52,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 14,

    borderRadius: 12,
    backgroundColor: '#ffffff',

    borderWidth: 1,
    borderColor: '#d0d5dd',
  },

  input: {
    flex: 1,
    minWidth: 0,

    height: '100%',
    marginLeft: 10,

    paddingVertical: 0,

    fontSize: 15,
    color: '#101828',
  },

  button: {
    height: 52,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 9,
    marginTop: 6,

    borderRadius: 12,
    backgroundColor: '#2563eb',

    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: '#ffffff',
  },

  /* FOOTER */

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 4,
    marginTop: 24,
  },

  footerText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#667085',
  },

  registerText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#2563eb',
  },
})