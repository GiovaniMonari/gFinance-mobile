import { getAccessToken } from './authApi'

const API_URL = 'https://gfinance-production-d5a6.up.railway.app'

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
) {
  const token = await getAccessToken()

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)

    throw new Error(
      data?.message || 'Erro ao realizar requisição.',
    )
  }

  return response.json()
}