# Codebase Structure

**Analysis Date:** 2026-04-16

## Directory Layout

```
/Users/salesscaled/Documents/GitHub/docmaster/
├── src/
│   ├── app/                          # Next.js app router pages and API routes
│   │   ├── page.tsx                  # Dashboard — list sessions, create new
│   │   ├── layout.tsx                # Root layout with metadata
│   │   ├── globals.css               # Global Tailwind + custom styles
│   │   ├── api/
│   │   │   ├── chat/route.ts         # Streaming chat endpoint
│   │   │   ├── verify/route.ts       # Document verification endpoint
│   │   │   └── generate-image/route.ts # Image generation endpoint
│   │   └── session/
│   │       └── [id]/page.tsx         # Session details with chat + preview
│   ├── components/                   # React UI components
│   │   ├── ChatPanel.tsx             # Main chat interface with document generation
│   │   ├── DocPreview.tsx            # Document viewer with markdown rendering
│   │   ├── VerifierPanel.tsx         # Verification UI and issue management
│   │   ├── MessageBubble.tsx         # Individual message rendering
│   │   ├── DiffViewer.tsx            # Diff display (lazy-loaded)
│   │   ├── DocTabs.tsx               # Document type tab selector
│   │   ├── ExportBar.tsx             # Download/export controls
│   │   ├── SessionCard.tsx           # Session preview on dashboard
│   │   ├── SessionSettings.tsx       # Custom instruction editor
│   │   ├── GuidedProgress.tsx        # Guided mode topic checklist
│   │   ├── ProductGuide.tsx          # First-time user onboarding
│   │   ├── ApiKeyModal.tsx           # User API key input
│   │   └── ImageModal.tsx            # Generated image display
│   └── lib/                          # Utility and business logic
│       ├── storage.ts                # IndexedDB session persistence
│       ├── gemini.ts                 # Gemini API streaming wrapper
│       ├── instructions.ts           # Instruction YAML loader + tech ref injection
│       ├── doc-definitions.ts        # Document types and project presets
│       ├── utils.ts                  # Shared utilities (parsing, formatting)
│       ├── patchUtils.ts             # Section extraction and patching
│       ├── useApiKey.ts              # React hook for API key state
│       ├── constants.ts              # Global constants
│       └── readme-generator.ts       # Utility for README export
├── instructions/                     # AI instruction YAML files (server-side)
│   ├── master-architect.yaml         # Main instruction for chat/doc generation
│   ├── cybernetic-verifier.yaml      # Verifier instruction for document analysis
│   ├── prd-architect.yaml            # PRD-specific instruction
│   ├── architecture.yaml             # Architecture document instruction
│   ├── design-doc.yaml               # Design document instruction
│   ├── tech-stack.yaml               # Tech stack instruction
│   ├── tech-spec.yaml                # Technical specification instruction
│   ├── api-spec.yaml                 # API specification instruction
│   ├── ui-design.yaml                # UI design instruction
│   ├── data-model.yaml               # Data model instruction
│   ├── security-spec.yaml            # Security specification instruction
│   ├── roadmap.yaml                  # Roadmap instruction
│   ├── task-list.yaml                # Task list instruction
│   └── vibe-prompt.yaml              # Vibe prompt instruction (AI handoff)
├── public/                           # Static assets
│   └── fav.ico                       # Favicon
├── .planning/codebase/               # Codebase documentation (this file)
├── docs/                             # General project documentation
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
└── postcss.config.js                 # PostCSS configuration
```

## Directory Purposes

**src/app:**
- Purpose: Next.js app router — pages and API routes for the application
- Contains: Page components (dashboard, session), API endpoints
- Key files: `page.tsx` (root), `layout.tsx` (metadata), `session/[id]/page.tsx` (main UI)

**src/components:**
- Purpose: Reusable React components for UI
- Contains: Chat interface, document preview/editor, verification UI, modals, settings
- Key files: `ChatPanel.tsx` (largest, handles document generation), `VerifierPanel.tsx` (verification logic), `DocPreview.tsx` (markdown rendering + editing)

**src/lib:**
- Purpose: Business logic, utilities, and configuration
- Contains: Storage layer (IndexedDB), AI orchestration, document definitions, parsing utilities
- Key files: `storage.ts` (session CRUD), `doc-definitions.ts` (document type registry), `gemini.ts` (AI streaming)

**instructions:**
- Purpose: Server-side YAML files defining AI behavior for document generation and verification
- Contains: System instructions, model config, document type specifications
- Key files: `master-architect.yaml` (main chat instruction), `cybernetic-verifier.yaml` (verification logic)

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Dashboard homepage — user sees session list and project type selector
- `src/app/session/[id]/page.tsx`: Session view — main workspace with chat + document preview
- `src/app/api/chat/route.ts`: Chat streaming endpoint
- `src/app/api/verify/route.ts`: Document verification endpoint

**Configuration:**
- `instructions/`: YAML-based AI instruction files (loaded at runtime via `loadInstruction()`)
- `src/lib/doc-definitions.ts`: Document type registry and project type presets
- `src/lib/constants.ts`: Global constants (document labels, instruction files)

