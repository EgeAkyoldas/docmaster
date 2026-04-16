# Coding Conventions

**Analysis Date:** 2026-04-16

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `ChatPanel.tsx`, `MessageBubble.tsx`, `ExportBar.tsx`)
- Utility/library files: camelCase (e.g., `utils.ts`, `gemini.ts`, `storage.ts`, `doc-definitions.ts`)
- API routes: nested directory structure with `route.ts` (e.g., `src/app/api/chat/route.ts`, `src/app/api/verify/route.ts`)
- Hooks: camelCase prefixed with "use" (e.g., `useApiKey.ts`)
- Page components: `page.tsx` (e.g., `src/app/page.tsx`, `src/app/session/[id]/page.tsx`)

**Functions:**
- Functions exported as named exports: camelCase or PascalCase depending on component type
  - Components: PascalCase (e.g., `export const ChatPanel`, `export function MessageBubble`)
  - Utilities: camelCase (e.g., `export function parseDocumentBlocks()`, `export function formatDate()`)
- Private/internal functions: camelCase (e.g., `buildDocPromptLocal()`, `adjustTextareaHeight()`)
- Event handlers: camelCase prefixed with "handle" (e.g., `handleSend()`, `handleStop()`, `handleKeyDown()`)
- Callbacks passed to components: camelCase prefixed with "on" (e.g., `onMessagesUpdate`, `onDocumentsUpdate`, `onImageClick`)

**Variables:**
- State variables: camelCase (e.g., `input`, `streamingContent`, `isStreaming`)
- Constants: UPPER_SNAKE_CASE for module-level constants (e.g., `KEY_STORAGE`, `MODEL_STORAGE`, `DB_NAME`, `STORE`)
- Type/interface variables: camelCase for instances (e.g., `guidedSession`, `existingDocs`)
- React hooks state: follow useState convention with singular name and setter (e.g., `const [input, setInput]`)
- Refs: camelCase prefixed with reference type (e.g., `textareaRef`, `bottomRef`, `imageInputRef`, `abortRef`)

**Types:**
- Interfaces: PascalCase with descriptive suffix (e.g., `ChatPanelProps`, `MessageBubbleProps`, `ExportBarProps`, `ImageModalData`)
- Type aliases: PascalCase (e.g., `VerifierPhase`, `GeminiModelId`)
- Union types: use `type` keyword (e.g., `type VerifierPhase = "idle" | "verifying" | "ready" | "harmonizing" | "done"`)
- Props interfaces: suffix with "Props" (e.g., `ChatPanelProps`, `ExportBarProps`)
- Exported interfaces for data structures: use descriptive names (e.g., `ChatMessage`, `DocVersion`, `Session`, `InlineImage`)

## Code Style

**Formatting:**
- Formatter: Prettier (configured via Next.js defaults, no `.prettierrc` in repo)
- Line length: Standard, no explicit limit enforced
- Indentation: 2 spaces (standard JavaScript/TypeScript default)
- Semicolons: Always present (enforced by Next.js/ESLint defaults)

**Linting:**
- Tool: ESLint v9 with `eslint-config-next`
- Config: Uses Next.js default ESLint configuration (no custom `.eslintrc` file)
- Key enforced rules:
  - React hooks dependencies: `eslint-disable-next-line react-hooks/exhaustive-deps` used selectively (e.g., in `ChatPanel.tsx` for intentional dependency exclusions)
  - Standard ESLint rules from Next.js preset

**Import Organization:**

**Order:**
1. React and framework imports (e.g., `import { useState, useCallback } from "react"`)
2. Third-party library imports (e.g., `import { motion } from "framer-motion"`, `import JSZip from "jszip"`)
3. Utility/helper imports from project libraries (e.g., `import { useApiKey } from "@/lib/useApiKey"`)
4. Component imports (e.g., `import { MessageBubble } from "./MessageBubble"`)
5. Type imports (rarely separate unless explicitly needed)

**Path Aliases:**
- Base alias: `@/*` → `./src/*` (configured in `tsconfig.json`)
- Used consistently throughout: `@/lib/utils`, `@/components/ChatPanel`, `@/lib/storage`

**"use client" directive:**
- Applied at top of every interactive component file
- Examples: `ChatPanel.tsx`, `ExportBar.tsx`, `MessageBubble.tsx`, all component files
- Not used in library/utility files or server-side API routes

## Error Handling

