/**
 * Econva — Legal document registry
 *
 * The only place the two documents are looked up, and the only place a version
 * is compared. Screens ask for a key; they never import a document directly
 * and never hold a version string of their own.
 *
 * That is what keeps a revision in one file: change the text or bump the
 * number in `termsOfUse.ts` / `privacyPolicy.ts`, and every screen that reads
 * the current version, asks for acknowledgement or records an acceptance is
 * working with the new value already.
 */

import { privacyPolicy } from './privacyPolicy';
import { termsOfUse } from './termsOfUse';
import {
  collectPlaceholders,
  type LegalDocument,
  type LegalDocumentKey,
  type LegalVersion,
} from './types';

export const LEGAL_DOCUMENT_KEYS: readonly LegalDocumentKey[] = [
  'terms',
  'privacy',
];

const REGISTRY: Record<LegalDocumentKey, LegalDocument> = {
  terms: termsOfUse,
  privacy: privacyPolicy,
};

export function getLegalDocument(
  key: LegalDocumentKey,
): LegalDocument | undefined {
  return REGISTRY[key];
}

/** `versions[0]` — the version a new account accepts and a lapsed one is shown. */
export function getCurrentVersion(
  key: LegalDocumentKey,
): LegalVersion | undefined {
  return REGISTRY[key]?.versions[0];
}

/** The number as it appears in the UI, e.g. "Versão 1.0". */
export function getCurrentVersionLabel(key: LegalDocumentKey): string {
  return REGISTRY[key]?.versions[0]?.version ?? '';
}

/** Every bracketed field a document still carries. Empty when it is complete. */
export function getPendingFields(key: LegalDocumentKey): string[] {
  const document = REGISTRY[key];

  if (!document) return [];

  return collectPlaceholders(document);
}

/**
 * Compare two publication numbers as versions rather than as strings:
 * "1.10" is newer than "1.9", which a lexicographic comparison gets wrong.
 */
export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map((part) => toNumber(part));
  const right = b.split('.').map((part) => toNumber(part));
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const l = left[index] ?? 0;
    const r = right[index] ?? 0;

    if (l !== r) return l > r ? 1 : -1;
  }

  return 0;
}

function toNumber(part: string): number {
  const value = Number.parseInt(part, 10);

  return Number.isNaN(value) ? 0 : value;
}

/**
 * Whether `candidate` is a version published after `reference`.
 *
 * An unparseable or empty value never counts as newer: an acceptance that
 * cannot be compared must not be mistaken for one that is up to date.
 */
export function isNewerVersion(
  candidate: string,
  reference: string,
): boolean {
  if (!candidate || !reference) return false;

  return compareVersions(candidate, reference) > 0;
}

/**
 * Structural problems that make a document unusable, or an empty array when
 * it is sound.
 *
 * This is the check the registration flow waits on. If the text is missing a
 * version, a date or its sections, the document cannot be shown — and a
 * version cannot be accepted, so no account may be created against it.
 */
export function findDocumentProblems(
  document: LegalDocument | undefined,
): string[] {
  if (!document) return ['documento ausente'];

  const problems: string[] = [];

  if (!document.title.trim()) problems.push('sem título');
  if (!document.purpose.trim()) problems.push('sem resumo');

  if (document.versions.length === 0) {
    problems.push('nenhuma versão publicada');
    return problems;
  }

  const seen = new Set<string>();

  for (const version of document.versions) {
    const label = version.version || '(sem número)';

    if (!/^\d+(\.\d+)*$/.test(version.version)) {
      problems.push(`número de versão inválido: ${label}`);
    }

    if (seen.has(version.version)) {
      problems.push(`versão repetida: ${version.version}`);
    }

    seen.add(version.version);

    if (!version.effectiveDate.trim()) {
      problems.push(`versão ${label} sem data de vigência`);
    }

    if (version.sections.length === 0) {
      problems.push(`versão ${label} sem conteúdo`);
      continue;
    }

    for (const section of version.sections) {
      const text = [
        ...(section.paragraphs ?? []),
        ...(section.items ?? []),
        ...(section.closing ?? []),
      ]
        .join(' ')
        .trim();

      if (!text) {
        problems.push(`seção vazia: ${section.id || '(sem id)'}`);
      }
    }
  }

  return problems;
}
