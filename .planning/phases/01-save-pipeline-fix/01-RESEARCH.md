# Phase 1: Save Pipeline Fix - Research

**Researched:** 2026-04-16
**Domain:** IndexedDB debounce race condition / React state closure timing
**Confidence:** HIGH

---

## Summary

Phase 1 targets a confirmed, reproducible race condition in `src/lib/storage.ts` where rapid successive calls to `debouncedSaveDocuments()` silently drop documents. The mechanism is understood precisely: a module-level variable `_pendingDocSession` is overwritten on each call before the previous timer fires, so the first document's state is replaced rather than merged. The fix is a localized, surgical change to one function in one file, with a coordinating change in `src/app/session/[id]/page.tsx`.

There is a secondary, interacting concern in `handleDocumentsUpdate` (session page): the function calls `debouncedSaveDocuments(updated)` inside `setSession`'s updater callback. The `updated` object is the React-computed next state, so merging is already happening at the React layer. The only thing that needs fixing is the debounce layer — it must store the most-recent `updated` session passed to it, not overwrite it. Since `setSession` updaters run synchronously before the next render, the `updated` value passed to `debouncedSaveDocuments` is always the correct accumulated state.

No new libraries are required. The fix is pure TypeScript within the existing `idb`-backed storage module. CLAUDE.md requires that any fix include tests for the fixed area; tests must be added since no test infrastructure currently exists.

**Primary recommendation:** Replace the overwrite pattern in `debouncedSaveDocuments` with a merge pattern that spreads `session.documents` into `_pendingDocSession.documents` when a pending session already exists. Add a `vitest` (or `jest`) unit test that simulates two rapid calls and asserts both documents survive.

---

## Project Constraints (from CLAUDE.md)

- **Tech Stack**: Next.js 16 + React 19 + TypeScript — established, no migration
- **AI Provider**: Google Gemini API — deeply integrated, not relevant to this phase
- **Storage**: IndexedDB via `idb` library — client-side only, no server database
- **No Tests**: Zero test coverage currently — **any fix must include tests for the fixed area**
- Strict TypeScript mode enabled (`tsconfig.json`)
- Path alias `@/*` → `./src/*` used consistently
- Named exports, camelCase utilities, PascalCase components
- Event handlers prefixed `handle`, callbacks prefixed `on`
- 2-space indentation, always semicolons
- `"use client"` directive applied at top of interactive component files

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SAVE-01 | User's generated document persists to IndexedDB even when multiple documents are generated in quick succession | Fix `debouncedSaveDocuments` to merge rather than overwrite `_pendingDocSession`; verified root cause at `storage.ts:213-223` [VERIFIED: direct code read] |
| SAVE-02 | Debounced save merges pending updates instead of overwriting previous pending state | Same fix as SAVE-01; the overwrite-vs-merge behaviour is the exact defect. Confirmed `_pendingDocSession = session` on line 214 is the culprit [VERIFIED: direct code read] |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Document persistence (write) | Data Management Layer (`storage.ts`) | Page/Route Layer (`session/[id]/page.tsx`) | `storage.ts` owns IndexedDB writes; page layer constructs the merged session object and calls the storage function |
| Document state (in-memory) | Page/Route Layer (`session/[id]/page.tsx`) | — | `setSession` updater accumulates in-flight documents via React state |
| Document parsing from AI response | Utility Layer (`utils.ts`) | Presentation Layer (`ChatPanel.tsx`) | `parseDocumentBlocks()` extracts doc map; `ChatPanel` calls `onDocumentsUpdate` with result |
| Test coverage for save pipeline | New (Wave 0 gap) | — | No test infrastructure exists; must be created |

---

## Standard Stack

### Core (already installed — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `idb` | 8.0.3 | IndexedDB wrapper | Already used throughout `storage.ts` [VERIFIED: npm view + package.json] |
| TypeScript | 5.x | Type safety | Project standard; strict mode [VERIFIED: package.json] |
| React 19 | 19.0.0 | UI + state management | Project standard [VERIFIED: package.json] |

### Test Infrastructure (Wave 0 gap — must install)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vitest` | latest | Unit test runner | Best fit for Next.js + TypeScript projects without Jest transform config overhead [ASSUMED] |
| `@vitest/coverage-v8` | latest | Coverage reporting | Standard pairing with vitest [ASSUMED] |

