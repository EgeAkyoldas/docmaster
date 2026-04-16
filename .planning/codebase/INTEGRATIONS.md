# External Integrations

**Analysis Date:** 2026-04-16

## APIs & External Services

**Google Generative AI (Gemini):**
- Service: Google's Generative AI API for LLM inference
  - SDK/Client: `@google/genai` 1.0.0
  - Auth: Environment variable `GEMINI_API_KEY`
  - Primary use: Document generation via conversational AI
  - Secondary use: Image generation for technical diagrams
  - User-override support: API key and model can be overridden per-request via headers (`x-api-key`, `x-model`)

**Default Models:**
- Chat/Document Generation: `gemini-2.5-flash-lite` (fallback, per `instructions/master-architect.yaml`)
- Image Generation: `gemini-3-flash-preview-preview-image-generation`
- User can override via `x-model` header on API requests

## Data Storage

**Databases:**
- None - This is a client-side document generation tool with no backend database

**Client Storage:**
- IndexedDB (primary via `idb` 8.0.3)
  - Database: `prdbot`
  - Object store: `sessions`
  - Persists: Session metadata, chat history, generated documents, document versions
  - Index: `updatedAt` for sorting
  - Migration: Automatic migration from legacy localStorage on first access

**File Storage:**
- Local filesystem (static assets only)
  - Favicon: `public/fav.ico`
  - Font files: Loaded from Google Fonts CDN
- No persistent file storage or cloud storage

**Caching:**
- Browser HTTP Cache: Used for static assets
- Memory-based debouncing: Session saves are debounced (1.5s for messages, 150ms for document edits)

## Authentication & Identity

**Auth Provider:**
- Custom implementation (no third-party auth)
- Method: User supplies Gemini API key directly in browser UI
- Storage: LocalStorage (via `useApiKey` hook in `src/lib/useApiKey.ts`)
- Scope: Per-session API key support with optional server-level `GEMINI_API_KEY` fallback
- No user accounts, sessions, or identity management

**Session Management:**
- Client-generated session IDs (UUID via `crypto.randomUUID()`)
- Sessions stored in IndexedDB
- No authentication required - all sessions are public/anonymous

## Monitoring & Observability

**Error Tracking:**
- None (no external error tracking service)
- Errors logged to browser console and server console
- API errors mapped to user-friendly messages in `src/app/api/chat/route.ts` and `src/app/api/verify/route.ts`

**Logs:**
- Browser console: `console.error()` for client-side errors
- Server console: `console.error()` for API route errors
- No centralized logging or log aggregation

## CI/CD & Deployment

**Hosting:**
- Next.js App Router supports: Vercel, Node.js servers, Docker containers
- No deployment configuration in repository (environment-dependent)

**CI Pipeline:**
- None configured (no GitHub Actions, GitLab CI, or similar)

## Environment Configuration

**Required env vars:**
- `GEMINI_API_KEY` - Google Generative AI API key (required for API calls)

**Optional env vars:**
- `GEMINI_REASONING_MODEL` - Override default chat model (defaults to `gemini-3-flash-preview`)
- `GEMINI_MODEL` - Override default image generation model (defaults to `gemini-3-flash-preview-preview-image-generation`)

**Secrets location:**
- Development: `.env.local` file (copy from `.env.example` template at `/.env.example`)
- Production: Platform-specific (e.g., Vercel Environment Variables, Docker secrets, etc.)
- **Note:** `.env` files are git-ignored and contain sensitive credentials

**Format:**
```
GEMINI_API_KEY=your-gemini-api-key-here
```

## Webhooks & Callbacks

**Incoming:**
- None (application does not expose webhook endpoints)

**Outgoing:**
- None (application makes no outbound webhook calls)

## API Clients & Request Headers

**Chat API (`src/app/api/chat/route.ts`):**
- Endpoint: `POST /api/chat`
- Request body:
  - `message` (string, required) - User message
  - `history` (array) - Chat conversation history
  - `existingDocs` (object) - Previously generated documents for context
  - `verifyReport` (string) - Verification analysis results
  - `customInstructions` (object) - Per-document custom generation rules
- Request headers:
  - `x-api-key` (optional) - User's Gemini API key (overrides server env)
  - `x-model` (optional) - User's preferred Gemini model
- Response: Server-Sent Events (SSE) stream with `data: {text}` messages

**Verify API (`src/app/api/verify/route.ts`):**
- Endpoint: `POST /api/verify`
- Request body:
  - `documents` (object, required) - Document contents to verify
  - `mode` (string) - Verification mode: `verify` (default), `surgical`, `harmonize`
  - `report` (string) - Previous verification report
  - `enabledDocs` (array) - Scope of documents to check
  - `surgicalPayload` (object) - For surgical mode: section details and issue description
- Request headers:
  - `x-api-key` (optional) - User's Gemini API key
  - `x-model` (optional) - User's preferred Gemini model
- Response: Server-Sent Events (SSE) stream with verification telemetry

**Image Generation API (`src/app/api/generate-image/route.ts`):**
- Endpoint: `POST /api/generate-image`
- Request body:
  - `prompt` (string, required) - Description of diagram/visualization to generate
- Request headers:
  - `x-api-key` (optional) - User's Gemini API key
- Response: JSON with `imageData` (base64) and `mimeType`

## External Resources & CDN

**Google Fonts:**
- Font files: Inter, JetBrains Mono
- Loaded via `<link>` tags in `src/app/layout.tsx`
- Preconnect optimization: `fonts.googleapis.com` and `fonts.gstatic.com`

---

*Integration audit: 2026-04-16*
