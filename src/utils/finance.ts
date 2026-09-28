import { Transaction } from "../types/transaction"

export function calculateTotals(
  transactions: Transaction[],
) {
  return transactions.reduce(
    (totals, transaction) => {
      if (transaction.status !== 'COMPLETED') {
        return totals
      }

      const amount = Number(transaction.amount)

      if (
        transaction.type === 'INCOME' ||
        transaction.type === 'DEPOSIT'
      ) {
        totals.income += amount
      }

      if (transaction.type === 'EXPENSE') {
        totals.expenses += amount
      }

      return totals
    },
    {
      expenses: 0,
      income: 0,
    },
  )
}