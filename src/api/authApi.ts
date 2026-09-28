import * as SecureStore from 'expo-secure-store'

const API_URL = 'https://gfinance-production-d5a6.up.railway.app'

export async function login(
  email: string,
  password: string,
) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.message || 'Email ou senha inválidos',
    )
  }

  await SecureStore.setItemAsync(
    'gfinance_access_token',
    data.access_token,
  )

  return data.access_token
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(
    'gfinance_access_token',
  )
}