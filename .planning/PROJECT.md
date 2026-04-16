# DocMaster

## What This Is

DocMaster is an AI-powered document generation tool that helps users create structured project documentation through a chat interface. Users select a project type, chat with an AI architect (Google Gemini), and the AI generates, verifies, and harmonizes documents like PRDs, tech specs, and design docs. Built with Next.js, React, and IndexedDB for client-side persistence.

## Core Value

Every document the AI generates must reliably persist and be visible to the user. If the AI says it created a document, the user must see it.

## Requirements

### Validated

- ✓ Multi-project-type support (webapp, game, business, design-system, marketing, infrastructure) — existing
- ✓ AI chat interface with streaming responses via Google Gemini — existing
- ✓ Document generation from chat with `~~~doc:Type~~~` marker parsing — existing
- ✓ Guided mode with topic checklists for structured document interviews — existing
- ✓ Document preview and inline editing — existing
- ✓ Cross-document verification and issue detection — existing
- ✓ Surgical patch application for auto-fixes — existing
- ✓ Full harmonization mode for batch fixes — existing
- ✓ Session management with IndexedDB persistence — existing
- ✓ User-supplied API key support via request headers — existing
- ✓ Image generation from chat markers — existing
- ✓ Document version history tracking — existing
- ✓ ZIP export of documents — existing
- ✓ Custom instruction editing per session — existing

### Active

- [ ] Fix document persistence race condition — documents lost when generated in quick succession
- [ ] Ensure debounced save merges pending updates instead of overwriting
- [ ] Add stream timeout protection — prevent infinite hang if server stops responding
- [ ] Show clear error messages instead of silent failures
- [ ] Validate generated documents aren't empty or garbage before saving
- [ ] Add save confirmation feedback — user knows document was persisted

### Out of Scope

- Real-time collaboration — single-user tool
- Authentication/user accounts — API key is per-session
- Mobile app — web-first
- External logging/monitoring service integration — local tool
- Database backend — IndexedDB is appropriate for client-side persistence

## Context

DocMaster is a working application with a critical bug: after generating 1-2 documents, subsequent document generations appear to succeed (AI responds correctly) but the document silently fails to persist to IndexedDB. The root cause is a race condition in the debounced save system where a global `_pendingDocSession` variable gets overwritten instead of merged when multiple saves arrive within the 150ms debounce window.

The codebase has no tests. Previous bugs (hidden format prompts, doc marker parsing) were fixed recently. The verification/harmonization system works but can mask the save bug since it operates on in-memory state.

## Constraints

- **Tech Stack**: Next.js 16 + React 19 + TypeScript — established, no migration
- **AI Provider**: Google Gemini API — deeply integrated in prompt engineering and streaming
- **Storage**: IndexedDB via `idb` library — client-side only, no server database
- **No Tests**: Zero test coverage currently — any fix should include tests for the fixed area

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fix debounce with merge-based approach | Overwrite-based debounce is the root cause; merging pending updates preserves all documents | — Pending |
| Add tests for save pipeline | No tests exist; the save race condition proves this area needs coverage | — Pending |
| Immediate save for documents (remove debounce) | 150ms cost is negligible vs reliability; documents are high-value user data | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-16 after initialization*
