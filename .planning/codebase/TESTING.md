# Testing Patterns

**Analysis Date:** 2026-04-16

## Test Framework

**Status:** Not Configured

The project does not have a test framework installed or configured. No testing dependencies appear in `package.json` and no test files exist in the source directories (`src/`).

**Directory noted:** `testsprite_tests/` exists at project root but contains JSON test plans and temporary files, not automated test code.

## Recommendation for Adding Tests

**Test Framework Options:**
- **Vitest** (recommended for this Next.js + TypeScript project)
  - Lightweight, fast, excellent TypeScript support
  - Near-Jest API compatibility
  - Ideal for unit and integration testing
  
- **Jest** (alternative, heavier)
  - Industry standard, wide adoption
  - Longer setup time for Next.js projects

**Testing Library:** `@testing-library/react` for component testing

**Assertion Library:** Vitest built-in `expect()` or similar assertion library

## Current State: No Tests

**Absence Analysis:**

| Category | Exists? | Location |
|----------|---------|----------|
| Unit tests | No | — |
| Integration tests | No | — |
| E2E tests | No | — |
| Test configuration | No | — |
| Test fixtures/mocks | No | — |

## Code Without Tests: Key Areas

**High-Risk Components (no test coverage):**

1. **`ChatPanel.tsx` (993 lines)**
   - Manages streaming API calls, document parsing, guided mode state
   - Complex state machine with multiple refs and effects
   - Critical user interaction paths
   - Should test: message sending, streaming state transitions, guided mode progression, document extraction

2. **`VerifierPanel.tsx` (1280 lines)**
   - Cross-document consistency validation
   - Complex analysis algorithm
   - Should test: issue detection logic, harmonization suggestions, report generation

3. **`src/app/api/chat/route.ts` (134 lines)**
   - Server-side API endpoint handling user messages
   - System instruction composition and injection
   - Streaming SSE response generation
   - Should test: request validation, instruction building, error handling, SSE format

4. **`src/app/api/verify/route.ts` (211 lines)**
   - Verification/harmonization logic
   - Report generation
   - Should test: issue analysis, harmonization recommendations

5. **`src/lib/utils.ts` (126 lines)**
   - Document block parsing with state machine
   - Image marker extraction
   - Would be ideal for unit tests due to pure function nature
   - Should test: edge cases in markdown parsing (nested fences, various marker formats)

6. **`src/lib/patchUtils.ts` (143 lines)**
   - Section matching algorithm
   - Heuristic-based fuzzy matching
   - Should test: matching accuracy with various doc formats and content types

**Data Processing Without Tests:**

- `parseDocumentBlocks()` - State machine parsing multi-fence document formats
- `parseImageMarkers()` - Regex-based extraction
- `parseOptions()` - Option parsing from AI-generated markdown
- `buildGuidedPrompt()` - Dynamic prompt construction
- `formatDate()`, `truncate()` - Utility functions

## Suggested Test Structure (If Tests Are Added)

### Test File Organization

**Location Pattern:**
- Co-located with source: `ComponentName.test.tsx` next to `ComponentName.tsx`
- Utilities: `utils.test.ts` next to `utils.ts`

**Naming:**
- Test files: `*.test.ts` or `*.test.tsx`
- Describe blocks: name the function/component being tested
- Test cases: describe behavior (e.g., "should parse document blocks with ~~~ markers")

### Test Structure (Proposed Pattern)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { parseDocumentBlocks, parseImageMarkers } from '@/lib/utils';

describe('parseDocumentBlocks', () => {
  it('should extract single document block', () => {
    const input = `Some text\n~~~doc:PRD\nContent here\n~~~\nMore text`;
    const { cleanText, documents } = parseDocumentBlocks(input);
    expect(documents['PRD']).toBe('Content here');
    expect(cleanText).toContain('Some text');
    expect(cleanText).not.toContain('~~~doc:PRD');
  });

  it('should handle nested code fences within document blocks', () => {
    const input = `~~~doc:PRD\n\`\`\`js\ncode\n\`\`\`\n~~~`;
    const { documents } = parseDocumentBlocks(input);
    expect(documents['PRD']).toContain('js');
  });

  it('should preserve empty documents', () => {
    const input = '~~~doc:Empty\n~~~';
    const { documents } = parseDocumentBlocks(input);
    expect(documents['Empty']).toBe('');
  });
});

