# Architecture

**Analysis Date:** 2026-04-16

## Pattern Overview

**Overall:** Next.js full-stack application with AI-powered document generation, multi-session state management using IndexedDB, and a verification/harmonization feedback loop.

**Key Characteristics:**
- Client-side session management with IndexedDB for persistence
- Server-side AI orchestration via Google Gemini API with streaming responses
- Real-time document verification and surgical patching system
- Guided mode with progressive disclosure for document generation
- Multi-project type support with templated document definitions

## Layers

**Presentation Layer (Components):**
- Purpose: React UI components for session management, chat interface, document editing, and verification
- Location: `src/components/`
- Contains: Modal dialogs, chat panel with streaming, document preview/editor, diff viewer, verification panel, progress tracking
- Depends on: Storage layer, utilities, document definitions
- Used by: Page routes and each other

**Page/Route Layer:**
- Purpose: Next.js app router pages and API endpoints for request handling
- Location: `src/app/`
- Contains: Dashboard page (`page.tsx`), session details page (`session/[id]/page.tsx`), API routes for chat/verify/image-generation
- Depends on: Presentation components, storage, Gemini SDK
- Used by: Client browser and external callers

**Orchestration Layer:**
- Purpose: AI request/response coordination, instruction loading, and prompt engineering
- Location: `src/lib/gemini.ts`, `src/lib/instructions.ts`
- Contains: Streaming chat interface to Gemini, instruction YAML loaders, tech reference injection, system prompt builders
- Depends on: Google Gemini SDK, filesystem (instructions directory)
- Used by: API routes (`/api/chat`, `/api/verify`)

**Data Management Layer:**
- Purpose: Client-side session and document state persistence
- Location: `src/lib/storage.ts`
- Contains: IndexedDB interface, session CRUD operations, migration from localStorage, debounced save operations
- Depends on: idb library
- Used by: Page routes and components for session lifecycle management

**Utility/Support Layer:**
- Purpose: Shared utilities for parsing, formatting, and document manipulation
- Location: `src/lib/`
- Contains: Document block parsing, image marker extraction, patch application, doc definitions, constants, style utilities
- Depends on: None (core utilities)
- Used by: Components and orchestration layer

## Data Flow

**Document Generation Flow:**

1. User selects project type → Dashboard creates session with enabled documents
2. User navigates to session → Page loads session from IndexedDB
3. User enters message in ChatPanel → Client sends to `/api/chat` with session context
4. Chat API:
   - Loads `master-architect.yaml` instruction config
   - Injects full existing document content as context blocks
   - Injects tech reference (TECH-REF.md critical sections)
   - Injects custom instructions if user has edited them
   - Injects verification report from previous verifier run (if available)
   - Streams response from Gemini model via `streamChat()`
5. ChatPanel receives streaming response:
   - Parses document blocks wrapped in `~~~doc:DocumentType ... ~~~`
   - Parses image generation markers `~~~image:description~~~`
   - Strips markers from visible chat text
   - Extracts documents and triggers generation flow
6. Session state updates:
   - Documents saved via debounced IndexedDB write (150ms throttle for doc-only changes)
   - Chat messages saved separately (500ms throttle for full session saves)
   - Document version history tracked with source metadata ("generated" | "edited" | "harmonized")

**Guided Mode Flow:**

1. User selects "Guided Mode" for a document type
2. ChatPanel builds guided prompt using `buildGuidedPrompt()`:
   - Loads topic checklist from `DEFAULT_DOC_DEFINITIONS.guidedTopics` or project-specific overrides
   - Includes full content of other existing documents for auto-topic-completion hints
   - Instructs AI to interview user systematically
3. AI conducts structured interview, user checks off topics as they're covered
4. After sufficient topics are covered, AI generates document in response
5. User reviews document in DocPreview, can request updates via manual prompt

**Verification/Harmonization Flow:**

1. User clicks "Verify" in VerifierPanel
2. VerifierPanel calls `/api/verify` with mode="verify":
   - Loads `cybernetic-verifier.yaml` instruction
   - Injects all documents for cross-doc analysis
   - Returns list of issues (critical/warning/info) with evidence and fixes
3. Client parses JSON issue array from response
4. User can:
   - **Apply auto-fix:** System performs surgical patch via `/api/verify` mode="surgical"
     - AI reads all docs for context but outputs ONLY the target section
     - `patchUtils.extractSection()` finds best-matching H2/H3 section
     - `patchUtils.applyPatch()` replaces section with safety guards (size ratio, existence check)
   - **Request harmonization:** Full mode="harmonize" re-runs verifier and fixes all issues automatically
   - **Dismiss:** Issue marked dismissed, not surfaced again in this session

**State Management:**

- **Session state:** Loaded from IndexedDB on mount, updated via callbacks, debounced saves
- **Document state:** Separate fast-save channel (150ms) for doc-only updates, prevents blocking chat streaming
- **Verifier state:** Ephemeral state in component (`verifierState`), serialized issues, dismissed tracking
- **Chat history:** Stored in session messages, hidden messages excluded from display but included in API calls
- **API key:** Runtime header (`x-api-key`), optional per-request override of server env var

