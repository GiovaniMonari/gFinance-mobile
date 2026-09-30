import { apiRequest } from './apiClient'

export type RecurringExpense = {
  id: string
  description: string | null
  /**
   * Prisma `Decimal` reaches JSON as a string, so every display goes through
   * `Number()` first. Typed as either to stay honest about what may arrive.
   */
  amount: string | number
  dayOfMonth: number
  nextExecution: string
  active: boolean
  categoryId: string | null
  category: { id: string; name: string } | null
}

export type CreateRecurringExpenseData = {
  amount: number
  description?: string
  categoryId?: string
  dayOfMonth: number
}

export async function getRecurringExpenses(): Promise<
  RecurringExpense[]
> {
  return apiRequest('/recurring-expenses', {
    method: 'GET',
  })
}

export async function createRecurringExpense(
  data: CreateRecurringExpenseData,
): Promise<RecurringExpense> {
  return apiRequest('/recurring-expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteRecurringExpense(
  id: string,
): Promise<void> {
  await apiRequest(`/recurring-expenses/${id}`, {
    method: 'DELETE',
  })
}
