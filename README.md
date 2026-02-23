<div align="center">

<br />

```
██████╗  ██████╗  ██████╗███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗
██╔══██╗██╔═══██╗██╔════╝████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██║  ██║██║   ██║██║     ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
██║  ██║██║   ██║██║     ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
██████╔╝╚██████╔╝╚██████╗██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
╚═════╝  ╚═════╝  ╚═════╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
```

**AI Document Factory** — Generate professional technical documents through conversation.

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[**Live Demo**](https://docmaster.vercel.app) · [**Report Bug**](https://github.com/EgeAkyoldas/docmaster/issues) · [**Request Feature**](https://github.com/EgeAkyoldas/docmaster/issues)

<br />

![DocMaster Hero](.github/assets/hero.png)

</div>

---

## ✦ What is DocMaster?

DocMaster is an **AI-powered documentation factory** that transforms a simple conversation into a complete suite of professional technical documents. No more staring at blank pages. Tell the AI about your project, and it generates everything — PRDs, Architecture docs, API specs, Security specs, and more — all cross-referenced and consistent with each other.

> **"From idea to a full documentation suite in minutes, not weeks."**

---

## ✦ Features

### 🤖 Conversational Document Generation
Chat naturally with Gemini 2.0 Flash to describe your project. The AI understands context, asks clarifying questions, and generates documents that are tailored to your specific needs — not generic templates.

### 📁 7 Project Type Presets
Each preset activates the right document toolkit and uses domain-specific AI instructions:

| Preset | Documents Included | Best For |
|--------|-------------------|----------|
| 🖥️ **Web / Mobile App** | PRD, Architecture, Tech Stack, API Spec, Data Model, Security Spec, UI Design, Roadmap, Task List, Vibe Prompt | SaaS, mobile apps, full-stack projects |
| 🎮 **Game** | PRD, Design Doc, Tech Stack, Architecture, UI Design, Roadmap, Task List, Vibe Prompt | Video games, indie projects |
| 📈 **Business / Startup** | PRD, Design Doc, Roadmap, Task List, Vibe Prompt | Startups, pitch decks, product strategy |
| 🎨 **Design System** | PRD, Design Doc, UI Design, Tech Stack, Vibe Prompt | Component libraries, token systems |
| 📣 **Marketing Site** | PRD, UI Design, Tech Stack, Roadmap, Task List, Vibe Prompt | Landing pages, promotional sites |
| 🖧 **Infrastructure** | PRD, Architecture, Tech Stack, Tech Spec, API Spec, Data Model, Security Spec, Roadmap, Task List, Vibe Prompt | DevOps, cloud infra, backend services |
| ⚙️ **Custom** | All 12 document types | Everything else |

### 📄 12 Document Types

| Document | Color | Purpose |
|----------|-------|---------|
| **PRD** | Cyan | Product Requirements Document |
| **Design Doc** | Violet | System design & trade-offs |
| **Tech Stack** | Emerald | Technology choices with rationale |
| **Architecture** | Amber | C4 model system architecture |
| **Tech Spec** | Rose | Implementation blueprint |
| **API Spec** | Orange | Endpoints, auth, schemas |
| **UI Design** | Pink | Design system & screen specs |
| **Data Model** | Teal | Entity relationships & schemas |
| **Security Spec** | Red | Threat model & compliance |
| **Roadmap** | Sky | Phased delivery timeline |
| **Task List** | Green | Nested epics, stories & tasks |
| **Vibe Prompt** | Lime | Master AI handoff document |

### ✅ AI Verifier
The built-in Verifier cross-checks every document against intelligent rules:
- Detects missing required sections
- Identifies cross-document inconsistencies
- Flags incomplete or contradictory decisions
- **Surgical patch mode** — AI fixes specific issues without rewriting the whole document

### 🔀 Diff Viewer
Side-by-side diff view showing exactly what changed between document versions. Never lose track of edits.

### 📦 Export System
Export your entire documentation suite:
- **Markdown** — Individual `.md` files
- **ZIP Bundle** — All documents packaged together
- **Copy to Clipboard** — One-click copy for any document

### 💾 Offline-First Storage
All sessions are stored locally using IndexedDB. Your documents are private by default — nothing is sent to the cloud except the AI generation calls.

### 🎯 Guided Mode
Not sure what information the AI needs? Guided mode presents a structured questionnaire for each document type, ensuring you provide the right context for the best output.

---

## ✦ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **UI** | React 19, Tailwind CSS 3.4, Radix UI |
| **Animations** | Framer Motion 12 |
| **AI** | Google Generative AI (`@google/genai`) — Gemini 2.0 Flash |
| **Markdown** | `react-markdown` + `remark-gfm` + `rehype-highlight` |
| **Storage** | IndexedDB via `idb` |
| **Config** | `js-yaml` for instruction definitions |
| **Icons** | Lucide React |
| **Language** | TypeScript 5 |

---

## ✦ Quick Start

### Prerequisites
- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com/) API key (free tier available)

### 1. Clone & Install

