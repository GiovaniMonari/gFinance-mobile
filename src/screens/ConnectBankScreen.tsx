import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PluggyConnect } from 'react-native-pluggy-connect'

import {
  createConnectToken,
  connectBank,
  getConnections,
  getAccounts,
  getTransactions,
} from '../services/openFinanceService'

import { getAccessToken } from '../api/authApi'
import { AppLoading } from '../components/AppLoading'

type BankAccount = {
  id: string
  type: string
  subtype: string
  name: string | null
  balance: number | null
  currency_code: string | null
  marketing_name: string | null
  bank: {
    name: string | null
    transfer_number: string | null
  } | null
  credit: {
    brand: string | null
    available_credit_limit: number | null
    credit_limit: number | null
    minimum_payment: number | null
    balance_due_date: string | null
    status: string | null
  } | null
}

type Transaction = {
  id: string
  description: string
  amount: number
  date: string
  category: string | null
  type: 'DEBIT' | 'CREDIT'
  status: string
}

type Connection = {
  id: string
  provider: string
  status: string
  external_id: string
  user_id: string
}

export function ConnectBankScreen() {
  const [connectToken, setConnectToken] =
    useState<string | null>(null)

  const [loading, setLoading] = useState(false)

  const [connections, setConnections] =
    useState<Connection[]>([])

  const [accounts, setAccounts] =
    useState<BankAccount[]>([])

  const [transactions, setTransactions] =
    useState<Transaction[]>([])

  const [initialLoading, setInitialLoading] =
    useState(true)

  useEffect(() => {
    loadConnections()
  }, [])

  async function loadConnections() {
    try {
      setInitialLoading(true)

      const accessToken = await getAccessToken()

      if (!accessToken) {
        return
      }

      const response =
        await getConnections(accessToken)

      const loadedConnections =
        response.connections ?? []

      const latestConnection =
        loadedConnections.length > 0
          ? [loadedConnections[0]]
          : []

      setConnections(latestConnection)

      if (loadedConnections.length === 0) {
        return
      }

      const connectionId =
        loadedConnections[0].id

      const accountsResponse =
        await getAccounts(
          accessToken,
          connectionId,
        )

      const loadedAccounts =
        accountsResponse.accounts ?? []

      setAccounts(loadedAccounts)

      const account = loadedAccounts[0]

      if (!account) {
        return
      }

      const transactionsResponse =
        await getTransactions(
          accessToken,
          connectionId,
          account.id,
        )

      setTransactions(
        transactionsResponse.transactions ?? [],
      )
    } catch (error) {
      console.error(
        'ERRO AO CARREGAR CONEXÕES:',
        error,
      )
    } finally {
      setInitialLoading(false)
    }
  }

  async function handleConnectBank() {
    try {
      setLoading(true)

      const accessToken =
        await getAccessToken()

      if (!accessToken) {
        Alert.alert(
          'Sessão expirada',
          'Faça login novamente para conectar sua conta bancária.',
        )

        return
      }

      const response =
        await createConnectToken(accessToken)

      setConnectToken(
        response.connect_token,
      )
    } catch (error) {
      console.error(error)

      Alert.alert(
        'Erro',
        error instanceof Error
          ? error.message
          : 'Não foi possível iniciar a conexão bancária.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleConnectionSuccess(
    data: {
      item: {
        id: string
      }
    },
  ) {
    try {
      const accessToken =
        await getAccessToken()

      if (!accessToken) {
        throw new Error('Sessão expirada')
      }

      await connectBank(
        accessToken,
        data.item.id,
      )

      await loadConnections()

      Alert.alert(
        'Banco conectado',
        'Sua conta foi conectada com sucesso.',
      )

      setConnectToken(null)
    } catch (error) {
      console.error(
        'ERRO AO SALVAR CONEXÃO:',
        error,
      )

      Alert.alert(
        'Erro',
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a conexão.',
      )
    }
  }

  function formatCurrency(
    value: number | null,
  ) {
    if (value === null) {
      return 'Saldo indisponível'
    }

    return value.toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL',
      },
    )
  }

  function getAccountType(
    account: BankAccount,
  ) {
    if (account.credit) {
      return 'Cartão de crédito'
    }

    const subtype =
      account.subtype?.toLowerCase()

    const types: Record<string, string> = {
      checking_account: 'Conta corrente',
      savings_account: 'Conta poupança',
      investment_account: 'Investimentos',
      credit_card: 'Cartão de crédito',
    }

    return (
      types[subtype] ||
      (account.type?.toLowerCase() === 'bank'
        ? 'Conta bancária'
        : 'Conta')
    )
  }

  if (initialLoading) {
    return (
      <AppLoading
        message="Carregando sua conta"
        description="Buscando suas conexões bancárias"
      />
    )
  }

  if (connectToken) {
    return (
      <View style={styles.pluggyContainer}>
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={true}
          language="pt"
          onSuccess={handleConnectionSuccess}
          onClose={() => {
            setConnectToken(null)
          }}
          onError={(error) => {
            console.error(
              'PLUGGY ERROR:',
              error,
            )

            Alert.alert(
              'Erro',
              'Não foi possível conectar o banco.',
            )

            setConnectToken(null)
          }}
        />
      </View>
    )
  }

  const bankName =
    accounts[0]?.bank?.name ||
    'Banco conectado'

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View
            style={styles.headerTextContainer}
          >
            <Text style={styles.eyebrow}>
              OPEN FINANCE
            </Text>

            <Text style={styles.title}>
              Conta bancária
            </Text>

            <Text style={styles.subtitle}>
              Gerencie suas conexões e acompanhe
              seus dados financeiros.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="business-outline"
              size={23}
              color="#2563eb"
            />
          </View>
        </View>

        {connections.length > 0 ? (
          <>
            {/* CONNECTION STATUS */}
            <View style={styles.statusCard}>
              <View style={styles.statusIcon}>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="#16803c"
                />
              </View>

              <View
                style={styles.statusContent}
              >
                <Text
                  style={styles.statusEyebrow}
                >
                  CONEXÃO
                </Text>

                <Text
                  style={styles.statusTitle}
                  numberOfLines={1}
                >
                  {bankName}
                </Text>

                <View
                  style={styles.activeRow}
                >
                  <View
                    style={styles.activeDot}
                  />

                  <Text
                    style={styles.activeText}
                  >
                    Conexão ativa
                  </Text>
                </View>
              </View>

              <View
                style={styles.connectedBadge}
              >
                <Text
                  style={styles.connectedText}
                >
                  Ativa
                </Text>
              </View>
            </View>

            {/* ACCOUNTS */}
            {accounts.length > 0 && (
              <View style={styles.section}>
                <View
                  style={styles.sectionHeader}
                >
                  <View>
                    <Text
                      style={styles.sectionEyebrow}
                    >
                      VISÃO GERAL
                    </Text>

                    <Text
                      style={styles.sectionTitle}
                    >
                      Suas contas
                    </Text>
                  </View>

                  <View
                    style={styles.countBadge}
                  >
                    <Text
                      style={styles.countText}
                    >
                      {accounts.length}
                    </Text>
                  </View>
                </View>

                {accounts.map((account) => {
                  const isCreditCard =
                    !!account.credit

                  return (
                    <View
                      key={account.id}
                      style={styles.accountCard}
                    >
                      {/* ACCOUNT HEADER */}
                      <View
                        style={
                          styles.accountHeader
                        }
                      >
                        <View
                          style={
                            styles.accountIcon
                          }
                        >
                          <Ionicons
                            name={
                              isCreditCard
                                ? 'card-outline'
                                : 'wallet-outline'
                            }
                            size={21}
                            color="#2563eb"
                          />
                        </View>

                        <View
                          style={
                            styles.accountHeaderContent
                          }
                        >
                          <Text
                            style={
                              styles.accountName
                            }
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {account.name ||
                              'Conta bancária'}
                          </Text>

                          <Text
                            style={
                              styles.accountType
                            }
                          >
                            {getAccountType(
                              account,
                            )}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.accountArrow
                          }
                        >
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#98a2b3"
                          />
                        </View>
                      </View>

                      {/* BALANCE */}
                      <View
                        style={
                          styles.balanceContainer
                        }
                      >
                        <Text
                          style={
                            styles.balanceLabel
                          }
                        >
                          {isCreditCard
                            ? 'Fatura atual'
                            : 'Saldo disponível'}
                        </Text>

                        <Text
                          style={styles.balance}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {formatCurrency(
                            account.balance,
                          )}
                        </Text>
                      </View>

                      {/* CREDIT DETAILS */}
                      {isCreditCard &&
                        account.credit && (
                          <View
                            style={
                              styles.creditDetails
                            }
                          >
                            {account.credit
                              .credit_limit !==
                              null && (
                              <View
                                style={
                                  styles.creditRow
                                }
                              >
                                <View
                                  style={
                                    styles.creditLabelContainer
                                  }
                                >
                                  <Ionicons
                                    name="speedometer-outline"
                                    size={15}
                                    color="#98a2b3"
                                  />

                                  <Text
                                    style={
                                      styles.creditLabel
                                    }
                                  >
                                    Limite
                                  </Text>
                                </View>

                                <Text
                                  style={
                                    styles.creditValue
                                  }
                                >
                                  {formatCurrency(
                                    account.credit
                                      .credit_limit,
                                  )}
                                </Text>
                              </View>
                            )}

                            {account.credit
                              .available_credit_limit !==
                              null && (
                              <View
                                style={
                                  styles.creditRow
                                }
                              >
                                <View
                                  style={
                                    styles.creditLabelContainer
                                  }
                                >
                                  <Ionicons
                                    name="wallet-outline"
                                    size={15}
                                    color="#98a2b3"
                                  />

                                  <Text
                                    style={
                                      styles.creditLabel
                                    }
                                  >
                                    Disponível
                                  </Text>
                                </View>

                                <Text
                                  style={
                                    styles.creditValue
                                  }
                                >
                                  {formatCurrency(
                                    account.credit
                                      .available_credit_limit,
                                  )}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                    </View>
                  )
                })}
              </View>
            )}

            {/* SECURITY */}
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#2563eb"
                />
              </View>

              <View
                style={styles.infoContent}
              >
                <Text
                  style={styles.infoEyebrow}
                >
                  SEGURANÇA
                </Text>

                <Text
                  style={styles.infoTitle}
                >
                  Seus dados estão protegidos
                </Text>

                <Text style={styles.infoText}>
                  Sua conexão é realizada de forma
                  segura através do Open Finance.
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* EMPTY STATE */}
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconOuter}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="link-outline"
                    size={28}
                    color="#2563eb"
                  />
                </View>
              </View>

              <Text
                style={styles.emptyEyebrow}
              >
                PRIMEIRO PASSO
              </Text>

              <Text
                style={styles.emptyTitle}
              >
                Conecte sua conta bancária
              </Text>

              <Text style={styles.emptyText}>
                Sincronize suas contas e transações
                automaticamente com o gFinance.
              </Text>

              <TouchableOpacity
                style={[
                  styles.button,
                  loading &&
                    styles.buttonLoading,
                ]}
                onPress={handleConnectBank}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <>
                    <ActivityIndicator
                      color="#ffffff"
                      size="small"
                    />

                    <Text
                      style={styles.buttonText}
                    >
                      Preparando conexão...
                    </Text>
                  </>
                ) : (
                  <>
                    <View
                      style={styles.buttonIcon}
                    >
                      <Ionicons
                        name="link-outline"
                        size={17}
                        color="#ffffff"
                      />
                    </View>

                    <Text
                      style={styles.buttonText}
                    >
                      Conectar minha conta
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

            {/* SECURITY */}
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#2563eb"
                />
              </View>

              <View
                style={styles.infoContent}
              >
                <Text
                  style={styles.infoEyebrow}
                >
                  SEGURANÇA
                </Text>

                <Text
                  style={styles.infoTitle}
                >
                  Conexão segura
                </Text>

                <Text style={styles.infoText}>
                  O acesso é realizado através do
                  Open Finance. Você não precisa
                  compartilhar sua senha bancária
                  com o gFinance.
                </Text>
              </View>
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

  pluggyContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 120,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
    paddingRight: 16,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#2563eb',
    marginBottom: 5,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#101828',
  },

  subtitle: {
    marginTop: 6,
    maxWidth: 310,
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* CONNECTION */

  statusCard: {
    minHeight: 82,
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eaf7ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  statusContent: {
    flex: 1,
    minWidth: 0,
  },

  statusEyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#98a2b3',
    marginBottom: 3,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101828',
  },

  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginRight: 5,
  },

  activeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16803c',
  },

  connectedBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: '#eaf7ef',
    marginLeft: 8,
  },

  connectedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16803c',
  },

  /* SECTION */

  section: {
    marginTop: 26,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#98a2b3',
    marginBottom: 3,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#101828',
  },

  countBadge: {
    minWidth: 30,
    height: 28,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
  },

  /* ACCOUNT */

  accountCard: {
    padding: 18,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eaecf0',
    marginBottom: 12,
  },

  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  accountHeaderContent: {
    flex: 1,
    minWidth: 0,
  },

  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#101828',
  },

  accountType: {
    marginTop: 4,
    fontSize: 11,
    color: '#667085',
  },

  accountArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#f5f7fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  balanceContainer: {
    marginTop: 22,
  },

  balanceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#98a2b3',
  },

  balance: {
    marginTop: 4,
    maxWidth: '100%',
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
    color: '#101828',
  },

  /* CREDIT */

  creditDetails: {
    marginTop: 17,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
  },

  creditRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  creditLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  creditLabel: {
    fontSize: 11,
    color: '#667085',
  },

  creditValue: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#344054',
    textAlign: 'right',
  },

  /* SECURITY */

  infoCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eaecf0',
    flexDirection: 'row',
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  infoEyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#2563eb',
    marginBottom: 3,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#101828',
  },

  infoText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: '#667085',
  },

  /* EMPTY */

  emptyCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eaecf0',
    alignItems: 'center',
  },

  emptyIconOuter: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: '#f4f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#2563eb',
    marginBottom: 6,
  },

  emptyTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: '#101828',
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 8,
    maxWidth: 300,
    fontSize: 13,
    lineHeight: 20,
    color: '#667085',
    textAlign: 'center',
  },

  /* BUTTON */

  button: {
    width: '100%',
    minHeight: 54,
    marginTop: 22,
    paddingHorizontal: 15,
    borderRadius: 16,
    backgroundColor: '#101828',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  buttonLoading: {
    opacity: 0.8,
  },

  buttonIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
})