# Codebase Concerns

**Analysis Date:** 2026-04-16

## Critical Issues

### Document Generation Not Persisting (Race Condition in Document Save Pipeline)

**Issue:** After creating 1-2 documents, the AI answers and appears to complete, but the document doesn't actually persist to IndexedDB or appear in the preview panel.

**Root Cause:** Race condition in debounced document saves (`src/lib/storage.ts:213-223`)

- When user generates Document A, `debouncedSaveDocuments()` is called with 150ms delay
- If user generates Document B before A is saved (common in fast workflows), a new call to `debouncedSaveDocuments()` occurs
- The second call OVERWRITES `_pendingDocSession` (the global variable holding the Session to save), resetting the timer
- If Document A's save was pending but hadn't flushed yet, Document A gets lost from the pending state
- The second generation then saves with only its own changes, overwriting A's state in the debounce queue
- **Additionally**: After `handleDocumentsUpdate` in `src/app/session/[id]/page.tsx:80-98` calls `debouncedSaveDocuments`, React hasn't yet finished flushing the `setSession` state update, so timings are unpredictable

**Files:**
- `src/lib/storage.ts` - Lines 209-223 (debounced save logic)
- `src/app/session/[id]/page.tsx` - Lines 80-98 (handleDocumentsUpdate calls debounce)
- `src/components/ChatPanel.tsx` - Lines 600-601 (calls onDocumentsUpdate)

**Impact:**
- Documents generated in quick succession (within 150ms) can be lost entirely
- User sees AI complete response but document never appears in preview
- No error message or warning — appears to work silently
- Affects 1-2 document workflows especially

**Fix Approach:**
Replace global-variable debounce with queue-based accumulation:
1. Instead of storing single `_pendingDocSession`, store array of pending updates with timestamps
2. When new doc arrives before flush, MERGE it into `_pendingDocSession` rather than overwrite
3. Or switch to immediate IndexedDB saves without debounce (150ms cost is negligible vs reliability)
4. Or use Promise-based batching: collect updates in an array and flush once every 150ms with all accumulated changes

**Priority:** CRITICAL - This is the primary user-reported bug

---

## Known Bugs (Recently Fixed)

### Hidden Format Prompts Not Reaching AI (FIXED in commit 627ca8a)

**Previous Issue:** Document generation markers (`~~~doc:KEY~~~`) were not being sent to the AI because `sendMessage` used stale `messages` state instead of `newMessages` for the API history.

**Status:** FIXED - Now correctly uses `newMessages` (line 512 in `src/components/ChatPanel.tsx`)

**Lesson:** State in React closures can become stale; always pass newest state to async operations.

---

## Tech Debt & Fragile Areas

### Document Marker Parsing Is Complex State Machine

**Files:** `src/lib/utils.ts:15-94` (parseDocumentBlocks function)

**Issue:** Line-by-line state machine tracks:
- Active document name
- Which fence type opened the block (~~~ vs ```)
- Nested code fence depth
- Whether we're inside an inner fence or outer doc fence

**Why Fragile:**
- State machine has multiple branches that must stay in sync
- Mixed fence types (doc opened with ~~~ containing ``` blocks) require careful handling
- Recent fix (commit 536a67e) added backtick variant support, showing how easy it is to miss edge cases