**Core Logic:**
- `src/lib/storage.ts`: IndexedDB session management, migration from localStorage
- `src/lib/gemini.ts`: Gemini API streaming interface
- `src/components/ChatPanel.tsx`: Document generation orchestration, guided mode
- `src/components/VerifierPanel.tsx`: Issue parsing, surgical patching, harmonization

**Testing:**
- `testsprite_tests/`: Manual test data and outputs (not automated tests)

## Naming Conventions

**Files:**
- React components: PascalCase (e.g., `ChatPanel.tsx`, `DocPreview.tsx`)
- Utilities/hooks: camelCase (e.g., `storage.ts`, `gemini.ts`, `useApiKey.ts`)
- Instructions: kebab-case (e.g., `master-architect.yaml`, `cybernetic-verifier.yaml`)
- API routes: lowercase with hyphens (e.g., `generate-image/route.ts`)

**Directories:**
- Source directories: lowercase, semantic names (`app`, `components`, `lib`, `instructions`)
- Dynamic routes: brackets for parameters (e.g., `[id]`)

**TypeScript/Code:**
- Interfaces: PascalCase with leading `I` optional (e.g., `Session`, `ChatMessage`, `DocDefinition`)
- Types: PascalCase (e.g., `ProjectType`, `VerifierPhase`)
- Constants: UPPER_SNAKE_CASE (e.g., `DB_NAME`, `STORE`, `INITIAL_VERIFIER_STATE`)
- Functions: camelCase (e.g., `createSession()`, `parseDocumentBlocks()`)
- React hooks: camelCase with leading `use` (e.g., `useApiKey()`)
- CSS classes: Tailwind utility classes (e.g., `bg-cyan-500/10`, `border-red-500/30`)

## Where to Add New Code

**New Feature (Document Generation):**
- Primary code: `src/components/ChatPanel.tsx` (add new prompt builder or mode)
- Instructions: `instructions/newdoc.yaml` (define AI behavior)
- Definitions: Update `src/lib/doc-definitions.ts` (add DocDefinition + ProjectType override)
- Tests: Manual test data in `testsprite_tests/`

**New Component/Modal:**
- Implementation: `src/components/YourComponent.tsx`
- Integration: Import and use in `src/app/session/[id]/page.tsx` or parent component
- Styling: Tailwind classes inline, use `cn()` utility for conditional classes

**New API Endpoint:**
- Implementation: `src/app/api/yourfeature/route.ts`
- Instruction: `instructions/yourfeature.yaml` if AI-powered
- Loading: Use `loadInstruction()` from `src/lib/instructions.ts`

**Utilities:**
- Shared helpers: `src/lib/utils.ts` (parsing, formatting, DOM manipulation)
- Document manipulation: `src/lib/patchUtils.ts` (if section-based operations)
- Storage operations: Add new methods to `src/lib/storage.ts`
- AI orchestration: Add to `src/lib/gemini.ts` if new Gemini interaction pattern

**Constants/Configuration:**
- Global constants: `src/lib/constants.ts`
- Document definitions: `src/lib/doc-definitions.ts` (DocDefinition interface, presets)
- Environment-dependent config: Use `process.env` in server routes, pass to client via props

## Special Directories

**instructions/:**
- Purpose: Server-side YAML files for AI prompt engineering
- Generated: No (hand-authored)
- Committed: Yes
- Note: Loaded at runtime via `loadInstruction()`. Each file corresponds to a document type or special role (verifier, master-architect)

**testsprite_tests/:**
- Purpose: Manual testing and sample data for verification
- Generated: Yes (contains test outputs)
- Committed: Conditionally (git-ignored for tmp/)
- Note: Not an automated test suite; used for manual QA and validation

**.planning/codebase/:**
- Purpose: This codebase documentation
- Generated: Programmatically by GSD agents
- Committed: Yes
- Note: Single source of truth for architecture, structure, conventions, testing patterns

**.next/:**
- Purpose: Next.js build output
- Generated: Yes (during `npm run build`)
- Committed: No (git-ignored)

**node_modules/:**
- Purpose: Installed dependencies
- Generated: Yes (during `npm install`)
- Committed: No (git-ignored)

## Design Decision: Multi-Layer Document Injection

The chat API (`src/app/api/chat/route.ts`) builds the system instruction in layers:

1. **Base instruction:** From `instructions/master-architect.yaml`
2. **Existing documents:** Full content of previously generated docs
3. **Tech reference:** Critical sections from `TECH-REF.md` (model names, dependencies, anti-patterns)
4. **Custom instructions:** User-edited per-document prompts from SessionSettings
5. **Verification report:** Latest Verifier output if user ran verification

This ensures the AI always has the full context needed to maintain consistency and follow project-specific rules.

## Design Decision: Surgical Patching vs. Full Harmonization

When an issue is detected by the verifier, two fix strategies are available:

- **Surgical patch:** For isolated issues, extract target section via `patchUtils.extractSection()`, send ONLY that section to AI for rewrite, merge back via `patchUtils.applyPatch()` with safety guards (size ratio check, existence verification)
- **Full harmonization:** Re-run verifier in `mode="harmonize"`, AI fixes all issues at once in the entire document, higher risk but more holistic

Users can choose strategy per issue or run full harmonization.

---

*Structure analysis: 2026-04-16*
