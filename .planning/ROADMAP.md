# Roadmap: DocMaster Bugfix + Hardening

## Overview

This cycle fixes a critical document persistence race condition and hardens the application with stream timeout protection, actionable error messages, and document quality validation. The codebase already works — every phase tightens a specific failure mode until the core value (every generated document reliably persists and is visible) is robustly true.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Save Pipeline Fix** - Eliminate the debounce race condition that silently drops documents
- [ ] **Phase 2: User Feedback Layer** - Surface save confirmations and errors so users know when things succeed or fail
- [ ] **Phase 3: Stream Protection** - Add timeout and user-visible recovery for stalled streaming responses
- [ ] **Phase 4: Document Validation** - Validate generated content before saving to prevent empty or garbage documents

## Phase Details

### Phase 1: Save Pipeline Fix
**Goal**: Documents persist reliably even when multiple are generated in quick succession
**Depends on**: Nothing (first phase)
**Requirements**: SAVE-01, SAVE-02
**Success Criteria** (what must be TRUE):
  1. User generates two documents back-to-back within 150ms and both appear in the preview panel
  2. After any document generation, the document is present in IndexedDB immediately (not lost to debounce overwrite)
  3. Rapid successive document saves accumulate (merge) rather than overwrite pending state
**Plans**: TBD

### Phase 2: User Feedback Layer
**Goal**: Users can see confirmation that documents saved and understand what went wrong when errors occur
**Depends on**: Phase 1
**Requirements**: SAVE-03, SAVE-04, ERRV-01, ERRV-02, ERRV-03
**Success Criteria** (what must be TRUE):
  1. After a document saves successfully, user sees a visible confirmation (toast or indicator)
  2. If IndexedDB fails to save, user sees an error notification — not silence
  3. Network errors show specific messages ("No internet connection" vs "API error" vs "Server error") rather than a generic fallback
  4. Every error message includes a concrete action the user can take to recover
**Plans**: TBD
**UI hint**: yes

### Phase 3: Stream Protection
**Goal**: Stalled or hung streaming responses terminate automatically and give users a clear path forward
**Depends on**: Phase 2
**Requirements**: STRM-01, STRM-02
**Success Criteria** (what must be TRUE):
  1. A streaming response that stops sending data for 60 seconds is automatically aborted
  2. After a timeout, user sees an error message explaining what happened and a retry option
  3. User is never stuck in an infinite "thinking" state requiring a full page reload
**Plans**: TBD

### Phase 4: Document Validation
**Goal**: Generated documents are checked for quality before saving so garbage or refusal content never silently lands in a session
**Depends on**: Phase 3
**Requirements**: DVAL-01, DVAL-02, DVAL-03
**Success Criteria** (what must be TRUE):
  1. An empty document from the AI is rejected at parse time — no empty document is saved
  2. If the AI returns a refusal ("I can't generate...") instead of content, user sees a warning before anything is saved
  3. A document shorter than the minimum threshold triggers a visible warning so the user can decide whether to keep or regenerate
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Save Pipeline Fix | 0/TBD | Not started | - |
| 2. User Feedback Layer | 0/TBD | Not started | - |
| 3. Stream Protection | 0/TBD | Not started | - |
| 4. Document Validation | 0/TBD | Not started | - |
