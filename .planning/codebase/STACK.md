# Technology Stack

**Analysis Date:** 2026-04-16

## Languages

**Primary:**
- TypeScript 5.x - All source code, configuration files, and API routes
- JavaScript (JSX/TSX) - React components and Next.js pages

**Secondary:**
- YAML - Instruction definitions and configuration
- CSS - Global styles and Tailwind utilities
- Markdown - Documentation and instruction content

## Runtime

**Environment:**
- Node.js (no .nvmrc file present - uses project defaults)

**Package Manager:**
- npm (dependencies in `package.json`, lockfile expected: `package-lock.json`)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with API routes
- React 19.0.0 - UI components and state management
- React DOM 19.0.0 - DOM rendering

**UI & Components:**
- Radix UI - Headless component library
  - `@radix-ui/react-dialog` 1.1.4 - Modal dialogs
  - `@radix-ui/react-dropdown-menu` 2.1.4 - Dropdown menus
  - `@radix-ui/react-scroll-area` 1.2.2 - Scrollable areas
  - `@radix-ui/react-separator` 1.1.1 - Visual separators
  - `@radix-ui/react-slot` 1.1.1 - Slot-based component composition
  - `@radix-ui/react-tabs` 1.1.2 - Tab navigation
  - `@radix-ui/react-tooltip` 1.1.6 - Tooltip overlays
- Framer Motion 12.4.7 - Animation and motion design
- Lucide React 0.475.0 - Icon library
- Tailwind CSS 3.4.1 - Utility-first CSS framework
- Class Variance Authority 0.7.1 - Component style composition
- Tailwind Merge 2.6.1 - CSS utility merging
- Tailwind Animate 1.0.7 - Built-in animation utilities
- Autoprefixer 10.4.24 - CSS vendor prefix generation

**Markdown & Content:**
- React Markdown 9.0.3 - Render markdown in React
- Remark GFM 4.0.1 - GitHub Flavored Markdown support
- Rehype Highlight 7.0.2 - Syntax highlighting

**Client Storage:**
- idb 8.0.3 - IndexedDB wrapper for client-side persistence
- jszip 3.10.1 - ZIP file generation and extraction

**Utilities:**
- clsx 2.1.1 - Conditional className builder
- js-yaml 4.1.0 - YAML parsing and serialization

**Dev Tools:**
- TypeScript (types only) - TypeScript compiler and type definitions
- ESLint 9 - Code quality and style linting
- ESLint Config Next 16.1.6 - Next.js-specific linting rules
- PostCSS 8 - CSS transformation
- @types/node 20 - Node.js type definitions
- @types/react 19 - React type definitions
- @types/react-dom 19 - React DOM type definitions
- @types/js-yaml 4.0.9 - YAML type definitions

## Configuration

**Environment:**
- Configuration method: Environment variables
- Variable source: `.env.local` file (created from `.env.example`)
- Critical env vars:
  - `GEMINI_API_KEY` - Google Generative AI API key (required at runtime)
  - `GEMINI_REASONING_MODEL` - Optional Gemini model override (defaults to `gemini-3-flash-preview`)
  - `GEMINI_MODEL` - Optional image generation model (defaults to `gemini-3-flash-preview-preview-image-generation`)

**Build:**
- `next.config.ts` - Next.js configuration (server external packages configured)
- `tsconfig.json` - TypeScript compiler options (strict mode enabled, ES2017 target)
- `tailwind.config.ts` - Tailwind CSS theming and plugin configuration
- `postcss.config.mjs` - PostCSS with Tailwind and Autoprefixer plugins

**Type Checking:**
- Strict TypeScript mode enabled in `tsconfig.json`
- Path alias configured: `@/*` → `./src/*`
- DOM and ES2017 libraries included

## Platform Requirements

**Development:**
- Node.js runtime (version not explicitly specified)
- Git for version control
- Modern browser for frontend development

**Production:**
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

---

*Stack analysis: 2026-04-16*