> **Note:** No test runner is currently installed (package.json has no `jest`, `vitest`, or similar). `vitest` is recommended over `jest` because it requires zero Babel/transform config for TypeScript + ESM and works natively with the project's existing tsconfig. [ASSUMED — vitest compatibility with Next.js 16 not verified via Context7 this session; validate before installing]

**Installation (tests only):**
```bash
npm install --save-dev vitest @vitest/coverage-v8
```

---

## Architecture Patterns

### System Architecture Diagram

```
ChatPanel (streaming response complete)
    │
    │  parseDocumentBlocks(fullText)
    │  → documents: Record<string, string>
    │
    ▼
onDocumentsUpdate(documents)   [ChatPanelProps callback]
    │
    ▼
handleDocumentsUpdate(newDocs) [session/[id]/page.tsx:80-98]
    │
    │  setSession(prev => {
    │    mergedDocs = { ...prev.documents, ...newDocs }  ← React merges correctly
    │    updated = { ...prev, documents: mergedDocs }
    │    debouncedSaveDocuments(updated)                 ← BUG: overwrites _pendingDocSession
    │    return updated
    │  })
    │
    ▼
debouncedSaveDocuments(session, 150ms) [storage.ts:213-223]
    │
    │  CURRENT (buggy):
    │    _pendingDocSession = session          ← OVERWRITES; prior pending docs lost
    │    clearTimeout(_docDebounceTimer)
    │    _docDebounceTimer = setTimeout(→ saveSession(_pendingDocSession))
    │
    │  FIXED (merge):
    │    if (_pendingDocSession exists):
    │      _pendingDocSession.documents = { ..._pendingDocSession.documents, ...session.documents }
    │      _pendingDocSession = { ...session, documents: mergedDocuments }
    │    else:
    │      _pendingDocSession = session
    │    clearTimeout + reset timer
    │
    ▼
saveSession(session) → IndexedDB.put(STORE, trimSession(session))
```

### Recommended Project Structure (no changes needed)

```
src/lib/
├── storage.ts     # Fix debouncedSaveDocuments (lines 209-223)
src/app/session/[id]/
└── page.tsx       # No change needed to handleDocumentsUpdate — React merge is correct
tests/             # New directory (Wave 0)
└── storage.test.ts  # Unit tests for SAVE-01 and SAVE-02
```

### Pattern 1: Merge-Based Debounce (the fix)

**What:** When `_pendingDocSession` already has a value, spread the incoming session's documents into it rather than replacing the whole variable. Use the incoming session for all other fields (so `updatedAt` is always the freshest timestamp).

**When to use:** Any debounce function where updates are partial (document-by-document) and losing an earlier update is unacceptable.

```typescript
// Source: VERIFIED via direct code read of storage.ts:209-223
// FIXED version of debouncedSaveDocuments

export function debouncedSaveDocuments(session: Session, delayMs = 150): void {
  if (_pendingDocSession) {
    // Merge documents from both sessions — accumulate, don't overwrite
    _pendingDocSession = {
      ...session,
      documents: { ..._pendingDocSession.documents, ...session.documents },
    };
  } else {
    _pendingDocSession = session;
  }
  if (_docDebounceTimer) clearTimeout(_docDebounceTimer);
  _docDebounceTimer = setTimeout(() => {
    if (_pendingDocSession) {
      void saveSession(_pendingDocSession);
      _pendingDocSession = null;
    }
    _docDebounceTimer = null;
  }, delayMs);
}
```

**Key reasoning:** `handleDocumentsUpdate` already merges `newDocs` into `prev.documents` at the React layer (lines 84-87 of `page.tsx`). So the `updated` session passed to `debouncedSaveDocuments` always contains the full accumulated document set AS OF that React updater execution. The only scenario where docs still get lost is if two `setSession` updaters run and both call `debouncedSaveDocuments` before the 150ms timer fires — call B overwrites call A's `_pendingDocSession`. The fix above handles exactly this: if a pending session exists, merge B's documents onto A's rather than discard A.

### Pattern 2: Immediate Save as Alternative

