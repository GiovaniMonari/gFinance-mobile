import { apiRequest } from './apiClient'
import type { Transaction } from '../types/transaction'

export type CreateTransactionData = {
  amount: number
  transactionType: 'INCOME' | 'EXPENSE' | 'DEPOSIT'
  description?: string
  categoryId?: string
}

export async function getTransactions(): Promise<Transaction[]> {
  return apiRequest('/finances/transactions', {
    method: 'POST',
  })
}

export async function createTransaction(
  data: CreateTransactionData,
): Promise<Transaction> {
  return apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getTransactionById(
  id: string,
): Promise<Transaction> {
  return apiRequest(`/transactions/${id}`, {
    method: 'GET',
  })
}

export async function deleteTransaction(
  id: string,
): Promise<void> {
  await apiRequest(`/transactions/${id}`, {
    method: 'DELETE',
  })
}