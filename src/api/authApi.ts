import * as SecureStore from 'expo-secure-store'

// Fixed Railway host — infrastructure, not branding. Renaming this breaks
// login and register.
const API_URL =
  'https://gfinance-production-d5a6.up.railway.app'

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
    // Storage key, not branding: every install already holds the session under
    // this exact name, so changing it silently signs every user out.
    'gfinance_access_token',
    data.access_token,
  )

  return data.access_token
}

export async function register(
  email: string,
  password: string,
) {
  const response = await fetch(`${API_URL}/auth/register`, {
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
      Array.isArray(data.message)
        ? data.message.join('\n')
        : data.message || 'Não foi possível criar sua conta.',
    )
  }

  return data
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(
    // Storage key, not branding: every install already holds the session under
    // this exact name, so changing it silently signs every user out.
    'gfinance_access_token',
  )
}