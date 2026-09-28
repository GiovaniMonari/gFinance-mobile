import { apiRequest } from './apiClient'

export interface ConnectTokenResponse {
  status: string
  connect_token: string
}

export async function createConnectToken(): Promise<ConnectTokenResponse> {
  return apiRequest('/open-finance/connect-token', {
    method: 'POST',
  })
}

export async function connectPluggy(itemId: string) {
  return apiRequest('/open-finance/connect', {
    method: 'POST',
    body: JSON.stringify({
      item_id: itemId,
    }),
  })
}