```bash
git clone https://github.com/EgeAkyoldas/docmaster.git
cd docmaster
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you're ready.

---

## ✦ How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        DocMaster Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CREATE PROJECT                                              │
│     Name your project → Select type preset                      │
│     ↓                                                           │
│  2. CHAT                                                        │
│     Describe your project to the AI via ChatPanel               │
│     ↓                                                           │
│  3. GENERATE DOCS                                               │
│     Click any doc tab → AI generates with full context          │
│     All docs cross-reference each other automatically           │
│     ↓                                                           │
│  4. VERIFY & REFINE                                             │
│     Run Verifier → See issues → Apply surgical AI fixes         │
│     Use Diff Viewer to review changes                           │
│     ↓                                                           │
│  5. EXPORT                                                      │
│     Download individual Markdown files or full ZIP bundle       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Session Architecture

Each **Session** maps to one project and stores:
- Project name, type, and creation timestamp
- All generated document contents (keyed by doc type)
- Custom AI instruction overrides per document
- Chat history
- Enabled document types for the project

Sessions are persisted to IndexedDB and survive browser refreshes.

---

## ✦ Project Structure

```
docmaster/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard — session list & new project flow
│   │   ├── session/[id]/         # Session workspace page
│   │   ├── api/                  # API routes (Gemini proxy)
│   │   ├── globals.css           # Design tokens, glass morphism styles
│   │   └── layout.tsx            # Root layout
│   │
│   ├── components/
│   │   ├── ChatPanel.tsx         # Main AI chat interface
│   │   ├── DocPreview.tsx        # Markdown rendering with syntax highlight
│   │   ├── DocTabs.tsx           # Document type switcher
│   │   ├── VerifierPanel.tsx     # Document quality verifier
│   │   ├── DiffViewer.tsx        # Side-by-side diff comparison
│   │   ├── ExportBar.tsx         # Export to Markdown / ZIP
│   │   ├── GuidedProgress.tsx    # Guided questionnaire UI
│   │   ├── MessageBubble.tsx     # Chat message rendering
│   │   ├── SessionCard.tsx       # Dashboard project card
│   │   └── SessionSettings.tsx   # Per-session configuration
│   │
│   └── lib/
│       ├── doc-definitions.ts    # 📌 Single source of truth for all doc types & presets
│       ├── storage.ts            # IndexedDB session persistence
│       ├── gemini.ts             # Gemini AI client setup
│       ├── instructions.ts       # System prompt templates
│       ├── patchUtils.ts         # Surgical patch diffing logic
│       ├── readme-generator.ts   # README auto-generation helper
│       ├── constants.ts          # App-wide constants
│       └── utils.ts              # Utility functions
│
├── instructions/                 # YAML-based content action definitions
├── docs/                         # Additional documentation
└── next.config.ts
```

---

## ✦ Key Design Decisions

### Single Source of Truth for Document Definitions
All 12 document types and 7 project presets are defined in [`doc-definitions.ts`](src/lib/doc-definitions.ts). This single file drives:
- Tab labels and colors in `ChatPanel`
- Document list in `SessionSettings`
- Verification rules in `VerifierPanel`
- Guided topics in `GuidedProgress`
- Export structure in `ExportBar`

This means adding a new document type is a one-file change.

### Cross-Document Context Injection
When generating any document, the AI receives all previously generated documents as context. This ensures technical decisions made in the Tech Stack document appear consistently in the Architecture document, and the API Spec aligns with the Data Model.

### Surgical Patch Mode
The Verifier doesn't regenerate entire documents to fix issues. It identifies the exact problematic section and issues a targeted patch, preserving the rest of the document. This is critical for large documents where a full regeneration would be slow and disrupt approved content.

### Offline-First with IndexedDB
Using `idb` for session storage means:
- No backend database required
- Documents are private by default
- Works offline for viewing/editing existing sessions
- Sessions survive browser reloads with no sync lag

---

## ✦ Configuration

### Custom AI Instructions

In `SessionSettings`, you can override the default AI instruction for any document type on a per-project basis. This lets you add domain-specific constraints, enforce company standards, or guide the AI toward your preferred documentation style.

### Document Type Toggling

Each project can have a subset of the 12 document types enabled. The preset selection sets sensible defaults, but you can enable/disable document types in session settings at any time.

---

## ✦ Deployment

DocMaster is a standard Next.js application. Deploy to [Vercel](https://vercel.com) with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/EgeAkyoldas/docmaster)

**Required environment variable:**
```
GEMINI_API_KEY=your_key_here
```

For other platforms (Railway, Render, Fly.io), it's a standard `npm run build && npm start` deployment.

---

## ✦ Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ideas for contributions:**
- New document types (e.g., `Compliance Checklist`, `Incident Runbook`)
- New project type presets (e.g., `Chrome Extension`, `CLI Tool`, `AI Agent`)
- Export format additions (PDF, Notion-compatible, Confluence)
- Verifier rule improvements
- UI improvements and accessibility

---

## ✦ License

MIT © [Ege Akyoldas](https://github.com/EgeAkyoldas)

---

<div align="center">

**Built with [Next.js](https://nextjs.org/) & [Google Gemini](https://ai.google.dev/)**

</div>
