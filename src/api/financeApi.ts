import { apiRequest } from './apiClient'
import type { Finance } from '../types/finance'

export async function getFinance(): Promise<Finance> {
  return apiRequest('/finances/get', {
    method: 'POST',
  })
}