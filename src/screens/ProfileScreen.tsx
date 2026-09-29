import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { useEffect, useState } from 'react'

import { RootStackParamList } from '../navigation/AppNavigator'
import { getAccessToken } from '../api/authApi'
import { getConnections } from '../services/openFinanceService'
import { AppLoading } from '../components/AppLoading'

type ProfileNavigationProp =
  NativeStackNavigationProp<RootStackParamList>

export function ProfileScreen() {
  const navigation =
    useNavigation<ProfileNavigationProp>()

  const [connected, setConnected] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    async function checkConnection() {
      try {
        const accessToken = await getAccessToken()

        if (!accessToken) {
          return
        }

        const response =
          await getConnections(accessToken)

        setConnected(
          (response.connections ?? []).some(
            (connection: {
              status: string
            }) => connection.status === 'connected',
          ),
        )
      } catch (error) {
        console.error(
          'ERRO AO VERIFICAR CONEXÃO:',
          error,
        )
      } finally {
        setLoading(false)
      }
    }

    checkConnection()
  }, [])

  if (loading) {
    return (
      <AppLoading
        message="Carregando seu perfil"
        description="Verificando suas informações"
      />
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            SUA CONTA
          </Text>

          <Text style={styles.title}>
            Perfil
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="person-outline"
            size={22}
            color="#2563eb"
          />
        </View>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons
            name="person"
            size={25}
            color="#2563eb"
          />
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileTitle}>
            Minha conta
          </Text>

          <View style={styles.statusRow}>
            <View style={styles.statusDot} />

            <Text style={styles.profileStatus}>
              Conta autenticada
            </Text>
          </View>
        </View>

        <View style={styles.accountBadge}>
          <Text style={styles.accountBadgeText}>
            PESSOAL
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          CONTAS E INTEGRAÇÕES
        </Text>

        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            navigation.navigate('ConnectBank')
          }
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.iconContainer,
              connected &&
                styles.connectedIconContainer,
            ]}
          >
            <Ionicons
              name={
                connected
                  ? 'checkmark-circle-outline'
                  : 'card-outline'
              }
              size={22}
              color={
                connected
                  ? '#16803c'
                  : '#2563eb'
              }
            />
          </View>

          <View style={styles.optionContent}>
            <Text
              style={styles.optionTitle}
              numberOfLines={1}
            >
              {connected
                ? 'Conta bancária conectada'
                : 'Conectar conta bancária'}
            </Text>

            <Text style={styles.optionDescription}>
              {connected
                ? 'Sincronizada via Open Finance'
                : 'Sincronize suas contas e transações'}
            </Text>
          </View>

          <View style={styles.chevronContainer}>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#98a2b3"
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          SEGURANÇA
        </Text>

        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={21}
              color="#2563eb"
            />
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Dados protegidos
            </Text>

            <Text style={styles.securityDescription}>
              Sua sessão é protegida por autenticação
              segura.
            </Text>
          </View>

          <View style={styles.securityStatus}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#16a34a"
            />
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={19}
            color="#2563eb"
          />
        </View>

        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>
            Privacidade em primeiro lugar
          </Text>

          <Text style={styles.infoDescription}>
            Seus dados financeiros são utilizados
            apenas para organizar sua vida financeira.
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 58,
    backgroundColor: '#f5f7fb',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#98a2b3',
    marginBottom: 5,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#101828',
    letterSpacing: -0.6,
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf2ff',
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#edf0f5',
    marginBottom: 30,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf2ff',
    marginRight: 15,
  },

  profileInfo: {
    flex: 1,
    minWidth: 0,
  },

  profileTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 6,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginRight: 6,
  },

  profileStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#667085',
  },

  accountBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: '#f5f7fb',
  },

  accountBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: '#98a2b3',
  },

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#98a2b3',
    marginBottom: 10,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#edf0f5',
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf2ff',
    marginRight: 13,
  },

  connectedIconContainer: {
    backgroundColor: '#eaf7ef',
  },

  optionContent: {
    flex: 1,
    minWidth: 0,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#101828',
    flexShrink: 1,
  },

  optionDescription: {
    marginTop: 5,
    fontSize: 12,
    color: '#98a2b3',
    lineHeight: 17,
  },

  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f7fb',
    marginLeft: 8,
  },

  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#edf0f5',
  },

  securityIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf2ff',
    marginRight: 12,
  },

  securityContent: {
    flex: 1,
    minWidth: 0,
  },

  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 4,
  },

  securityDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: '#98a2b3',
  },

  securityStatus: {
    marginLeft: 8,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#eaf2ff',
    borderWidth: 1,
    borderColor: '#dce9ff',
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 3,
  },

  infoDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: '#667085',
  },
})