**What:** Bypass debounce entirely for document saves. Call `saveSession` directly (it's already async/non-blocking).

**When to use:** If the merge pattern above feels fragile, simplicity may win. The 150ms debounce was added to avoid IndexedDB thrashing during streaming, but document generation only fires `onDocumentsUpdate` once (at end of stream, line 601 in ChatPanel), not on every token.

```typescript
// Source: VERIFIED via direct code read of ChatPanel.tsx:600-601
// Line 601 is only called AFTER streaming completes — debounce is not needed for reliability
if (Object.keys(documents).length > 0) onDocumentsUpdate(documents);
```

**Implication:** Since `onDocumentsUpdate` is only called once per generation (not per-token), there is no performance concern with immediate saves for documents. The debounce was likely added as a precaution. The planner may choose to either (a) implement the merge fix to preserve the debounce architecture, or (b) switch to immediate `saveSession` for document updates.

### Anti-Patterns to Avoid

- **Mutating `_pendingDocSession.documents` in place:** TypeScript strict mode and React immutability patterns expect object spreads, not direct mutation. Always spread to create a new object.
- **Accessing `session` state from outside `setSession` updater:** The existing code correctly reads `prev` inside the updater. Do not refactor `handleDocumentsUpdate` to read `session` state directly from the closure — it will be stale.
- **Adding a third debounce channel:** The current two-channel system is already flagged in CONCERNS.md as confusing. Don't add complexity.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fake IndexedDB for tests | Custom mock | `fake-indexeddb` npm package | Handles all IDB transaction semantics; hand-rolled mocks miss edge cases [ASSUMED — verify package exists] |
| Debounce utility | Custom implementation | Fix the existing one in `storage.ts` | Existing implementation is correct in structure; only the overwrite pattern needs changing |

**Key insight:** The bug is one line (`_pendingDocSession = session` → merge). The entire fix is 4-5 lines of TypeScript. Don't reach for new abstractions.

---

## Common Pitfalls

### Pitfall 1: Merging the wrong way (new overwrites old)

**What goes wrong:** Using `{ ...session.documents, ..._pendingDocSession.documents }` instead of `{ ..._pendingDocSession.documents, ...session.documents }`. The incoming session (newer) should win for any key that appears in both, because the latest AI response is the most correct content.

**Why it happens:** Object spread order is easy to mix up.

**How to avoid:** Comment the spread order explicitly: "pending (older) first, incoming (newer) second — newer wins on conflict."

**Warning signs:** Test where Document A is generated first, then Document B in the same docType key — A's content should be replaced by B's. If reversed, old content persists when it shouldn't.

### Pitfall 2: React state closure stale read

**What goes wrong:** Refactoring `handleDocumentsUpdate` to call `debouncedSaveDocuments` outside the `setSession` updater — reading the `session` variable from the outer closure instead of `prev` from the updater. This was already the root cause of the previously fixed bug (commit 627ca8a).

**Why it happens:** `session` in the outer closure is the value at render time; `prev` inside `setSession` is the true current state.

**How to avoid:** Keep all `debouncedSaveDocuments` calls inside the `setSession` updater where `updated` (derived from `prev`) is available. The existing code structure is correct — only `storage.ts` needs changing.

**Warning signs:** Documents sometimes missing after fast navigation or quick successive edits.

### Pitfall 3: Test timer mocking not applied to module-level timers

**What goes wrong:** Tests call `debouncedSaveDocuments` twice and then await a real 150ms — tests are slow and may still pass even if the fix is wrong (because the second call's timer fires before the check).

**Why it happens:** Without fake timers, debounce timers are real; tests can't control when they fire.

**How to avoid:** Use `vi.useFakeTimers()` (vitest) to control setTimeout. Advance time explicitly with `vi.advanceTimersByTime(160)` to flush debounce.

### Pitfall 4: `fake-indexeddb` not configured before `getDB()` is called

**What goes wrong:** Tests import `storage.ts` which immediately references `openDB` from `idb`. Without a fake IDB environment, the module fails in Node.js.

**Why it happens:** `idb` uses real browser IndexedDB APIs not present in Node.

**How to avoid:** Install `fake-indexeddb` and import `fake-indexeddb/auto` in test setup file before any storage imports. [ASSUMED — confirm `fake-indexeddb` is compatible with `idb` 8.0.3]

---

## Code Examples

### Current buggy implementation (lines 213-223 of storage.ts)

```typescript
// Source: VERIFIED via direct code read of src/lib/storage.ts:213-223
export function debouncedSaveDocuments(session: Session, delayMs = 150): void {
  _pendingDocSession = session;           // ← LINE 214: OVERWRITES — this is the bug
  if (_docDebounceTimer) clearTimeout(_docDebounceTimer);
  _docDebounceTimer = setTimeout(() => {
    if (_pendingDocSession) {
      void saveSession(_pendingDocSession);
      _pendingDocSession = null;
    }
    _docDebounceTimer = null;
  }, delayMs);
}
```

### Call site in handleDocumentsUpdate (page.tsx:80-98)

```typescript
// Source: VERIFIED via direct code read of src/app/session/[id]/page.tsx:80-98
const handleDocumentsUpdate = useCallback(
  (newDocs: Record<string, string>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const mergedDocs = { ...prev.documents };
      for (const [type, content] of Object.entries(newDocs)) {
        mergedDocs[type] = content;    // React-layer merge is correct
      }
      const updated = { ...prev, documents: mergedDocs, updatedAt: Date.now() };
      debouncedSaveDocuments(updated);  // updated is the correct full state
      return updated;
    });
    const newDocType = Object.keys(newDocs)[0];
    if (newDocType) setActiveDoc(newDocType);
  },
  []
);
```

### Where onDocumentsUpdate is called (ChatPanel.tsx:600-601)

```typescript
// Source: VERIFIED via direct code read of src/components/ChatPanel.tsx:600-601
onMessagesUpdate([...newMessages, assistantMsg]);
if (Object.keys(documents).length > 0) onDocumentsUpdate(documents);
// Called ONCE per generation, after streaming completes — not per-token
```

### Proposed test skeleton

```typescript
// Source: [ASSUMED] — vitest + fake-indexeddb pattern
import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debouncedSaveDocuments, getSession } from "@/lib/storage";
import type { Session } from "@/lib/storage";

function makeSession(docs: Record<string, string>): Session {
  return {
    id: "test-session",
    name: "Test",
    projectType: "webapp",
    enabledDocs: Object.keys(docs),
    instructionKey: "master-architect",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    documents: docs,
    documentHistory: [],
  };
}

describe("debouncedSaveDocuments", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("SAVE-01 + SAVE-02: two rapid calls preserve both documents", async () => {
    const sessionA = makeSession({ PRD: "PRD content" });
    const sessionB = makeSession({ PRD: "PRD content", "Tech Spec": "Tech Spec content" });

    debouncedSaveDocuments(sessionA);
    debouncedSaveDocuments(sessionB); // fires before 150ms timer

    await vi.advanceTimersByTimeAsync(160);

    const saved = await getSession("test-session");
    expect(saved?.documents["PRD"]).toBe("PRD content");
    expect(saved?.documents["Tech Spec"]).toBe("Tech Spec content");
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage blob | IndexedDB via `idb` | Recent (migration code present) | Session data now survives larger payloads and multi-tab access |
| Single debounce channel | Two-channel debounce (msg 1500ms, docs 150ms) | Current | Separates chat streaming saves from document saves for perceived performance |
| Overwrite pending state | **Merge pending state (this fix)** | Phase 1 | Eliminates document loss race condition |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `vitest` is the right test runner for this project (over Jest) | Standard Stack | Low — either works; if Jest is preferred, add Babel transform for TypeScript |
| A2 | `fake-indexeddb` is compatible with `idb` 8.0.3 | Don't Hand-Roll / Pitfalls | Medium — if incompatible, need alternative IDB mock or integration test strategy |
| A3 | `vitest` works with Next.js 16's module resolution without special config | Standard Stack | Low-Medium — may need `vitest.config.ts` with `resolve.alias` for `@/*` path |
| A4 | Immediate save (no debounce) is safe for document updates since `onDocumentsUpdate` fires only once per generation | Pattern 2 | Low — confirmed by reading ChatPanel.tsx:601; debounce is optional for docs |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.
(Table is not empty — A1-A4 above need validation before test setup.)

---

## Open Questions

1. **Test framework preference**
   - What we know: No test runner is installed; CLAUDE.md requires tests for the fixed area
   - What's unclear: Whether the team prefers `vitest` vs `jest`; whether a `vitest.config.ts` needs to be committed
   - Recommendation: Use `vitest` — zero transform config for TypeScript. Add `vitest.config.ts` with the `@/*` alias to match `tsconfig.json`

2. **Merge direction when the same docType arrives twice**
   - What we know: `handleDocumentsUpdate` at React level uses `for...of` loop overwriting same-key entries (newer wins)
   - What's unclear: Whether the debounce merge should also apply "newer wins" for same-key documents
   - Recommendation: Yes — use `{ ..._pendingDocSession.documents, ...session.documents }` so the latest AI-generated content always wins

3. **Should the 150ms debounce be kept at all?**
   - What we know: `onDocumentsUpdate` fires once per generation (not per-token), so the debounce adds no performance value
   - What's unclear: Whether future callers might call `debouncedSaveDocuments` more frequently
   - Recommendation: Keep the debounce but fix the merge — it's low risk and keeps the architecture stable

---

## Environment Availability

Step 2.6: No external tools required for this phase. Changes are entirely within the local codebase. Node.js v25.9.0 is available for running tests.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Running tests | Yes | v25.9.0 | — |
| npm | Installing vitest | Yes | bundled with Node | — |
| idb | Storage module | Yes | 8.0.3 (installed) | — |
| fake-indexeddb | Unit tests | No (not installed) | — | Install in Wave 0 |
| vitest | Unit tests | No (not installed) | — | Jest + ts-jest (more config) |

**Missing dependencies with no fallback:** None — all blocking items can be installed via npm.

**Missing dependencies with fallback:**
- `vitest` — required for tests; install in Wave 0 or use Jest (more setup)
- `fake-indexeddb` — required for IDB unit tests; install in Wave 0

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (to be installed — Wave 0 gap) |
| Config file | `vitest.config.ts` (Wave 0 gap) |
| Quick run command | `npx vitest run tests/storage.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SAVE-01 | Two documents generated <150ms apart both persist in IndexedDB | unit | `npx vitest run tests/storage.test.ts` | Wave 0 gap |
| SAVE-02 | Second debounce call merges docs into pending state, does not overwrite | unit | `npx vitest run tests/storage.test.ts` | Wave 0 gap |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/storage.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/storage.test.ts` — covers SAVE-01 and SAVE-02
- [ ] `vitest.config.ts` — path alias `@/*` resolution + `fake-indexeddb/auto` setup
- [ ] Framework install: `npm install --save-dev vitest @vitest/coverage-v8 fake-indexeddb`

---

## Security Domain

This phase modifies client-side storage debounce logic only. No authentication, session management, access control, cryptography, or input from untrusted sources is touched. ASVS categories V2–V6 do not apply.

The only relevant concern is V5 (Input Validation): document content arrives from the Gemini API response and is already parsed by `parseDocumentBlocks()` before reaching this layer. No new trust boundaries are introduced by this fix.

---

## Sources

### Primary (HIGH confidence)
- Direct code read: `src/lib/storage.ts` lines 188-240 — debounce implementation verified
- Direct code read: `src/app/session/[id]/page.tsx` lines 60-115 — `handleDocumentsUpdate` verified
- Direct code read: `src/components/ChatPanel.tsx` lines 590-611 — single `onDocumentsUpdate` call site verified
- `.planning/codebase/CONCERNS.md` — root cause description cross-checked with code
- `package.json` — all installed dependencies and versions verified

### Secondary (MEDIUM confidence)
- `.planning/codebase/ARCHITECTURE.md` — data flow description used to understand save pipeline context

### Tertiary (LOW / ASSUMED)
- vitest as test runner recommendation — training knowledge, not verified via Context7 this session (A1)
- `fake-indexeddb` compatibility with `idb` 8.0.3 — training knowledge (A2)

---

## Metadata

**Confidence breakdown:**
- Root cause identification: HIGH — confirmed by direct code read; bug is exactly one line (line 214)
- Fix approach (merge pattern): HIGH — follows directly from the root cause; merge semantics match what React layer already does correctly
- Test framework recommendation (vitest): MEDIUM — reasonable choice, not verified against Context7 for Next.js 16 compatibility
- fake-indexeddb compatibility: MEDIUM — widely used with idb, not verified in this session

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable domain — idb and TypeScript debounce patterns don't change rapidly)
