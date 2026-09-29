
export type GoalStatus =
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'

export type FinancialGoal = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
  active: boolean
  createdAt: string
  updatedAt: string
  progress: number
  remainingAmount: number
  status: GoalStatus
}

export type GoalTransaction = {
  id: string
  goalId: string
  type: 'DEPOSIT' | 'WITHDRAW'
  amount: number
  createdAt: string
}

export type CreateGoalData = {
  name: string
  targetAmount: number
  deadline?: string
}

export type UpdateGoalData = {
  name?: string
  targetAmount?: number
  deadline?: string
}

export type GoalProgressData = {
  amount: number
}
