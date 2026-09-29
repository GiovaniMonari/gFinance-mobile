
import { apiRequest } from './apiClient'
import type {
  CreateGoalData,
  FinancialGoal,
  GoalProgressData,
  GoalTransaction,
  UpdateGoalData,
} from '../types/goal'

export async function getGoals(): Promise<
  FinancialGoal[]
> {
  return apiRequest('/financial-goals', {
    method: 'GET',
  })
}

export async function getGoalById(
  id: string,
): Promise<FinancialGoal> {
  return apiRequest(`/financial-goals/${id}`, {
    method: 'GET',
  })
}

export async function createGoal(
  data: CreateGoalData,
): Promise<FinancialGoal> {
  return apiRequest('/financial-goals', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateGoal(
  id: string,
  data: UpdateGoalData,
): Promise<FinancialGoal> {
  return apiRequest(`/financial-goals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function addGoalProgress(
  id: string,
  data: GoalProgressData,
): Promise<FinancialGoal> {
  return apiRequest(
    `/financial-goals/${id}/progress`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  )
}

export async function removeGoalProgress(
  id: string,
  data: GoalProgressData,
): Promise<FinancialGoal> {
  return apiRequest(
    `/financial-goals/${id}/progress/remove`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  )
}

export async function deleteGoal(
  id: string,
): Promise<void> {
  await apiRequest(`/financial-goals/${id}`, {
    method: 'DELETE',
  })
}

export async function getGoalTransactions(
  id: string,
): Promise<GoalTransaction[]> {
  return apiRequest(
    `/financial-goals/${id}/transactions`,
    {
      method: 'GET',
    },
  )
}