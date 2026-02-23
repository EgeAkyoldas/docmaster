/**
 * patchUtils.ts — Surgical Patch Utilities
 *
 * Provides section-level extraction and application for the surgical harmonize
 * mode. AI reads ALL documents for cross-doc context but outputs ONLY the
 * target section. This file handles the client-side string-replace merge.
 */

export interface ExtractedSection {
  /** The full matched text to be replaced (header + body) */
  fullMatch: string;
  /** Just the heading line, e.g. "## Authentication Flow" */
  header: string;
  /** Body content under the heading */
  body: string;
}

/**
 * Finds the markdown section (H2 or H3) inside `doc` that is most likely
 * related to the issue, scored by overlap with hint phrases.
 *
 * Returns null if no confident match is found (caller should fall back to
 * full-document harmonize mode).
 */
export function extractSection(
  doc: string,
  hints: string[]
): ExtractedSection | null {
  if (!doc.trim() || hints.length === 0) return null;

  // Normalize hints: lowercase words, filter short tokens
  const hintWords = hints
    .flatMap((h) => h.toLowerCase().split(/\W+/))
    .filter((w) => w.length > 3);

  if (hintWords.length === 0) return null;

  // Split on H2 or H3 boundaries (keep delimiter)
  const sectionRegex = /^(#{2,3} .+)$/m;
  const rawSections = doc.split(/(?=^#{2,3} )/m).filter(Boolean);

  let bestScore = 0;
  let bestSection: ExtractedSection | null = null;

  for (const raw of rawSections) {
    const headerMatch = raw.match(/^(#{2,3} .+)/m);
    if (!headerMatch) continue;

    const header = headerMatch[1];
    const body = raw.slice(header.length).trim();
    const sectionText = raw.toLowerCase();

    // Score: count hint word occurrences in this section
    let score = 0;
    for (const word of hintWords) {
      const occurrences = (sectionText.match(new RegExp(word, "g")) || []).length;
      score += occurrences;
    }

    // Weight the header more heavily
    const headerLower = header.toLowerCase();
    for (const word of hintWords) {
      if (headerLower.includes(word)) score += 3;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSection = { header, body, fullMatch: raw };
    }
  }

  // Require a minimum confidence score — at least 3 matching signals
  if (bestScore < 3 || !bestSection) return null;

  return bestSection;
}

/**
 * Applies a patched section back into the original document via string replace.
 *
 * Safety guards:
 * - The original section must exist verbatim in the doc (otherwise throws)
 * - If patched content is >2.5x longer than original section, rejects (hallucination guard)
 * - Trims trailing whitespace differences to avoid false-positive size checks
 */
export function applyPatch(
  originalDoc: string,
  originalSection: ExtractedSection,
  patchedSection: string
): string {
  const trimmedPatched = patchedSection.trim();

  // Guard: original must exist in doc
  if (!originalDoc.includes(originalSection.fullMatch.trim())) {
    throw new Error(
      `Cannot apply patch: original section "${originalSection.header}" not found verbatim in document.`
    );
  }

  // Guard: reject if patched section is >2.5x longer (hallucination)
  const originalLen = originalSection.fullMatch.trim().length;
  const patchedLen = trimmedPatched.length;
  if (patchedLen > originalLen * 2.5) {
    throw new Error(
      `Patch rejected: patched section (${patchedLen} chars) is >2.5x the original (${originalLen} chars). Possible hallucination.`
    );
  }

  return originalDoc.replace(
    originalSection.fullMatch.trim(),
    trimmedPatched
  );
}

/**
 * Extracts searchable hint phrases from an issue for use in extractSection().
 * Combines evidence quotes and key phrases from description + fix.
 */
export function buildHints(issue: {
  description: string;
  fix: string;
  title: string;
  evidence?: Array<{ quote: string }>;
}): string[] {
  const hints: string[] = [issue.title];

  // Evidence quotes are the strongest signals
  if (issue.evidence) {
    for (const e of issue.evidence) {
      if (e.quote) hints.push(e.quote.slice(0, 120));
    }
  }

  // Extract noun phrases from description (heuristic: quoted text)
  const quoted = issue.description.match(/"([^"]+)"/g);
  if (quoted) hints.push(...quoted.map((q) => q.replace(/"/g, "")));

  // Also use first 100 chars of fix directive
  hints.push(issue.fix.slice(0, 100));

  return hints.filter(Boolean);
}
