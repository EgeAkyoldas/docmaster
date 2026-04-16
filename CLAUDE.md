<!-- GSD:project-start source:PROJECT.md -->
## Project

**DocMaster**

DocMaster is an AI-powered document generation tool that helps users create structured project documentation through a chat interface. Users select a project type, chat with an AI architect (Google Gemini), and the AI generates, verifies, and harmonizes documents like PRDs, tech specs, and design docs. Built with Next.js, React, and IndexedDB for client-side persistence.

**Core Value:** Every document the AI generates must reliably persist and be visible to the user. If the AI says it created a document, the user must see it.

### Constraints

- **Tech Stack**: Next.js 16 + React 19 + TypeScript — established, no migration
- **AI Provider**: Google Gemini API — deeply integrated in prompt engineering and streaming
- **Storage**: IndexedDB via `idb` library — client-side only, no server database
- **No Tests**: Zero test coverage currently — any fix should include tests for the fixed area
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.x - All source code, configuration files, and API routes
- JavaScript (JSX/TSX) - React components and Next.js pages
- YAML - Instruction definitions and configuration
- CSS - Global styles and Tailwind utilities
- Markdown - Documentation and instruction content
## Runtime
- Node.js (no .nvmrc file present - uses project defaults)
- npm (dependencies in `package.json`, lockfile expected: `package-lock.json`)
## Frameworks
- Next.js 16.1.6 - Full-stack React framework with API routes
- React 19.0.0 - UI components and state management
- React DOM 19.0.0 - DOM rendering
- Radix UI - Headless component library
- Framer Motion 12.4.7 - Animation and motion design
- Lucide React 0.475.0 - Icon library
- Tailwind CSS 3.4.1 - Utility-first CSS framework
- Class Variance Authority 0.7.1 - Component style composition
- Tailwind Merge 2.6.1 - CSS utility merging
- Tailwind Animate 1.0.7 - Built-in animation utilities
- Autoprefixer 10.4.24 - CSS vendor prefix generation
- React Markdown 9.0.3 - Render markdown in React
- Remark GFM 4.0.1 - GitHub Flavored Markdown support
- Rehype Highlight 7.0.2 - Syntax highlighting
- idb 8.0.3 - IndexedDB wrapper for client-side persistence
- jszip 3.10.1 - ZIP file generation and extraction
- clsx 2.1.1 - Conditional className builder
- js-yaml 4.1.0 - YAML parsing and serialization
- TypeScript (types only) - TypeScript compiler and type definitions
- ESLint 9 - Code quality and style linting
- ESLint Config Next 16.1.6 - Next.js-specific linting rules
- PostCSS 8 - CSS transformation
- @types/node 20 - Node.js type definitions
- @types/react 19 - React type definitions
- @types/react-dom 19 - React DOM type definitions
- @types/js-yaml 4.0.9 - YAML type definitions
## Configuration
- Configuration method: Environment variables
- Variable source: `.env.local` file (created from `.env.example`)
- Critical env vars:
- `next.config.ts` - Next.js configuration (server external packages configured)
- `tsconfig.json` - TypeScript compiler options (strict mode enabled, ES2017 target)
- `tailwind.config.ts` - Tailwind CSS theming and plugin configuration
- `postcss.config.mjs` - PostCSS with Tailwind and Autoprefixer plugins
- Strict TypeScript mode enabled in `tsconfig.json`
- Path alias configured: `@/*` → `./src/*`
- DOM and ES2017 libraries included
## Platform Requirements
- Node.js runtime (version not explicitly specified)
- Git for version control
- Modern browser for frontend development
- Node.js server for Next.js application
- Browser support: Modern browsers (Chrome, Firefox, Safari, Edge)
- Client storage: IndexedDB (with localStorage fallback via migration)
- Network: HTTPS for API communication with Google Generative AI
## Project Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React UI components
- `src/lib/` - Utility functions and helpers
- `instructions/` - YAML-based AI instruction definitions
- `public/` - Static assets (favicon at `public/fav.ico`)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase (e.g., `ChatPanel.tsx`, `MessageBubble.tsx`, `ExportBar.tsx`)
- Utility/library files: camelCase (e.g., `utils.ts`, `gemini.ts`, `storage.ts`, `doc-definitions.ts`)
- API routes: nested directory structure with `route.ts` (e.g., `src/app/api/chat/route.ts`, `src/app/api/verify/route.ts`)
- Hooks: camelCase prefixed with "use" (e.g., `useApiKey.ts`)
- Page components: `page.tsx` (e.g., `src/app/page.tsx`, `src/app/session/[id]/page.tsx`)
- Functions exported as named exports: camelCase or PascalCase depending on component type
- Private/internal functions: camelCase (e.g., `buildDocPromptLocal()`, `adjustTextareaHeight()`)
- Event handlers: camelCase prefixed with "handle" (e.g., `handleSend()`, `handleStop()`, `handleKeyDown()`)
- Callbacks passed to components: camelCase prefixed with "on" (e.g., `onMessagesUpdate`, `onDocumentsUpdate`, `onImageClick`)
- State variables: camelCase (e.g., `input`, `streamingContent`, `isStreaming`)
- Constants: UPPER_SNAKE_CASE for module-level constants (e.g., `KEY_STORAGE`, `MODEL_STORAGE`, `DB_NAME`, `STORE`)
- Type/interface variables: camelCase for instances (e.g., `guidedSession`, `existingDocs`)
- React hooks state: follow useState convention with singular name and setter (e.g., `const [input, setInput]`)
- Refs: camelCase prefixed with reference type (e.g., `textareaRef`, `bottomRef`, `imageInputRef`, `abortRef`)
- Interfaces: PascalCase with descriptive suffix (e.g., `ChatPanelProps`, `MessageBubbleProps`, `ExportBarProps`, `ImageModalData`)
- Type aliases: PascalCase (e.g., `VerifierPhase`, `GeminiModelId`)
- Union types: use `type` keyword (e.g., `type VerifierPhase = "idle" | "verifying" | "ready" | "harmonizing" | "done"`)
- Props interfaces: suffix with "Props" (e.g., `ChatPanelProps`, `ExportBarProps`)
- Exported interfaces for data structures: use descriptive names (e.g., `ChatMessage`, `DocVersion`, `Session`, `InlineImage`)
## Code Style
- Formatter: Prettier (configured via Next.js defaults, no `.prettierrc` in repo)
- Line length: Standard, no explicit limit enforced
- Indentation: 2 spaces (standard JavaScript/TypeScript default)
- Semicolons: Always present (enforced by Next.js/ESLint defaults)
- Tool: ESLint v9 with `eslint-config-next`
- Config: Uses Next.js default ESLint configuration (no custom `.eslintrc` file)
- Key enforced rules:
- Base alias: `@/*` → `./src/*` (configured in `tsconfig.json`)
- Used consistently throughout: `@/lib/utils`, `@/components/ChatPanel`, `@/lib/storage`
- Applied at top of every interactive component file
- Examples: `ChatPanel.tsx`, `ExportBar.tsx`, `MessageBubble.tsx`, all component files
- Not used in library/utility files or server-side API routes
## Error Handling
- Try-catch blocks used for async operations (fetch calls, file I/O, database operations)
- Errors propagated with descriptive user-facing messages using emoji prefixes:
- Examples in `ChatPanel.tsx` (lines 529-535): checks for specific error statuses (503, 429, 401, 403)
- Graceful fallbacks: `.catch()` used silently in some contexts (e.g., JSON parsing, clipboard operations)
- Error messages sent to UI through `ChatMessage` objects with error content
## Logging
- No explicit logging library used
- Errors logged via try-catch blocks that propagate to UI messages
- Streaming operations validated with SSE error handling (see `src/app/api/chat/route.ts`)
- No debug/trace level logging visible in codebase
## Comments
- Document complex algorithms (e.g., `parseDocumentBlocks()` in `utils.ts` includes multi-line explanation of state machine logic)
- Explain non-obvious business logic (e.g., guided mode prompt building in `ChatPanel.tsx` comments explain cross-document auto-fill)
- Mark important architectural decisions (e.g., "Local buildDocPromptLocal wraps the shared buildDocPrompt with update/context logic")
- Clarify state tracking (e.g., "Track guided session coverage by counting user messages sent after session started")
- Minimal JSDoc used in codebase
- TypeScript interfaces and types serve as primary documentation
- Example: `parseDocumentBlocks()` includes 4-line block comment explaining purpose and parsing strategy
## Function Design
- Utility functions: Small and focused (e.g., `cn()` combines clsx + tailwindMerge, 5 lines)
- Complex async handlers: Longer functions with clear internal structure (e.g., `sendMessage()` in ChatPanel is ~170 lines with well-marked sections)
- Component functions: Structured with hooks at top, handler callbacks in middle, return statement at end
- Destructured in function signatures for clarity (e.g., `{ messages, isStreaming, existingDocs }` in ChatPanel)
- Props interfaces define all parameters (see `ChatPanelProps`)
- Optional parameters use TypeScript optional syntax (e.g., `opts?: { hidden?: boolean; extraHiddenMessages?: ChatMessage[] }`)
- Explicit return types on exported functions (e.g., `export function parseDocumentBlocks(text: string): { cleanText: string; documents: Record<string, string> }`)
- Void returns for event handlers and callbacks
- Objects returned with clear structure matching interface definitions
## Module Design
- Named exports used for functions and types: `export function`, `export interface`, `export const`, `export type`
- Default exports used rarely (not observed in main codebase)
- Barrel files not heavily used; imports reference specific files directly
- Not prevalent pattern in this codebase
- Components imported directly by path (e.g., `import { ChatPanel } from "./ChatPanel"`)
- Libraries organized by functionality (e.g., all lib utilities in `src/lib/` imported individually)
- Single responsibility: each file typically exports one main component or utility function
- Supporting types/interfaces co-located in same file as primary export
- Props interfaces defined in component files immediately after imports
- Private helper functions within same file (not exported)
## React-Specific Patterns
- Functional components using React.FC or implicit typing
- Memo wrapping for performance-critical components: `export const MessageBubble = memo(function MessageBubble({ ... }))`
- forwardRef usage for imperative handles (e.g., `ChatPanel` exports `ChatPanelHandle` for prefill operations)
- useState for local component state
- useCallback for memoized event handlers to prevent unnecessary re-renders
- useMemo for expensive computations (e.g., filtering/sorting visible messages)
- useEffect with dependency arrays and exhaustive-deps comments when intentionally excluding deps
- useRef for DOM references and mutable values
- useImperativeHandle for controlled ref behaviors
- Callbacks passed through props: `onMessagesUpdate`, `onDocumentsUpdate`, `onStreamingChange`
- Context not used; props-based architecture for state management
- Tailwind CSS utility classes exclusively
- clsx/cn utility for conditional class merging (defined in `utils.ts`)
- Inline styles minimal; used for dynamic values (e.g., `backgroundColor` set from COLOR_MAP)
- Framer Motion for animations (imported as `motion`)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Client-side session management with IndexedDB for persistence
- Server-side AI orchestration via Google Gemini API with streaming responses
- Real-time document verification and surgical patching system
- Guided mode with progressive disclosure for document generation
- Multi-project type support with templated document definitions
## Layers
- Purpose: React UI components for session management, chat interface, document editing, and verification
- Location: `src/components/`
- Contains: Modal dialogs, chat panel with streaming, document preview/editor, diff viewer, verification panel, progress tracking
- Depends on: Storage layer, utilities, document definitions
- Used by: Page routes and each other
- Purpose: Next.js app router pages and API endpoints for request handling
- Location: `src/app/`
- Contains: Dashboard page (`page.tsx`), session details page (`session/[id]/page.tsx`), API routes for chat/verify/image-generation
- Depends on: Presentation components, storage, Gemini SDK
- Used by: Client browser and external callers
- Purpose: AI request/response coordination, instruction loading, and prompt engineering
- Location: `src/lib/gemini.ts`, `src/lib/instructions.ts`
- Contains: Streaming chat interface to Gemini, instruction YAML loaders, tech reference injection, system prompt builders
- Depends on: Google Gemini SDK, filesystem (instructions directory)
- Used by: API routes (`/api/chat`, `/api/verify`)
- Purpose: Client-side session and document state persistence
- Location: `src/lib/storage.ts`
- Contains: IndexedDB interface, session CRUD operations, migration from localStorage, debounced save operations
- Depends on: idb library
- Used by: Page routes and components for session lifecycle management
- Purpose: Shared utilities for parsing, formatting, and document manipulation
- Location: `src/lib/`
- Contains: Document block parsing, image marker extraction, patch application, doc definitions, constants, style utilities
- Depends on: None (core utilities)
- Used by: Components and orchestration layer
## Data Flow
- **Session state:** Loaded from IndexedDB on mount, updated via callbacks, debounced saves
- **Document state:** Separate fast-save channel (150ms) for doc-only updates, prevents blocking chat streaming
- **Verifier state:** Ephemeral state in component (`verifierState`), serialized issues, dismissed tracking
- **Chat history:** Stored in session messages, hidden messages excluded from display but included in API calls
- **API key:** Runtime header (`x-api-key`), optional per-request override of server env var
## Key Abstractions
- Purpose: Container for a single project with all its documents, chat history, and metadata
- Examples: `src/lib/storage.ts` (Session interface), `src/app/page.tsx` (session creation), `src/app/session/[id]/page.tsx` (session display)
- Pattern: CRUD via async functions, unique ID-based retrieval, updatedAt timestamp for sync tracking
- Purpose: Configuration of a document type (label, docKey, default instruction, color, guided topics)
- Examples: `src/lib/doc-definitions.ts` (DocDefinition interface, DEFAULT_DOC_DEFINITIONS array)
- Pattern: Defines structure for all document types across the application, used for toolbar generation, guided mode topics, color coding
- Purpose: Pre-configured document sets for common project types (webapp, game, business, design-system, marketing, infrastructure)
- Examples: `src/lib/doc-definitions.ts` (ProjectType interface, PROJECT_TYPE_PRESETS array with instruction overrides and guided topic overrides)
- Pattern: Allows users to select project template at creation time, customizes enabled docs, AI instructions, and interview topics per project type
- Purpose: Standardized message structure for bidirectional AI conversations
- Examples: `src/lib/gemini.ts` (ChatMessage with role + parts), `src/lib/storage.ts` (ChatMessage with id + timestamp)
- Pattern: API messages use "user" | "model" roles; storage messages use "user" | "assistant" roles with timestamps for replay and hidden flag for system-only messages
- Purpose: YAML-loaded config for AI behavior (system instruction, model, temperature, document type)
- Examples: `src/lib/instructions.ts` (InstructionConfig interface), `instructions/` directory (YAML files per document type)
- Pattern: Central source of truth for AI prompt engineering, decoupled from code, supports per-document customization
- Purpose: Structured representation of a document consistency/quality problem with evidence and fix guidance
- Examples: `src/components/VerifierPanel.tsx` (VerifierIssue interface)
- Pattern: Severity-based filtering, cross-document evidence tracking, surgical or full-doc patch application, dismissal tracking
## Entry Points
- Location: `src/app/page.tsx`
- Triggers: Initial app load (root path)
- Responsibilities: List all sessions, create new session with project type selection, navigate to session, show first-time guide
- Location: `src/app/session/[id]/page.tsx`
- Triggers: Deep link to session ID or navigation from dashboard
- Responsibilities: Load session, orchestrate multi-panel layout (chat + document preview), handle document edits, coordinate verifier and harmonization flows
- Location: `src/app/api/chat/route.ts`
- Triggers: POST request from ChatPanel with message, history, existing documents
- Responsibilities: Load master architect instruction, inject context blocks, stream Gemini response, handle user API key override
- Location: `src/app/api/verify/route.ts`
- Triggers: POST request from VerifierPanel with mode=verify|surgical|harmonize
- Responsibilities: Load cybernetic verifier instruction, analyze documents cross-doc, return issues or apply patches, handle surgical precision rewrites
- Location: `src/app/api/generate-image/route.ts`
- Triggers: POST request from ChatPanel when image markers detected in AI response
- Responsibilities: Call Gemini image generation, return base64 image data with MIME type, handle fallback text description
## Error Handling
- Missing session: Router redirects to dashboard
- Invalid document blocks: Parser returns empty documents map, chat displays partial content
- Patch application failure: Fallback to full document harmonize mode instead of surgical patch
- Image generation failure: Show text description instead of visual
- IndexedDB corruption: Migrate from localStorage as backup, initialize fresh DB if needed
- API key missing: Show ApiKeyModal for user to supply via header
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