## Key Abstractions

**Session:**
- Purpose: Container for a single project with all its documents, chat history, and metadata
- Examples: `src/lib/storage.ts` (Session interface), `src/app/page.tsx` (session creation), `src/app/session/[id]/page.tsx` (session display)
- Pattern: CRUD via async functions, unique ID-based retrieval, updatedAt timestamp for sync tracking

**Document Definition:**
- Purpose: Configuration of a document type (label, docKey, default instruction, color, guided topics)
- Examples: `src/lib/doc-definitions.ts` (DocDefinition interface, DEFAULT_DOC_DEFINITIONS array)
- Pattern: Defines structure for all document types across the application, used for toolbar generation, guided mode topics, color coding

**Project Type Preset:**
- Purpose: Pre-configured document sets for common project types (webapp, game, business, design-system, marketing, infrastructure)
- Examples: `src/lib/doc-definitions.ts` (ProjectType interface, PROJECT_TYPE_PRESETS array with instruction overrides and guided topic overrides)
- Pattern: Allows users to select project template at creation time, customizes enabled docs, AI instructions, and interview topics per project type

**Chat Message (API Format):**
- Purpose: Standardized message structure for bidirectional AI conversations
- Examples: `src/lib/gemini.ts` (ChatMessage with role + parts), `src/lib/storage.ts` (ChatMessage with id + timestamp)
- Pattern: API messages use "user" | "model" roles; storage messages use "user" | "assistant" roles with timestamps for replay and hidden flag for system-only messages

**Instruction Config:**
- Purpose: YAML-loaded config for AI behavior (system instruction, model, temperature, document type)
- Examples: `src/lib/instructions.ts` (InstructionConfig interface), `instructions/` directory (YAML files per document type)
- Pattern: Central source of truth for AI prompt engineering, decoupled from code, supports per-document customization

**Verifier Issue:**
- Purpose: Structured representation of a document consistency/quality problem with evidence and fix guidance
- Examples: `src/components/VerifierPanel.tsx` (VerifierIssue interface)
- Pattern: Severity-based filtering, cross-document evidence tracking, surgical or full-doc patch application, dismissal tracking

## Entry Points

**Dashboard Page:**
- Location: `src/app/page.tsx`
- Triggers: Initial app load (root path)
- Responsibilities: List all sessions, create new session with project type selection, navigate to session, show first-time guide

**Session Page:**
- Location: `src/app/session/[id]/page.tsx`
- Triggers: Deep link to session ID or navigation from dashboard
- Responsibilities: Load session, orchestrate multi-panel layout (chat + document preview), handle document edits, coordinate verifier and harmonization flows

**Chat API:**
- Location: `src/app/api/chat/route.ts`
- Triggers: POST request from ChatPanel with message, history, existing documents
- Responsibilities: Load master architect instruction, inject context blocks, stream Gemini response, handle user API key override

**Verify API:**
- Location: `src/app/api/verify/route.ts`
- Triggers: POST request from VerifierPanel with mode=verify|surgical|harmonize
- Responsibilities: Load cybernetic verifier instruction, analyze documents cross-doc, return issues or apply patches, handle surgical precision rewrites

**Image Generation API:**
- Location: `src/app/api/generate-image/route.ts`
- Triggers: POST request from ChatPanel when image markers detected in AI response
- Responsibilities: Call Gemini image generation, return base64 image data with MIME type, handle fallback text description

## Error Handling

**Strategy:** Try/catch with fallback graceful degradation. API routes return JSON error responses with status codes. Client components show error states with recovery UI.

**Patterns:**
- Missing session: Router redirects to dashboard
- Invalid document blocks: Parser returns empty documents map, chat displays partial content
- Patch application failure: Fallback to full document harmonize mode instead of surgical patch
- Image generation failure: Show text description instead of visual
- IndexedDB corruption: Migrate from localStorage as backup, initialize fresh DB if needed
- API key missing: Show ApiKeyModal for user to supply via header

## Cross-Cutting Concerns

**Logging:** Console.error for exceptions, streamed errors logged in API responses. No centralized logging service.

**Validation:** API routes validate request shape early (required fields, typeof checks). Document parsing validates marker format. Section extraction validates minimum match score before returning.

**Authentication:** No built-in auth layer. API key (Gemini) passed as optional request header `x-api-key`, falls back to server `process.env.GEMINI_API_KEY`. Session isolation via sessionId parameter in URL.

**Performance:** Document saves debounced (150ms for docs, 500ms for full session) to avoid IndexedDB thrashing. DiffViewer dynamically imported to keep it out of initial bundle. ChatPanel memoizes expensive computations. Markdown normalization runs on every render but limited by fenced code block tracking.

---

*Architecture analysis: 2026-04-16*
