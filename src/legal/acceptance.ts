/**
 * Econva — Legal acceptance state
 *
 * A record of what a person has actually been shown and agreed to, kept apart
 * from the two states it is most often confused with:
 *
 *   session          is there a signed-in account right now
 *   acceptance       which version of each legal document did that account see
 *   Open Finance     is a bank connected and authorised
 *
 * None of the three stands in for another. A token proves a session, never an
 * acceptance; an acceptance says nothing about a bank connection; a connected
 * bank does not mean the current terms were read. Nothing here reads or
 * writes either of the other two.
 *
 * Two rules shape the data:
 *
 *   Append-only. Publishing a new version records a new entry beside the old
 *   one — an acceptance made in the past is evidence of a past fact and is
 *   never rewritten to match the present.
 *
 *   Never inferred. A record exists only because someone performed the
 *   acknowledgement on this installation. Accounts created before this
 *   feature, a wiped device or an unreadable record all resolve to "nothing
 *   recorded" and are asked again, because assuming otherwise would be
 *   putting a signature on behalf of the user.
 *
 * The backend has no column for this yet, so the truth lives on the
 * installation that produced it. See the note in `index.ts` for the minimal
 * API change that would let the server hold it instead.
 */

import * as SecureStore from 'expo-secure-store';

import { getCurrentVersion, isNewerVersion } from './documents';
import type { LegalDocumentKey } from './types';

/**
 * Storage key. Alphanumerics, `.`, `-` and `_` only — that is what
 * `expo-secure-store` accepts as a key name.
 */
const STORAGE_KEY = 'econva_legal_acceptance';

/** One acknowledgement, exactly as it happened. */
export type LegalAcceptanceEntry = {
  /** The account that acknowledged. Never a credential — just an identifier. */
  userId: string;
  /** Version of the Termos de Uso the person agreed to. */
  termsVersion: string;
  /** Version of the Política de Privacidade the person was informed of. */
  privacyVersion: string;
  /** ISO-8601 instant of the acknowledgement. */
  acceptedAt: string;
};

/** The whole history for this installation. Newest entry last. */
export type LegalAcceptanceRecord = {
  entries: LegalAcceptanceEntry[];
};

export type LegalDocumentStatus = {
  key: LegalDocumentKey;
  /** What the app is publishing right now. */
  currentVersion: string;
  /** What this account acknowledged, or `null` if it never did. */
  acceptedVersion: string | null;
  acceptedAt: string | null;
  /** The published text is ahead of what was acknowledged — or unknown. */
  pending: boolean;
};

export type LegalAcceptanceStatus = {
  /** The most recent acknowledgement by this account, if any. */
  latest: LegalAcceptanceEntry | null;
  documents: Record<LegalDocumentKey, LegalDocumentStatus>;
  /** Nothing has ever been recorded for this account on this device. */
  firstTime: boolean;
  /** At least one published version has not been acknowledged. */
  pending: boolean;
};

const EMPTY: LegalAcceptanceRecord = { entries: [] };

/**
 * Read the history.
 *
 * A record that cannot be read comes back empty rather than as an error: the
 * safe reading of "we don't know" is to ask again, and the flow that asks is
 * not a failure. Writing, by contrast, is allowed to throw — see
 * `recordAcceptance`.
 */
export async function readAcceptance(): Promise<LegalAcceptanceRecord> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);

    if (!raw) return EMPTY;

    return normalize(JSON.parse(raw));
  } catch {
    return EMPTY;
  }
}

/**
 * Keep only what matches the shape above.
 *
 * Corrupted or hand-edited data is dropped entry by entry rather than
 * discarding the rest, so one bad record does not erase a genuine history.
 */
function normalize(parsed: unknown): LegalAcceptanceRecord {
  if (typeof parsed !== 'object' || parsed === null) return EMPTY;

  const rawEntries = (parsed as { entries?: unknown }).entries;

  if (!Array.isArray(rawEntries)) return EMPTY;

  const entries: LegalAcceptanceEntry[] = [];

  for (const candidate of rawEntries) {
    if (typeof candidate !== 'object' || candidate === null) continue;

    const entry = candidate as Record<string, unknown>;

    if (
      typeof entry.userId !== 'string' ||
      typeof entry.termsVersion !== 'string' ||
      typeof entry.privacyVersion !== 'string' ||
      typeof entry.acceptedAt !== 'string'
    ) {
      continue;
    }

    entries.push({
      userId: entry.userId,
      termsVersion: entry.termsVersion,
      privacyVersion: entry.privacyVersion,
      acceptedAt: entry.acceptedAt,
    });
  }

  return { entries };
}

/**
 * Append an acknowledgement.
 *
 * The previous history is read and written back with the new entry on the
 * end, so nothing that was recorded before is lost. A failure here is a real
 * failure: it throws, and the screen offers a retry, because silently
 * dropping the only proof that someone agreed to something is exactly the
 * thing this function exists to prevent.
 */
export async function recordAcceptance(input: {
  userId: string;
  termsVersion: string;
  privacyVersion: string;
}): Promise<LegalAcceptanceEntry> {
  const existing = await readAcceptance();

  const entry: LegalAcceptanceEntry = {
    userId: input.userId,
    termsVersion: input.termsVersion,
    privacyVersion: input.privacyVersion,
    acceptedAt: new Date().toISOString(),
  };

  await SecureStore.setItemAsync(
    STORAGE_KEY,
    JSON.stringify({ entries: [...existing.entries, entry] }),
  );

  return entry;
}

/** The newest acknowledgement belonging to this account. */
export function latestAcceptanceFor(
  record: LegalAcceptanceRecord,
  userId: string,
): LegalAcceptanceEntry | null {
  for (let index = record.entries.length - 1; index >= 0; index -= 1) {
    const entry = record.entries[index];

    if (entry?.userId === userId) return entry;
  }

  return null;
}

/**
 * Where this account stands against the published documents.
 *
 * The comparison is per document and by version number, so publishing only
 * the Política de Privacidade asks for the Política de Privacidade and leaves
 * an accepted Termos de Uso alone. An unknown published version counts as
 * pending: if we cannot say which text is current, we cannot claim it was
 * read.
 */
export async function getAcceptanceStatus(
  userId: string,
): Promise<LegalAcceptanceStatus> {
  const record = await readAcceptance();
  const latest = latestAcceptanceFor(record, userId);

  const documents = {} as LegalAcceptanceStatus['documents'];

  for (const key of ['terms', 'privacy'] as const) {
    const published = getCurrentVersion(key)?.version ?? '';
    const accepted =
      key === 'terms'
        ? (latest?.termsVersion ?? null)
        : (latest?.privacyVersion ?? null);

    documents[key] = {
      key,
      currentVersion: published,
      acceptedVersion: accepted,
      acceptedAt: latest?.acceptedAt ?? null,
      pending: !published || !accepted || isNewerVersion(published, accepted),
    };
  }

  return {
    latest,
    documents,
    firstTime: latest === null,
    pending: documents.terms.pending || documents.privacy.pending,
  };
}