**Risk:**
- If AI generates documents with unusual markdown patterns, parsing might fail silently
- Inner code blocks with closing markers could confuse parser
- Currently handles ``` and ~~~ but if new marker format is needed, state machine becomes harder

**Improvement Path:**
1. Add comprehensive unit tests for edge cases (nested fences, mixed types, etc.)
2. Consider regex-based alternative if performance acceptable
3. Add error logging if document marker not properly closed

---

### SSE Streaming Parser Uses Manual Buffer Management

**Files:** `src/components/ChatPanel.tsx:543-584`

**Issue:** SSE parsing buffers incomplete lines manually:
```typescript
sseBuffer += decoder.decode(value, { stream: true });
const sseLines = sseBuffer.split("\n");
sseBuffer = sseLines.pop() ?? ""; // Keep incomplete last line in buffer
```

**Why Fragile:**
- If a single SSE event larger than buffer size arrives, split on "\n" could miss partial JSON
- TextDecoder with `stream: true` can split UTF-8 characters mid-sequence
- No validation that JSON.parse succeeds before throwing parsing errors

**Risk:**
- Large responses might have JSON parsing errors if split awkwardly
- Unicode characters could be corrupted if split at wrong byte boundary
- Silent catch at line 580 swallows parse errors

**Mitigation:** Works in practice due to GPT streaming typically using small chunks, but theoretically fragile

---

## Performance Concerns

### RAF Batching in Streaming Could Cause Frame Drops

**Files:** `src/components/ChatPanel.tsx:571-576`

**Issue:** Each streamed token triggers a RequestAnimationFrame batch update. If 100+ tokens arrive before RAF flushes, fullText grows linearly but state updates batch.

**Impact:** Low - typically acceptable since streaming is slow (~10 tokens/sec), but on fast connections could cause jank

**Fix:** Already well-designed with `rafId` check to avoid duplicate scheduling

---

### IndexedDB Transactions Not Optimized

**Files:** `src/lib/storage.ts:111-118` (migration), `src/lib/storage.ts:142-147` (saveSession)

**Issue:** Each `saveSession` is a separate transaction. No bulk operations.

**Impact:** Negligible for single document saves, but if verifier batch-applies fixes, each fix might be a separate save

---

## Test Coverage Gaps

### No Tests for Document Persistence Race Conditions

**What's Not Tested:** 
- Multiple `debouncedSaveDocuments` calls in quick succession
- Whether second document save preserves first document's changes
- IndexedDB write ordering under concurrent updates

**Files:** No test files exist in codebase

**Risk:** HIGH - This is where the bug was hiding

**Priority:** Add integration test simulating:
1. Generate Document A → check saved
2. Generate Document B (before A flush) → check BOTH saved
3. Verify Session.documents contains both keys

---

### Image Generation Error Handling Not Tested

**Files:** `src/components/ChatPanel.tsx:419-435` (generateImage callback)

**What's Not Tested:**
- Network errors during image generation
- Invalid prompt handling
- Parallel image requests

**Risk:** Image generation failures silently mark status as "error" but user might not notice

---

## Missing Critical Features

### No Explicit Document Version Snapshots Before Generation

**Files:** `src/app/session/[id]/page.tsx:118-144` (handleSnapshotVersions)

**Issue:** Verifier calls `onSnapshotVersions` to save before/after, but normal document generation doesn't.

**Impact:** No undo/rollback if AI generates incorrect content. History exists but isn't snapshotted at generation time.

**Recommendation:** Call `onSnapshotVersions` after each successful document generation (line 601 in ChatPanel)

---

### No Timeout Protection on Streaming

**Files:** `src/components/ChatPanel.tsx:545-588`

**Issue:** While loop reads from response.body with no timeout. If server stops sending, stream hangs forever.

**Impact:** User stuck in streaming state, must reload page

**Fix Approach:** Add AbortController timeout:
```typescript
const streamTimeout = setTimeout(() => {
  controller.abort();
}, 60000); // 60s timeout
```

---

### Missing Retry Logic for Failed API Calls

**Files:** `src/components/ChatPanel.tsx:507-536`

**Issue:** Single fetch attempt; if network flaky, entire generation lost

**Current Workaround:** User must regenerate manually

**Recommendation:** Implement exponential backoff for 429/503 errors (already detected, just need retry)

---

## Security Considerations

### API Keys Stored in localStorage

**Files:** `src/lib/useApiKey.ts`

**Risk:** LOW for this use case (user's own API key), but not ideal

**Recommendation:** Document that users should use proxy/environment variable for production

### Verify API Requires Documents in Request Body

**Files:** `src/app/api/verify/route.ts:12-15`

**Current:** No size limit on documents payload

**Risk:** MEDIUM - Large documents in verify request could cause memory issues

**Recommendation:** Add MAX_PAYLOAD_SIZE check (typical: 32MB for Vercel)

---

## Scaling Limits

### IndexedDB Storage No Quota Management

**Files:** `src/lib/storage.ts`

**Current:** Stores unlimited documents and history

**Limit:** Browser typically allows 50MB-500MB depending on browser

**When Hit:** User gets cryptic IndexedDB quota exceeded error

**Recommendation:** 
- Implement warning at 80% quota
- Auto-delete oldest sessions when approaching limit
- Show storage usage in UI

---

### Chat History Trimmed But Not Deleted

**Files:** `src/lib/storage.ts:247-254`

**Issue:** Messages trimmed to last 200, but older messages deleted from Session, not from IndexedDB if user switches projects

**Impact:** Negligible for single user, but good-to-know for data hygiene

---

## Dependencies at Risk

### Framer Motion Animation Library Not Type-Safe

**Files:** `src/components/*.tsx` (multiple animation props)

**Risk:** LOW - stable library, widely used

**Concern:** Future Next.js versions might deprecate animation patterns used

---

## Architecture Concerns

### Two-Channel Debounce System is Confusing

**Files:** `src/lib/storage.ts:188-223`

**Issue:** 
- Channel 1: `debouncedSaveSession` (1500ms) for messages
- Channel 2: `debouncedSaveDocuments` (150ms) for documents

**Why Confusing:**
- Separate timers, separate pending states
- Could be unified with a single smart debounce
- No explanation why two channels needed (though rationale makes sense: message saves are low-priority, doc saves are high-priority)

**Improvement:** Add JSDoc explaining why two channels, or refactor to single debounce with priority queuing

---

## Error Handling Gaps

### Vague "Connection Error" Message

**Files:** `src/components/ChatPanel.tsx:619`

**Issue:** Generic error shown if any non-custom error occurs

**Fix:** Add more specific error detection:
- Check for `ERR_INTERNET_DISCONNECTED`
- Distinguish API errors vs network errors
- Show actionable remediation

---

## Data Quality Concerns

### No Validation of Generated Documents

**Files:** `src/components/ChatPanel.tsx:591`

**Issue:** After parsing, no check that:
- Document contains expected content
- Document isn't empty
- Document isn't just "I can't generate..."

**Recommendation:** Add post-parse validation:
```typescript
if (documents[type]?.trim().length < 100) {
  // Warn user or requeue
}
```

---

## Monitoring & Observability

### No Error Logging to External Service

**Files:** All API routes

**Issue:** Errors logged to console only; can't debug production issues

**Recommendation:** Add Sentry/Datadog integration with:
- API key validation errors (sanitized)
- Streaming timeouts
- Verify failures
- IndexedDB quota exceeded

---

*Concerns audit: 2026-04-16*
