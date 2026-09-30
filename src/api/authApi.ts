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

export type UserProfile = {
  id: string
  email: string
}

/**
 * The signed-in user's own profile.
 *
 * The identity is resolved server-side from the verified token and no user id
 * is ever sent from here, so there is no parameter in which to name somebody
 * else: the only profile this can answer for is the caller's.
 */
export async function getProfile(): Promise<UserProfile> {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const response = await fetch(`${API_URL}/users/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  // `.json()` over a non-JSON body must not report a parse error as the
  // reason a profile could not be read.
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      data?.message || 'Não foi possível carregar seu perfil.',
    )
  }

  // Only what the screen renders. Anything else the payload carries stays on
  // the wire instead of reaching component state.
  if (typeof data?.id !== 'string' || typeof data?.email !== 'string') {
    throw new Error('Não foi possível carregar seu perfil.')
  }

  return {
    id: data.id,
    email: data.email,
  }
}

/**
 * End the Econva session — and nothing else.
 *
 * The stored token is the only thing dropped. The Open Finance link is a
 * separate, revocable relationship: signing out is not a way to sever it, and
 * disconnecting is not a way to sign out. One never stands in for the other.
 */
export async function logout() {
  await SecureStore.deleteItemAsync(
    // Storage key, not branding: this is the session every install already
    // holds under this exact name, so changing it silently signs every user
    // out.
    'gfinance_access_token',
  )
}