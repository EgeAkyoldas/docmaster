# Requirements: DocMaster

**Defined:** 2026-04-16
**Core Value:** Every document the AI generates must reliably persist and be visible to the user

## v1 Requirements

Requirements for this bugfix + hardening cycle. Each maps to roadmap phases.

### Save Reliability

- [ ] **SAVE-01**: User's generated document persists to IndexedDB even when multiple documents are generated in quick succession
- [ ] **SAVE-02**: Debounced save merges pending updates instead of overwriting previous pending state
- [ ] **SAVE-03**: User sees visual confirmation that document was saved successfully
- [ ] **SAVE-04**: If IndexedDB save fails, user sees an error message (not silent failure)

### Stream Protection

- [ ] **STRM-01**: Streaming response aborts automatically after 60 seconds of no data
- [ ] **STRM-02**: User sees timeout error message with option to retry when stream times out

### Error Visibility

- [ ] **ERRV-01**: Network errors show specific message ("No internet connection" vs "API error" vs "Server error")
- [ ] **ERRV-02**: Each error message includes actionable remediation (e.g., "Check your connection and try again")
- [ ] **ERRV-03**: Save failures surface as visible toast/notification, not swallowed silently

### Document Validation

- [ ] **DVAL-01**: Generated document is validated as non-empty before saving
- [ ] **DVAL-02**: Generated document is checked for AI refusal patterns and user is warned
- [ ] **DVAL-03**: Generated document shorter than threshold triggers a warning to user

## v2 Requirements

### Retry Logic

- **RTRY-01**: Failed API calls retry with exponential backoff for 429/503 errors
- **RTRY-02**: User sees retry progress ("Retrying in 3s...")

### Observability

- **OBSV-01**: Error events logged to external service (Sentry/similar)
- **OBSV-02**: Storage usage displayed in UI with quota warnings

### Testing

- **TEST-01**: Integration tests for document save pipeline race conditions
- **TEST-02**: Unit tests for document marker parsing edge cases

## Out of Scope

| Feature | Reason |
|---------|--------|
| Database backend migration | IndexedDB is appropriate for client-side single-user tool |
| Real-time collaboration | Single-user tool, not a collaborative editor |
| Authentication system | API key per-session is sufficient |
| Mobile app | Web-first, browser handles responsive |
| Rewriting streaming parser | Current SSE parser works; hardening via timeout is sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SAVE-01 | Phase 1 | Pending |
| SAVE-02 | Phase 1 | Pending |
| SAVE-03 | Phase 2 | Pending |
| SAVE-04 | Phase 2 | Pending |
| STRM-01 | Phase 3 | Pending |
| STRM-02 | Phase 3 | Pending |
| ERRV-01 | Phase 2 | Pending |
| ERRV-02 | Phase 2 | Pending |
| ERRV-03 | Phase 2 | Pending |
| DVAL-01 | Phase 4 | Pending |
| DVAL-02 | Phase 4 | Pending |
| DVAL-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-04-16*
*Last updated: 2026-04-16 — traceability filled after roadmap creation*
