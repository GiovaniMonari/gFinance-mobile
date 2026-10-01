/**
 * Econva — Legal documents
 *
 * The shape every legal document in the app has, independent of how it is
 * rendered or where it is shown.
 *
 * Two things are deliberately part of the data rather than the UI:
 *
 *   version       the number that is accepted, recorded and compared. Keeping
 *                 it on the document is what lets a future release know a user
 *                 has not yet seen the new text — without the app hardcoding a
 *                 version anywhere.
 *
 *   versions[]    the whole history, newest first. Publishing version 2 is a
 *                 matter of unshifting an entry and moving the text across;
 *                 version 1 stays here so an older acceptance still points at
 *                 something a person can actually read.
 */

/** The two documents. Kept as a union so a screen can never ask for a third. */
export type LegalDocumentKey = 'terms' | 'privacy';

/**
 * One published text.
 *
 * `versions[0]` is the current version; everything after it is history.
 */
export type LegalDocument = {
  key: LegalDocumentKey;
  title: string;
  /**
   * What agreeing to this document means, in one line. The registration flow
   * shows this so "Termos de Uso" and "Política de Privacidade" never read as
   * the same kind of statement.
   */
  purpose: string;
  versions: LegalVersion[];
};

export type LegalVersion = {
  /** Publication identifier, compared as numbers — "1.0" before "1.1". */
  version: string;
  /**
   * When this version took effect.
   *
   * A placeholder until the project owner states the real date: a date the
   * product invented is worse than an obvious gap.
   */
  effectiveDate: string;
  sections: LegalSection[];
};

export type LegalSection = {
  id: string;
  heading: string;
  /** Explanatory paragraphs, in order. Rendered before `items`. */
  paragraphs?: string[];
  /** A list of statements, rendered as bullets. */
  items?: string[];
  /**
   * What follows the list — the conclusion, the caveat, the "this is not the
   * same as consent" note. Kept separate from `paragraphs` so a section can
   * open with a sentence, list its points and then close on the point that
   * matters, without the renderer having to guess which came first.
   */
  closing?: string[];
};

/**
 * Fields the owner still has to fill in: anything written between square
 * brackets, e.g. `[CNPJ]`.
 *
 * The renderer highlights them, and a document that carries them says so — so
 * an unfinished legal text cannot be published by accident.
 */
export const PLACEHOLDER_PATTERN = /\[[^\]]+\]/;

/** Every bracketed field in a document, in reading order. */
export function collectPlaceholders(
  document: LegalDocument,
): string[] {
  const found = new Set<string>();

  for (const version of document.versions) {
    for (const section of version.sections) {
      const texts = [
        ...(section.paragraphs ?? []),
        ...(section.items ?? []),
        ...(section.closing ?? []),
      ];

      for (const text of texts) {
        for (const match of text.match(/\[[^\]]+\]/g) ?? []) {
          found.add(match);
        }
      }
    }
  }

  return [...found];
}