describe('parseImageMarkers', () => {
  it('should extract single image marker', () => {
    const text = 'Text ~~~image:a diagram~~~. More text.';
    const prompts = parseImageMarkers(text);
    expect(prompts).toEqual(['a diagram']);
  });

  it('should extract multiple image markers', () => {
    const text = '~~~image:diagram 1~~~ and ~~~image:diagram 2~~~';
    const prompts = parseImageMarkers(text);
    expect(prompts).toEqual(['diagram 1', 'diagram 2']);
  });
});

describe('ChatPanel Component', () => {
  it('should send message and update messages state', async () => {
    const onMessagesUpdate = vi.fn();
    const { getByPlaceholderText, getByRole } = render(
      <ChatPanel 
        messages={[]} 
        isStreaming={false}
        existingDocs={{}}
        onMessagesUpdate={onMessagesUpdate}
        onDocumentsUpdate={vi.fn()}
        onStreamingChange={vi.fn()}
      />
    );
    
    const input = getByPlaceholderText(/Describe your project/);
    const sendButton = getByRole('button', { name: /Send|send/ });
    
    // Type message
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(onMessagesUpdate).toHaveBeenCalled();
    });
  });
});
```

### What to Test

**Unit Tests:**
- Pure utility functions: `parseDocumentBlocks()`, `parseImageMarkers()`, `formatDate()`, `truncate()`
- Option parsing logic: `parseOptions()` with various markdown formats
- Slug generation: `slugify()` function with edge cases
- Document filtering and matching in `patchUtils.ts`

**Integration Tests:**
- API route handlers: POST `/api/chat` with request/response validation
- API route handlers: POST `/api/verify` with document injection
- Storage operations: save/load from IndexedDB (if added)
- Session creation and message persistence

**Component Tests:**
- `ChatPanel`: sending messages, streaming UI updates, guided mode progression
- `MessageBubble`: markdown rendering, option parsing and selection
- `VerifierPanel`: issue display, harmonization UI
- `ExportBar`: export functionality (zip generation)

### What NOT to Test

- Third-party library behavior (Framer Motion, React Markdown, etc.)
- Next.js framework behavior
- Exact styling/CSS output (use visual regression tools if needed)
- API responses from Gemini API (mock in tests)

### Mocking Strategy

**Patterns (if tests were implemented):**

```typescript
// Mock fetch for API calls
vi.stubGlobal('fetch', vi.fn());

// Mock Gemini API
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    chats: {
      create: vi.fn(() => ({
        sendMessageStream: vi.fn(async function* () {
          yield { text: 'Response' };
        }),
      })),
    },
  })),
}));

// Mock IndexedDB for storage tests
const mockDB = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  getAllFromIndex: vi.fn(),
};
vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve(mockDB)),
}));

// Real behavior to preserve:
- User input handlers (no mocking)
- Component rendering logic
- State transitions
- Error handling paths
```

## Coverage Gaps

**Critical untested areas:**

| Module | Issue | Risk Level |
|--------|-------|-----------|
| `ChatPanel.tsx` | Entire streaming pipeline untested | Critical |
| `VerifierPanel.tsx` | Verification algorithm untested | Critical |
| `src/app/api/chat/route.ts` | API request handling untested | High |
| `src/app/api/verify/route.ts` | Verify endpoint untested | High |
| `parseDocumentBlocks()` | Edge cases in nested fences untested | Medium |
| `patchUtils.ts` | Fuzzy matching heuristics untested | Medium |
| Error handling | Global error paths not tested | Medium |

## Test Commands (Proposed)

Once Vitest is added to `package.json`:

```bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:ui          # Interactive UI
npm run test:coverage    # Coverage report
```

Would be added to `package.json` scripts:
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage"
}
```

## Performance Testing

**Not currently performed.** Areas that should be monitored if tests are added:

- Streaming performance in ChatPanel (RAF batching already implemented)
- Document parsing performance with large inputs (> 100KB)
- Guided mode re-renders during streaming
- IndexedDB migration performance on first load

---

*Testing analysis: 2026-04-16*

**Note:** This project prioritizes rapid iteration and AI-assisted development over test-driven development. As the codebase stabilizes, adding tests for critical paths (API routes, complex algorithms, state machines) would significantly reduce regression risk.