**Patterns:**
- Try-catch blocks used for async operations (fetch calls, file I/O, database operations)
- Errors propagated with descriptive user-facing messages using emoji prefixes:
  - `🔄 Model is experiencing high demand. Please try again in a few seconds.`
  - `⏳ Rate limit exceeded. Please wait a moment and try again.`
  - `🔑 Invalid or expired API key. Please check your API key.`
  - `⚠️ Connection error. Please check your API key and try again.`
- Examples in `ChatPanel.tsx` (lines 529-535): checks for specific error statuses (503, 429, 401, 403)
- Graceful fallbacks: `.catch()` used silently in some contexts (e.g., JSON parsing, clipboard operations)
- Error messages sent to UI through `ChatMessage` objects with error content

## Logging

**Framework:** console (native JavaScript API)

**Patterns:**
- No explicit logging library used
- Errors logged via try-catch blocks that propagate to UI messages
- Streaming operations validated with SSE error handling (see `src/app/api/chat/route.ts`)
- No debug/trace level logging visible in codebase

## Comments

**When to Comment:**
- Document complex algorithms (e.g., `parseDocumentBlocks()` in `utils.ts` includes multi-line explanation of state machine logic)
- Explain non-obvious business logic (e.g., guided mode prompt building in `ChatPanel.tsx` comments explain cross-document auto-fill)
- Mark important architectural decisions (e.g., "Local buildDocPromptLocal wraps the shared buildDocPrompt with update/context logic")
- Clarify state tracking (e.g., "Track guided session coverage by counting user messages sent after session started")

**JSDoc/TSDoc:**
- Minimal JSDoc used in codebase
- TypeScript interfaces and types serve as primary documentation
- Example: `parseDocumentBlocks()` includes 4-line block comment explaining purpose and parsing strategy

## Function Design

**Size:** Functions range from 5 lines to 100+ lines
- Utility functions: Small and focused (e.g., `cn()` combines clsx + tailwindMerge, 5 lines)
- Complex async handlers: Longer functions with clear internal structure (e.g., `sendMessage()` in ChatPanel is ~170 lines with well-marked sections)
- Component functions: Structured with hooks at top, handler callbacks in middle, return statement at end

**Parameters:**
- Destructured in function signatures for clarity (e.g., `{ messages, isStreaming, existingDocs }` in ChatPanel)
- Props interfaces define all parameters (see `ChatPanelProps`)
- Optional parameters use TypeScript optional syntax (e.g., `opts?: { hidden?: boolean; extraHiddenMessages?: ChatMessage[] }`)

**Return Values:**
- Explicit return types on exported functions (e.g., `export function parseDocumentBlocks(text: string): { cleanText: string; documents: Record<string, string> }`)
- Void returns for event handlers and callbacks
- Objects returned with clear structure matching interface definitions

## Module Design

**Exports:**
- Named exports used for functions and types: `export function`, `export interface`, `export const`, `export type`
- Default exports used rarely (not observed in main codebase)
- Barrel files not heavily used; imports reference specific files directly

**Barrel Files:**
- Not prevalent pattern in this codebase
- Components imported directly by path (e.g., `import { ChatPanel } from "./ChatPanel"`)
- Libraries organized by functionality (e.g., all lib utilities in `src/lib/` imported individually)

**Module Organization:**
- Single responsibility: each file typically exports one main component or utility function
- Supporting types/interfaces co-located in same file as primary export
- Props interfaces defined in component files immediately after imports
- Private helper functions within same file (not exported)

## React-Specific Patterns

**Component Declaration:**
- Functional components using React.FC or implicit typing
- Memo wrapping for performance-critical components: `export const MessageBubble = memo(function MessageBubble({ ... }))`
- forwardRef usage for imperative handles (e.g., `ChatPanel` exports `ChatPanelHandle` for prefill operations)

**Hooks Usage:**
- useState for local component state
- useCallback for memoized event handlers to prevent unnecessary re-renders
- useMemo for expensive computations (e.g., filtering/sorting visible messages)
- useEffect with dependency arrays and exhaustive-deps comments when intentionally excluding deps
- useRef for DOM references and mutable values
- useImperativeHandle for controlled ref behaviors

**Props Drilling:**
- Callbacks passed through props: `onMessagesUpdate`, `onDocumentsUpdate`, `onStreamingChange`
- Context not used; props-based architecture for state management

**Styling:**
- Tailwind CSS utility classes exclusively
- clsx/cn utility for conditional class merging (defined in `utils.ts`)
- Inline styles minimal; used for dynamic values (e.g., `backgroundColor` set from COLOR_MAP)
- Framer Motion for animations (imported as `motion`)

---

*Convention analysis: 2026-04-16*
