export type TransactionType =
  | 'INCOME'
  | 'EXPENSE'
  | 'DEPOSIT'

export type Transaction = {
  id: string
  financeId: string
  categoryId: string
  amount: string | number
  type: TransactionType
  status: string
  description: string
  createdAt: string
  updatedAt: string
}