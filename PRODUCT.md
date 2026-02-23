# APEX Cybernetic Documentation Engine — Product Overview

> **Version:** 0.1.0 (Post-Audit Release)  
> **Stack:** Next.js 14 (App Router) · TypeScript · Gemini 2.0 Flash · IndexedDB  
> **Last Updated:** 2026-02-20

---

## What Is This?

A session-based AI documentation engine that generates, cross-references, and automatically repairs a full suite of software project documents — PRDs, architecture specs, tech stacks, roadmaps, API contracts, and more — through a structured chat interface and a cybernetic verification layer.

---

## Core Concepts

### Sessions
Every project lives in a **Session** — a self-contained workspace stored in IndexedDB (fully offline, no backend DB). Each session tracks:
- Generated documents (up to 12 types)
- Full chat history
- Custom per-document AI instructions
- Enabled/disabled document scope
- Document version history (before/after edits and harmonization)

### Document Suite (12 Types)
| Document | Purpose |
|---|---|
| PRD | Product requirements, user stories, goals |
| Design Document | Visual system, UI components, UX flows |
| Tech Stack | Technology decisions and rationale |
| Architecture | System design, component interactions |
| Tech Spec | Low-level implementation specifications |
| Roadmap | Milestones, phases, delivery timeline |
| API Spec | Endpoint contracts, request/response schemas |
| UI Design | Wireframes, design tokens, interaction patterns |
| Task List | Sprint tasks, priorities, assignees |
| Security Spec | Threat model, auth strategy, compliance |
| Data Model | Entity schemas, relationships, indexing |
| Vibe Prompt | Aesthetic direction, brand voice, UI personality |

---

## System Architecture

```
 Browser (Next.js 14 App Router)
 ├── / (Home)           — Session list, create/open sessions
 └── /session/[id]      — Main workspace
     ├── ChatPanel       — AI conversation, guided mode, doc generation
     ├── DocPreview      — Multi-tab document viewer + editor + diff viewer
     ├── VerifierPanel   — Cybernetic verification + harmonization
     └── SessionSettings — Custom instructions, enabled docs, project type

 API Routes (Edge-compatible)
 ├── POST /api/chat          — Streaming doc generation via Master Architect
 ├── POST /api/verify        — Verify (analysis) or Harmonize (auto-fix) mode
 └── POST /api/generate-image — Inline image generation for vibe prompts

 AI Layer
 ├── master-architect.yaml   — Primary system instruction for all doc generation
 ├── cybernetic-verifier.yaml — Verification & harmonization instruction
 └── 11 specialist YAMLs    — doc-specific structure specs (used as verifier input)

 Persistence
 └── IndexedDB (storage.ts)  — All session data, documents, history
```

---

## Key Features

### 1. Guided Interview Mode
When generating a document, the AI walks through structured topic questions relevant to the project type (webapp, game, business, etc.). Topics are type-specific — a game project gets questions about mechanics and monetization, not API schemas.

### 2. Cybernetic Verifier
Runs a 7-dimension analysis across all documents as a coupled system:
- **Cross-Reference Matrix** — Detects tech stack conflicts between docs
- **Contradiction Log** — Surfaces design decisions that contradict each other
- **Terminology Drift** — Catches "users" vs "members" vs "accounts" inconsistencies
- **Complexity Audit** — Flags TODOs, placeholders, missing sections
- **Coverage Gaps** — Checks expected sections per doc type against actual content
- **Consistency Checks** — Naming, formatting, priority label uniformity
- **Instruction Compliance** — Does each doc follow its own spec structure?

Issues are classified as `critical`, `warning`, or `info`.

### 3. Harmonize Mode (Auto-Fix)
After verification, the Harmonizer applies fixes per affected document. Batched by `targetDoc` — one harmonize request per affected document — to stay within token budget. Applied corrections are tracked so re-running verify shows progress.

### 4. Custom Instructions per Document
In **Session Settings**, each document type has an editable instruction that overrides how the AI generates it. Instructions are now injected directly into the system prompt on every request (previously they were cosmetic only).

### 5. Version History & Diff View
Every time the AI generates documents, edits are saved, or harmonization runs, a snapshot is taken. The Diff Viewer shows exactly what changed between any two versions.

