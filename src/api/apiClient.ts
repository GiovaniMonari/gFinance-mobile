import { getAccessToken } from './authApi'

// The deployed host is a fixed Railway subdomain — it is infrastructure, not
// branding, so it stays `gfinance` no matter what the product is called.
const API_URL = 'https://gfinance-production-d5a6.up.railway.app'

/**
 * The only two endpoints that decide whether the account exists. They must not
 * ask for it themselves — that would recurse — while every other read in this
 * API resolves `financeId` first and answers 404 when the row is missing.
 */
const ACCOUNT_ENDPOINTS = new Set(['/finances', '/finances/get'])

async function request(
  endpoint: string,
  options: RequestInit = {},
) {
  const token = await getAccessToken()

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // A missing token must not leave as the literal string "null": that
      // presents itself as a malformed credential instead of a client that
      // simply has no session, and it hides the real reason behind the 401.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)

    throw new Error(
      data?.message || 'Erro ao realizar requisição.',
    )
  }

  // Read as text first: this API answers `null` with an empty body rather
  // than the four characters `null` (NestJS sends nothing when a handler
  // returns a nil value), and `response.json()` would throw on it. Same
  // handling the web client uses for the same endpoints.
  const body = await response.text()

  return body.trim() ? JSON.parse(body) : null
}

let account: Promise<unknown> | null = null

/**
 * Make sure the user's finance account exists before anything reads it.
 *
 * The account row is created by one explicit `POST /finances` and by nothing
 * else — registering creates only the user, and reading returns `null` rather
 * than creating one. The web client performs this same get-then-create on
 * boot; the phone never issued that call, so a brand-new account failed on
 * every endpoint scoped by the account it did not have: categories, goals and
 * transaction writes all answered 404 "Conta não encontrada para o usuário"
 * against a perfectly valid session.
 *
 * One shared promise, so concurrent screen loads share a single round trip and
 * the upsert inside cannot be raced into a duplicate-key error by two
 * first-loads landing together.
 *
 * Never fatal on its own: if bootstrap fails the caller's original request
 * still runs and reports its own error, rather than this one.
 */
export function ensureFinanceAccount(): Promise<unknown> {
  if (!account) {
    const bootstrap = (async () => {
      const existing = await request('/finances/get', {
        method: 'POST',
      })

      if (existing) return existing

      return request('/finances', { method: 'POST' })
    })()

    account = bootstrap

    // Releases the slot so a later focus can try again — and, by handling it
    // here, keeps a failed bootstrap from surfacing as an unhandled rejection.
    bootstrap.catch(() => {
      if (account === bootstrap) account = null
    })
  }

  return account
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
) {
  if (!ACCOUNT_ENDPOINTS.has(endpoint)) {
    await ensureFinanceAccount().catch(() => undefined)
  }

  return request(endpoint, options)
}
