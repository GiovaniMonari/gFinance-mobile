export function formatTransactionStatus(status: string) {
  return translateTransactionStatus(status)
}

/**
 * Both transaction backends send status as an English enum code, and they do
 * not agree on the spelling: the local API uses COMPLETED / PENDING /
 * CANCELLED, while Open Finance uses the British SETTLED. Every code is
 * matched case- and separator-insensitively so an unexpected variant still
 * resolves instead of leaking a raw enum to the screen.
 *
 * Anything unrecognised falls through to a readable sentence rather than the
 * raw code, which is meaningless to the person reading the screen.
 */
export function translateTransactionStatus(status: string) {
  const key = status.trim().toUpperCase().replace(/[\s-]+/g, '_')

  const statuses: Record<string, string> = {
    COMPLETED: 'Concluída',
    SETTLED: 'Concluída',
    PENDING: 'Pendente',
    CANCELLED: 'Cancelada',
    CANCELED: 'Cancelada',
    REVERSED: 'Estornada',
    FAILED: 'Falhou',
    SCHEDULED: 'Agendada',
    ACCOUNT_LOCKED: 'Conta bloqueada',
    CREATED: 'Criada',
    ACKNOWLEDGED: 'Registrada',
    BLOCKED: 'Bloqueada',
  }

  if (statuses[key]) return statuses[key]

  // "SCHEDULED" and friends aside, a lowercase or mixed-case value is still a
  // human sentence in some payloads. Only a bare enum gets replaced.
  return status.includes('_') ? 'Atualizada' : status
}

export function formatTransactionDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR')
}

/**
 * Open Finance currency codes, shown on transaction details. Unknown codes are
 * left as-is: a three-letter ISO code is the universally understood notation
 * and inventing a name for it would be worse than showing it.
 */
const CURRENCY_NAMES: Record<string, string> = {
  BRL: 'Real',
  USD: 'Dólar americano',
  EUR: 'Euro',
  GBP: 'Libra esterlina',
  JPY: 'Iene',
  CHF: 'Franco suíço',
  ARS: 'Peso argentino',
  CLP: 'Peso chileno',
  COP: 'Peso colombiano',
  MXN: 'Peso mexicano',
  CAD: 'Dólar canadense',
  AUD: 'Dólar australiano',
}

export function formatCurrencyName(code: string) {
  const name = CURRENCY_NAMES[code?.trim().toUpperCase()]
  return name ? `${name} (${code.toUpperCase()})` : code.toUpperCase()
}

/**
 * Merchant categories from Open Finance arrive as English strings straight
 * from the aggregator. Anything not in this table is passed through untouched
 * — a stray category name is still better than a wrong guess, and the goal is
 * to fix the common cases, not to invent translations.
 */
const CATEGORY_NAMES: Record<string, string> = {
  food_and_drink: 'Alimentação',
  food: 'Alimentação',
  groceries: 'Mercado',
  market: 'Mercado',
  restaurant: 'Restaurante',
  coffee: 'Cafeteria',
  transport: 'Transporte',
  transportation: 'Transporte',
  fuel: 'Combustível',
  gas: 'Combustível',
  gasoline: 'Combustível',
  parking: 'Estacionamento',
  taxi: 'Táxi',
  travel: 'Viagem',
  accommodation: 'Hospedagem',
  hotel: 'Hotel',
  shopping: 'Compras',
  retail: 'Compras',
  health: 'Saúde',
  healthcare: 'Saúde',
  pharmacy: 'Farmácia',
  education: 'Educação',
  entertainment: 'Lazer',
  leisure: 'Lazer',
  services: 'Serviços',
  subscription: 'Assinatura',
  utilities: 'Serviços básicos',
  bills: 'Contas',
  rent: 'Aluguel',
  housing: 'Moradia',
  insurance: 'Seguro',
  transfer: 'Transferência',
  loan: 'Empréstimo',
  salary: 'Salário',
  salary_payment: 'Salário',
  pension: 'Aposentadoria',
  withdrawal: 'Saque',
  deposit: 'Depósito',
  fees: 'Taxas',
  tax: 'Impostos',
  others: 'Outros',
  other: 'Outros',
  uncategorized: 'Sem categoria',
}

export function translateCategory(category: string | null | undefined) {
  if (!category) return 'Sem categoria'

  const key = category.trim().toLowerCase().replace(/[\s-]+/g, '_')
  return CATEGORY_NAMES[key] ?? category
}

/**
 * Bank account types from the aggregator. Same pass-through rule as the
 * category table: known codes are localised, anything else is left alone.
 *
 * The service now translates these before they leave the backend, so what
 * arrives here is usually the finished pt-BR label. The table remains as a
 * fallback for anything untranslated, and anything unknown passes through:
 * the old fixed "Conta" would have hidden a perfectly good "Conta salário"
 * the moment the table missed it.
 */
const ACCOUNT_SUBTYPES: Record<string, string> = {
  checking_account: 'Conta corrente',
  savings_account: 'Conta poupança',
  investment_account: 'Investimentos',
  credit_card: 'Cartão de crédito',
}

export function translateAccountSubtype(subtype: string | null | undefined) {
  if (!subtype) return 'Conta'
  const key = subtype.trim().toLowerCase().replace(/[\s-]+/g, '_')
  return ACCOUNT_SUBTYPES[key] ?? subtype
}