### 6. Project Type Presets
6 preset types (Web App, Game, Business, Design System, Marketing, Infrastructure) each configure:
- Which documents are enabled by default
- Type-specific guided interview topics
- Default instruction baselines (used as reset targets in Settings)

---

## Document Generation Flow

```
User message
    ↓
/api/chat
    ↓ (system instruction built from:)
    ├── master-architect.yaml base
    ├── Existing documents context
    ├── Custom instructions per doc type   ← CRIT-003 fix
    └── Latest verifier report (if any)
    ↓
AI streams response
    ↓
parseDocumentBlocks() [state-machine parser] ← WARN-004 fix
    ├── Extracts ~~~doc:Type~~~...~~~ blocks
    └── Passes clean text to chat UI
    ↓
Documents saved to session → IndexedDB
```

---

## Verification Flow

```
"Run Verify" clicked
    ↓
/api/verify (mode: "verify")
    ├── Sends all session documents
    ├── Sends enabledDocs scope        ← WARN-002 fix
    └── Sends spec context from YAMLs
    ↓
cybernetic-verifier.yaml AI analysis
    ↓
Issues parsed from ~~~issues~~~ block
    ↓
VerifierPanel renders issue cards (critical → warning → info)

"Apply All Fixes" clicked
    ↓
Issues grouped by targetDoc            ← batching fix
    ↓
Per-doc harmonize requests (sequential)
    ↓
/api/verify (mode: "harmonize")
    ↓
Corrected docs merged & saved to session
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | — | Google Generative AI API key |
| `GEMINI_REASONING_MODEL` | No | `gemini-3-flash-preview` | Override model for chat/verify |
| `GEMINI_MODEL` | No | `gemini-3-flash-preview-preview-image-generation` | Override model for image gen |

---

## File Structure

```
src/
├── app/
│   ├── page.tsx                  # Home / session list
│   ├── session/[id]/page.tsx     # Session workspace
│   └── api/
│       ├── chat/route.ts         # Doc generation endpoint
│       ├── verify/route.ts       # Verify + harmonize endpoint
│       └── generate-image/route.ts
├── components/
│   ├── ChatPanel.tsx             # Chat UI + guided mode
│   ├── DocPreview.tsx            # Document viewer/editor
│   ├── VerifierPanel.tsx         # Verification UI
│   ├── SessionSettings.tsx       # Custom instructions + doc toggles
│   ├── DiffViewer.tsx            # Version diff display
│   ├── DocTabs.tsx               # Document tab navigation
│   ├── ExportBar.tsx             # Export (copy/download)
│   ├── MessageBubble.tsx         # Chat message rendering
│   ├── SessionCard.tsx           # Home page session card
│   └── GuidedProgress.tsx        # Interview progress tracker
└── lib/
    ├── storage.ts                 # IndexedDB session persistence
    ├── instructions.ts            # YAML instruction loader
    ├── doc-definitions.ts         # Project type presets + doc definitions
    ├── constants.ts               # Client-safe constants
    ├── gemini.ts                  # Google GenAI client factory
    ├── utils.ts                   # parseDocumentBlocks + helpers
    └── readme-generator.ts        # README generation utility

instructions/
├── master-architect.yaml          # Primary AI system instruction
├── cybernetic-verifier.yaml       # Verifier system instruction
├── prd-architect.yaml             # PRD spec (used by verifier)
├── [10 other specialist YAMLs]    # Doc structure specs
└── types/                         # Extended type specs (unused)
```

---

## Known Limitations

- **API Routes Unprotected** — No authentication layer. All endpoints are publicly accessible.
- **Specialist YAMLs Not Used for Generation** — 11 specialist YAML files define doc structures but the master architect handles all generation. Specialists only inform the verifier's spec context.
- **Guided Progress Tracking is Heuristic** — Progress is parsed from the AI's `"✅ X/Y topics covered"` text, which can fail if the model varies its phrasing.
- **No Harmonize Abort** — Long harmonize operations (many docs × many issues) cannot be cancelled mid-run.
- **Message History Trimmed Silently** — When sessions grow large, older messages are dropped without notification.

---

## Development

```bash
npm install
cp .env.example .env.local   # Add GEMINI_API_KEY
npm run dev                   # http://localhost:3000
```
