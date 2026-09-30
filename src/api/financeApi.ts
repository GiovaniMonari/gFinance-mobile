import { ensureFinanceAccount } from './apiClient'
import type { Finance } from '../types/finance'

/**
 * The user's finance account, created on first use.
 *
 * The raw `POST /finances/get` answers `null` for a user who has never had an
 * account — a case this signature never allowed for — and every read in the
 * API scopes itself by that account. Bootstrapping here means callers can take
 * `Finance` at its word, and the shared single-flight inside `apiClient`
 * keeps the create from being raced by two first-loads landing together.
 */
export function getFinance(): Promise<Finance> {
  return ensureFinanceAccount() as Promise<Finance>
}
