import * as SecureStore from 'expo-secure-store'
import { API_URL } from './serverConfig'

/**
 * Deadline for the password-reset request. See `requestPasswordReset`: this
 * is the guarantee the promise settles, not a performance tweak.
 */
const REQUEST_TIMEOUT_MS = 30_000

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

/**
 * Ask the backend to send password-reset instructions to this address.
 *
 * The reset form itself lives on the web application — the email carries the
 * link there. This call only starts that flow, so there is no token handling
 * and no password handling on this side.
 *
 * The response is treated as opaque on purpose: when the backend answers with
 * a generic confirmation regardless of registration, repeating a different
 * sentence here would reintroduce the account-enumeration signal the backend
 * removed. Callers show their own generic confirmation copy.
 */
export async function requestPasswordReset(email: string) {
  // Bare `fetch` has no deadline: against a stalled server or a dead route
  // (a DHCP-rotated LAN IP, a captive portal, a half-open socket) the promise
  // simply pends forever and every `await` on it — including the screen's
  // `finally { setLoading(false) }` — never runs. The abort below is the
  // guarantee that this promise always settles, so the loading state always
  // clears. Thirty seconds is long enough for a cold backend to answer and
  // short enough that a stuck request surfaces as an error, never a spinner.
  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  )

  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
      }),
      signal: controller.signal,
    })

    // Read as text first: the endpoint may answer with an empty body, and
    // `response.json()` would throw on it — the same handling `apiClient`
    // uses for the same reason.
    const text = await response.text()

    let data: { message?: unknown } | null = null

    if (text.trim()) {
      try {
        data = JSON.parse(text) as { message?: unknown }
      } catch {
        data = null
      }
    }

    if (!response.ok) {
      throw new Error(
        (data && typeof data.message === 'string' && data.message) ||
          'Não foi possível solicitar a redefinição. Tente novamente em instantes.',
      )
    }

    return data
  } catch (error) {
    // Name check, not `instanceof DOMException`: the abort reason surfaces
    // with this name on every runtime, including Hermes.
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'O servidor demorou a responder. Verifique sua conexão e tente novamente.',
      )
    }

    // Unreachable host, DNS failure, refused connection: `fetch` rejects with
    // a TypeError whose message is a runtime string ("Network request
    // failed"), not something to show the reader.
    if (error instanceof TypeError) {
      throw new Error(
        'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
      )
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
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