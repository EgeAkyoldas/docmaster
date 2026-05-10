# Phase 1: Save Pipeline Fix - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 3 (1 modified, 1 read-only reference, 1 new)
**Analogs found:** 2 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/storage.ts` (modify `debouncedSaveDocuments`) | utility / data layer | event-driven (debounce + IndexedDB write) | `src/lib/storage.ts` — `debouncedSaveSession` (lines 197-207) | exact — same file, same pattern, same debounce channel structure |
| `tests/storage.test.ts` | test | batch (setup → call N times → flush → assert) | No test files exist in project | no analog — use RESEARCH.md skeleton |
| `vitest.config.ts` | config | — | No vitest config exists in project | no analog — new infrastructure file |

---

## Pattern Assignments

### `src/lib/storage.ts` — fix `debouncedSaveDocuments` (utility, event-driven)

**Analog:** `debouncedSaveSession` in the same file — `src/lib/storage.ts` lines 197-207. This is an exact structural match: same module-level timer variable, same pending-session variable, same `setTimeout` shell. The only difference is the fix adds a merge branch when `_pendingDocSession` already holds a value.

**Current (buggy) implementation** (`src/lib/storage.ts` lines 213-223):
```typescript
export function debouncedSaveDocuments(session: Session, delayMs = 150): void {
  _pendingDocSession = session;           // ← line 214: OVERWRITES — this is the bug
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

**Analog to copy structure from** (`src/lib/storage.ts` lines 197-207 — `debouncedSaveSession`):
```typescript
export function debouncedSaveSession(session: Session, delayMs = 1500): void {
  _pendingMsgSession = session;
  if (_msgDebounceTimer) clearTimeout(_msgDebounceTimer);
  _msgDebounceTimer = setTimeout(() => {
    if (_pendingMsgSession) {
      void saveSession(_pendingMsgSession);
      _pendingMsgSession = null;
    }
    _msgDebounceTimer = null;
  }, delayMs);
}
```

**Fixed implementation** (from RESEARCH.md — verified pattern, lines 148-166):
```typescript
export function debouncedSaveDocuments(session: Session, delayMs = 150): void {
  if (_pendingDocSession) {
    // Merge documents — pending (older) first, incoming (newer) second — newer wins on conflict
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

**Key rules from codebase conventions to maintain:**
- 2-space indentation, always semicolons
- `void` prefix on fire-and-forget promise calls (established pattern: `void saveSession(...)` on lines 202, 219, 229, 236)
- Named export with explicit return type annotation (`void`)
- Module-level variables use underscore prefix: `_pendingDocSession`, `_docDebounceTimer`
- Object spreads for immutable updates — never mutate `_pendingDocSession.documents` in place (strict TypeScript mode)
- Section delimiter comment above this function already exists (line 209): preserve it

**flushPendingSave also reads `_pendingDocSession`** — the fix does not change its semantics. `flushPendingSave` (lines 225-240) already reads `_pendingDocSession` and calls `saveSession` on it. After the merge fix, `_pendingDocSession` will hold the fully-merged session at flush time, which is correct behavior. No change needed there.

---

### `tests/storage.test.ts` (test, batch)

**Analog:** None — zero test files exist in the project source tree. Use the skeleton from RESEARCH.md lines 298-336 as the primary pattern source.

**Test file conventions to derive from project style:**
- Named imports, no default imports (consistent with `src/lib/storage.ts` export style)
- camelCase helper functions (e.g., `makeSession`)
- 2-space indentation, semicolons always
- Path alias `@/lib/storage` — requires `vitest.config.ts` to resolve (see below)

**Test skeleton pattern** (source: RESEARCH.md, ASSUMED — verify vitest + fake-indexeddb compatibility):
```typescript
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

**Session interface shape** (from `src/lib/storage.ts` lines 18-30 — use this to keep `makeSession` valid):
```typescript
export interface Session {
  id: string;
  name: string;
  projectType: string;
  enabledDocs: string[];
  instructionKey: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  documents: Record<string, string>;
  documentHistory: DocVersion[];
  customInstructions?: Record<string, string>;
}
```

---

### `vitest.config.ts` (config)

**Analog:** None — no test runner config exists. Create from scratch based on tsconfig.json path aliases.

**Path alias to mirror** (from `tsconfig.json` lines 24-27):
```json
"paths": {
  "@/*": ["./src/*"]
}
```

**Required vitest config pattern** (source: RESEARCH.md assumptions A1, A3 — validate before use):
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Note:** `fake-indexeddb/auto` must be imported at the top of each test file (or in a global setup file) before any import of `storage.ts`, because `idb`'s `openDB` references the browser `indexedDB` global which is not present in Node.js.

---

## Shared Patterns

### Debounce channel structure
**Source:** `src/lib/storage.ts` lines 192-223 (both channels)
**Apply to:** `debouncedSaveDocuments` fix only
```typescript
// Pattern: two module-level variables per channel
let _docDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingDocSession: Session | null = null;

// Pattern: always null-check before clearTimeout, always null the timer after
if (_docDebounceTimer) clearTimeout(_docDebounceTimer);
_docDebounceTimer = setTimeout(() => {
  // ...
  _docDebounceTimer = null;
}, delayMs);
```

### Immutable session object spread
**Source:** `src/app/session/[id]/page.tsx` lines 84-88 (`handleDocumentsUpdate`)
**Apply to:** The merge expression inside `debouncedSaveDocuments`
```typescript
// Pattern: spread existing, then override with incoming — newer wins
const mergedDocs = { ...prev.documents };
for (const [type, content] of Object.entries(newDocs)) {
  mergedDocs[type] = content;
}
const updated = { ...prev, documents: mergedDocs, updatedAt: Date.now() };
```
The debounce fix uses the equivalent: `{ ..._pendingDocSession.documents, ...session.documents }` where the second spread (incoming) wins on key conflict — matching the React layer's intent.

### Fire-and-forget async pattern
**Source:** `src/lib/storage.ts` lines 202, 219, 229, 236
**Apply to:** All `saveSession(...)` call sites inside debounce timers
```typescript
void saveSession(_pendingDocSession);  // void = intentional fire-and-forget
```

### `setSession` updater pattern (do not change)
**Source:** `src/app/session/[id]/page.tsx` lines 80-98
**Apply to:** `handleDocumentsUpdate` — confirmed no change needed here
```typescript
const handleDocumentsUpdate = useCallback(
  (newDocs: Record<string, string>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const mergedDocs = { ...prev.documents };
      for (const [type, content] of Object.entries(newDocs)) {
        mergedDocs[type] = content;
      }
      const updated = { ...prev, documents: mergedDocs, updatedAt: Date.now() };
      debouncedSaveDocuments(updated);  // updated is correct full accumulated state
      return updated;
    });
    const newDocType = Object.keys(newDocs)[0];
    if (newDocType) setActiveDoc(newDocType);
  },
  []
);
```
This is the correct call pattern. The `updated` value passed to `debouncedSaveDocuments` already contains the React-merged document set. The planner must NOT move this call outside the `setSession` updater — doing so would create a stale-closure bug (see RESEARCH.md Pitfall 2).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `tests/storage.test.ts` | test | batch | Zero test files exist in the project source |
| `vitest.config.ts` | config | — | No test runner infrastructure exists; entirely new |

---

## Critical Constraints for Planner

1. **One-line bug, one-file fix:** The sole source code change is in `src/lib/storage.ts` at line 214. Replace the overwrite `_pendingDocSession = session` with the merge branch shown above. No other source files need modification.

2. **`handleDocumentsUpdate` is correct as-is:** `src/app/session/[id]/page.tsx` lines 80-98 must not be changed. The React-layer merge is already correct.

3. **Wave 0 infrastructure required before tests can run:**
   - `npm install --save-dev vitest @vitest/coverage-v8 fake-indexeddb`
   - `vitest.config.ts` must be created at project root with `@/*` alias
   - `tests/storage.test.ts` must import `"fake-indexeddb/auto"` as the first import

4. **Merge direction is load-bearing:** In the spread `{ ..._pendingDocSession.documents, ...session.documents }`, order matters — incoming (newer) must be second so it wins on key conflict. Reversing this is Pitfall 1 from RESEARCH.md.

5. **Strict TypeScript:** No direct mutation of `_pendingDocSession.documents`. Always spread to a new object.

---

## Metadata

**Analog search scope:** `src/lib/storage.ts` (debounce channels), `src/app/session/[id]/page.tsx` (call site), `src/components/ChatPanel.tsx` (upstream trigger)
**Files scanned:** 5 source files + `package.json` + `tsconfig.json` + `CLAUDE.md`
**Pattern extraction date:** 2026-04-16
