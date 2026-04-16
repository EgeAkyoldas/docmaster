---
phase: 01-save-pipeline-fix
reviewed: 2026-04-16T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - vitest.config.ts
  - tests/storage.test.ts
  - src/lib/storage.ts
  - package.json
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-04-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the save pipeline implementation in `src/lib/storage.ts`, the new test file `tests/storage.test.ts`, the vitest config, and `package.json`. The `debouncedSaveDocuments` merge fix is correctly implemented -- it merges document maps across rapid calls so no document is silently dropped. However, two significant issues remain: (1) `flushPendingSave` can race two concurrent `saveSession` calls against the same session, and (2) `debouncedSaveSession` (the message channel) has the same overwrite-not-merge pattern that was just fixed in the document channel. The test file is functional but has inter-test coupling through timer state leaking across tests.

## Critical Issues

### CR-01: flushPendingSave races two concurrent saves for the same session

**File:** `src/lib/storage.ts:233-248`
**Issue:** `flushPendingSave` fires `void saveSession(_pendingMsgSession)` and `void saveSession(_pendingDocSession)` without awaiting either. If both channels have pending data for the same session ID, two concurrent `db.put(STORE, ...)` calls race. The second `put` overwrites the first because neither reads-then-merges -- whichever IndexedDB transaction commits last wins, silently discarding the other channel's changes. This directly undermines the core value: "If the AI says it created a document, the user must see it."
**Fix:** Merge both pending states into a single session object before saving, or serialize the saves:
```typescript
export async function flushPendingSave(): Promise<void> {
  if (_msgDebounceTimer) clearTimeout(_msgDebounceTimer);
  if (_docDebounceTimer) clearTimeout(_docDebounceTimer);

  // Merge both channels into one save if they target the same session
  let toSave: Session | null = null;
  if (_pendingMsgSession && _pendingDocSession && _pendingMsgSession.id === _pendingDocSession.id) {
    toSave = {
      ..._pendingMsgSession,
      documents: { ..._pendingMsgSession.documents, ..._pendingDocSession.documents },
      updatedAt: Math.max(_pendingMsgSession.updatedAt, _pendingDocSession.updatedAt),
    };
    _pendingMsgSession = null;
    _pendingDocSession = null;
    await saveSession(toSave);
  } else {
    if (_pendingMsgSession) {
      const s = _pendingMsgSession;
      _pendingMsgSession = null;
      await saveSession(s);
    }
    if (_pendingDocSession) {
      const s = _pendingDocSession;
      _pendingDocSession = null;
      await saveSession(s);
    }
  }

  _msgDebounceTimer = null;
  _docDebounceTimer = null;
}
```

## Warnings

### WR-01: debouncedSaveSession overwrites pending state instead of merging

**File:** `src/lib/storage.ts:197-207`
**Issue:** `debouncedSaveSession` sets `_pendingMsgSession = session` on every call (line 198), completely replacing any previously pending session. If two rapid calls carry different messages (e.g., streaming tokens arrive in batches), the first batch's messages are lost. This is the exact same overwrite pattern that was identified and fixed in `debouncedSaveDocuments` for documents, but remains unfixed for the message channel.
**Fix:** Apply the same merge strategy used in `debouncedSaveDocuments`. At minimum, merge the messages array:
```typescript
export function debouncedSaveSession(session: Session, delayMs = 1500): void {
  if (_pendingMsgSession) {
    _pendingMsgSession = {
      ...session,
      messages: session.messages, // latest messages array wins (append-only)
      documents: { ..._pendingMsgSession.documents, ...session.documents },
    };
  } else {
    _pendingMsgSession = session;
  }
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

### WR-02: saveSession errors silently swallowed in debounce callbacks

**File:** `src/lib/storage.ts:202, 226, 237, 243`
**Issue:** All four `void saveSession(...)` call sites discard the returned promise. If IndexedDB throws (quota exceeded, transaction aborted, database closed), the error vanishes. The user sees no indication that their work was not persisted.
**Fix:** Add `.catch()` error handling that surfaces the failure, or use a shared error handler:
```typescript
void saveSession(_pendingDocSession).catch((err) => {
  console.error("[storage] failed to save documents:", err);
  // Optionally: re-queue the pending session for retry
});
```

### WR-03: Test inter-coupling through timer state leakage

**File:** `tests/storage.test.ts:31-38, 63`
**Issue:** `flushDebounce()` calls `vi.useRealTimers()` (line 35), which leaks timer state to subsequent tests. The second test (SAVE-02, line 63) must re-call `vi.useFakeTimers()` inside the test body to compensate. If a test is reordered, added, or run in isolation, timer state may be incorrect, causing flaky failures.
**Fix:** Move the real-timer restoration logic so each test is self-contained. One approach: have `flushDebounce` accept a cleanup flag, or restructure so `beforeEach`/`afterEach` always control timer state:
```typescript
async function flushDebounce(): Promise<void> {
  vi.advanceTimersByTime(160);
  vi.useRealTimers();
  await new Promise((resolve) => setTimeout(resolve, 50));
  // Re-enable fake timers so the next test starts clean
  vi.useFakeTimers();
}
```
Then remove the redundant `vi.useFakeTimers()` from line 63 of SAVE-02.

## Info

### IN-01: Empty catch blocks in migration code

**File:** `src/lib/storage.ts:83, 98, 106`
**Issue:** Three empty catch blocks silently swallow all errors during localStorage migration. While corruption is expected, logging even at debug level would help diagnose migration failures in production.
**Fix:** Add minimal logging:
```typescript
} catch (e) {
  console.warn("[storage] migration: skipping corrupt legacy blob", e);
}
```

### IN-02: Vitest environment mismatch with browser API testing

**File:** `vitest.config.ts:6`
**Issue:** The test environment is set to `"node"` but the tests exercise browser APIs (IndexedDB, window, localStorage) via manual stubs. Using `jsdom` or `happy-dom` would provide these globals natively, reducing stub boilerplate and risk of incomplete shimming.
**Fix:** Consider changing environment or using a per-file override:
```typescript
test: {
  environment: "jsdom", // or "happy-dom"
  globals: true,
},
```

---

_Reviewed: 2026-04-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
