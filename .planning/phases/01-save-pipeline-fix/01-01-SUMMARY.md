---
phase: 01-save-pipeline-fix
plan: 01
subsystem: storage
tags: [bugfix, tdd, indexeddb, debounce, merge]
dependency_graph:
  requires: []
  provides: [fixed-debounce-merge, test-infrastructure]
  affects: [src/lib/storage.ts]
tech_stack:
  added: [vitest, fake-indexeddb, @vitest/coverage-v8]
  patterns: [tdd-red-green, fake-timer-with-idb-flush, module-global-stub]
key_files:
  created:
    - vitest.config.ts
    - tests/storage.test.ts
  modified:
    - src/lib/storage.ts
    - package.json
decisions:
  - "Spread order { ..._pendingDocSession.documents, ...session.documents } — newer wins on conflict, matching React layer intent"
  - "Stubbed window and localStorage globals for Node test environment rather than using jsdom"
  - "Used sync advanceTimersByTime + restore real timers pattern to avoid fake-timer/IDB conflict"
metrics:
  duration_seconds: 199
  completed: 2026-04-16
  tasks_completed: 2
  tasks_total: 2
---

# Phase 01 Plan 01: Fix Document Persistence Race Condition Summary

Merge-based debounce fix for debouncedSaveDocuments with TDD proof via vitest and fake-indexeddb.

## What Changed

### src/lib/storage.ts (the fix)

Replaced the single overwrite assignment `_pendingDocSession = session;` with a merge branch:

```typescript
if (_pendingDocSession) {
  _pendingDocSession = {
    ...session,
    documents: { ..._pendingDocSession.documents, ...session.documents },
  };
} else {
  _pendingDocSession = session;
}
```

The spread order is load-bearing: incoming `session` documents are second so newer content wins on key conflict. This matches the React layer's `handleDocumentsUpdate` intent where the latest AI-generated content should prevail.

**Not changed:**
- `debouncedSaveSession` (Channel 1, message saves) -- correct as-is, different function
- `flushPendingSave` -- reads `_pendingDocSession` and now correctly flushes the merged session
- `src/app/session/[id]/page.tsx` -- React layer merge is already correct; the bug was storage-only

### Test Infrastructure

- Installed vitest, @vitest/coverage-v8, fake-indexeddb as devDependencies
- Created vitest.config.ts with `@/*` path alias matching tsconfig.json
- Added `test` and `test:watch` scripts to package.json

### tests/storage.test.ts

Two tests covering the race condition:
- **SAVE-01**: Two rapid calls with different document keys -- both persist after timer fires
- **SAVE-02**: Second call with only Doc-B does not overwrite first call's Doc-A

Test approach: `vi.useFakeTimers()` controls the 150ms debounce, then real timers are restored before IDB async operations to avoid fake-timer/IDB conflicts.

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run tests/storage.test.ts` | 2 passed, exit 0 |
| `npx tsc --noEmit` | Clean, exit 0 |
| Merge spread present in storage.ts | Yes |
| Channel 1 unchanged | Yes |
| flushPendingSave unchanged | Yes |

## Requirements Closed

- **SAVE-01**: Document persists even when multiple documents generated in quick succession
- **SAVE-02**: Debounced save merges pending updates instead of overwriting

## Commits

| Task | Type | Hash | Description |
|------|------|------|-------------|
| 1 (RED) | test | 8d49fce | Add failing tests for document persistence race condition |
| 2 (GREEN) | feat | f229b36 | Fix document merge in debouncedSaveDocuments |

## TDD Gate Compliance

- RED gate: `test(01-01)` commit 8d49fce -- both tests fail against buggy implementation
- GREEN gate: `feat(01-01)` commit f229b36 -- both tests pass after merge fix
- REFACTOR gate: Not needed -- fix is minimal (9 lines added, 1 removed)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed test environment stubs for Node**
- **Found during:** Task 1
- **Issue:** storage.ts has `typeof window === "undefined"` guards that cause `saveSession` and `getSession` to return early in Node. `localStorage` also unavailable.
- **Fix:** Added `vi.stubGlobal("window", globalThis)` and `vi.stubGlobal("localStorage", ...)` before imports
- **Files modified:** tests/storage.test.ts
- **Commit:** 8d49fce

**2. [Rule 3 - Blocking] Fixed fake-timer/IDB async conflict**
- **Found during:** Task 1
- **Issue:** `vi.advanceTimersByTimeAsync(160)` caused test timeout because fake timers blocked IDB internal async operations
- **Fix:** Used sync `vi.advanceTimersByTime(160)` to fire debounce callback, then `vi.useRealTimers()` before awaiting IDB operations
- **Files modified:** tests/storage.test.ts
- **Commit:** 8d49fce

**3. [Rule 1 - Bug] Fixed SAVE-01 test to actually test merge**
- **Found during:** Task 1
- **Issue:** Original plan had sessionB containing both PRD and Tech Spec, so the overwrite bug wouldn't cause SAVE-01 to fail (sessionB already had all docs)
- **Fix:** Changed sessionB to contain only Tech Spec, making PRD only in sessionA -- now the overwrite bug correctly causes SAVE-01 to fail
- **Files modified:** tests/storage.test.ts
- **Commit:** 8d49fce

## Self-Check: PASSED

All files exist, all commits verified, SUMMARY created.
