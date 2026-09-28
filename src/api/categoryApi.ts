import { apiRequest } from './apiClient'

export type Category = {
  id: string
  name: string
}

export async function getCategories(): Promise<Category[]> {
  return apiRequest('/categories', {
    method: 'GET',
  })
}