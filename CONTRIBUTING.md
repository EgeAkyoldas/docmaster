# Contributing to DocMaster

Thank you for your interest in contributing! This guide will get you up and running.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Install** dependencies: `npm install`
4. **Configure** environment: copy `.env.example` to `.env.local` and add your `GEMINI_API_KEY`
5. **Run** the dev server: `npm run dev`

## Development Workflow

```bash
# Start dev server
npm run dev

# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Build (verify production build)
npm run build
```

## Adding a New Document Type

All document types live in **one file**: [`src/lib/doc-definitions.ts`](src/lib/doc-definitions.ts).

1. Add a new entry to `DEFAULT_DOC_DEFINITIONS`:

```typescript
{
  label: "Your Doc Label",         // shown in tabs
  docKey: "Your Doc Key",          // unique identifier
  defaultInstruction: "generate a complete ...",  // AI instruction
  color: "violet",                 // one of the predefined colors
  guidedTopics: [                  // optional: structured questionnaire topics
    "Topic 1",
    "Topic 2",
  ],
}
```

2. Add `"Your Doc Key"` to the `enabledDocKeys` array of whichever project presets should include it.

3. Optionally add instruction overrides in relevant `PROJECT_TYPE_PRESETS` entries.

That's it — the rest of the UI picks it up automatically.

## Adding a New Project Type Preset

Add a new entry to `PROJECT_TYPE_PRESETS` in `doc-definitions.ts`:

```typescript
{
  id: "chrome-extension",
  label: "Chrome Extension",
  icon: "Puzzle",          // must be a key in ICON_MAP (page.tsx)
  description: "Browser extension with manifest v3",
  enabledDocKeys: ["PRD", "Tech Stack", "Architecture", "Vibe Prompt"],
  instructionOverrides: {
    "PRD": "generate a Chrome Extension PRD focused on ...",
  },
  guidedTopicOverrides: {
    "PRD": ["Extension name & purpose", "Target users", ...],
  },
}
```

Also add the icon to `ICON_MAP` in `src/app/page.tsx` and a color entry in `TYPE_COLORS`.

## Adding a New Verifier Rule

Verifier logic is in `src/components/VerifierPanel.tsx`. Rules are defined as functions that receive the document content and return issues:

```typescript
{
  id: "unique-rule-id",
  docKey: "Target Doc Key",
  label: "Descriptive rule name",
  severity: "error" | "warning",
  check: (content: string) => boolean,  // returns true if issue found
  message: "Human-readable description of the issue",
  fixPrompt: "AI instruction to fix this specific issue",
}
```

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Run `npm run build` before submitting to ensure no build errors
- Follow existing code patterns (no new dependencies without discussion)
- Write a clear PR description explaining what and why

## Code Style

- **TypeScript** — all new code must be typed
- **No `any`** — avoid unless absolutely necessary
- **Self-documenting** — prefer clear names over comments
- **Functional components** — React with hooks, no class components
- **Tailwind** — prefer utility classes; avoid inline styles

## Reporting Issues

Use [GitHub Issues](https://github.com/EgeAkyoldas/docmaster/issues). Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS

## License

By contributing, you agree your contributions will be licensed under the MIT License.
