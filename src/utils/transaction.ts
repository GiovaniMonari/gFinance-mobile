export function formatTransactionStatus(status: string) {
  const statuses: Record<string, string> = {
    COMPLETED: 'Concluída',
    PENDING: 'Pendente',
    CANCELLED: 'Cancelada',
  }

  return statuses[status] ?? status
}

export function formatTransactionDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR')
}