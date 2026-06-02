# Multi-Provider LLM Support — Design Spec

**Date:** 2026-06-02
**Status:** Approved (pending spec review)
**Author:** DocMaster team

## Goal

Let users run the existing DocMaster chat / verify workflow against multiple LLM
providers — Google Gemini, Anthropic (Claude), OpenAI (GPT), and Moonshot (Kimi) —
selecting any model via the existing settings UI. Each provider uses the user's own
API key (BYO-key), stored client-side only. The document-generation workflow,
streaming behavior, and prompt engineering remain identical across providers.

Image generation stays Gemini-only (Nano Banana is a Gemini capability) and always
uses the stored Gemini key.

## Scope

**In scope:**
- Provider abstraction layer covering text chat (`/api/chat`) and verify (`/api/verify`).
- Per-provider BYO key storage + migration from the current single-key shape.
- Multi-provider model picker in the settings modal.
- Vercel AI SDK as the unified streaming interface.

**Out of scope:**
- Image generation provider choice (stays Gemini).
- Vercel AI Gateway (rejected — would change BYO-key UX and add account/billing dependency).
- Server-side key storage (app remains client-side / BYO).
- Per-document or per-message provider switching (one active model at a time, as today).

## Architecture

### Single text chokepoint

Both text routes already funnel through one function — `streamChat` in `src/lib/gemini.ts`.
`/api/chat` and `/api/verify` both call it with `model: userModel || config.model`. The
image route (`/api/generate-image`) is independent and uses `@google/genai` directly.

This means the entire multi-provider change for text lives behind `streamChat`. The two
routes' SSE encoding loops stay unchanged as long as `streamChat` keeps returning an
async iterable that yields `{ text }` chunks.

### Component 1 — Provider registry (`src/lib/providers.ts`, new)

Single source of truth, imported by both client (UI, key hook) and server (routes, llm
layer). No React, no SDK instantiation at module scope.

```
type ProviderId = "gemini" | "anthropic" | "openai" | "moonshot";

interface ProviderModel { id: string; label: string; badge: "Fastest" | "Fast" | "Smart" | "Best"; }

interface ProviderDef {
  id: ProviderId;
  label: string;            // "Google Gemini"
  keyStorageKey: string;    // "docmaster_key_gemini"
  keyUrl: string;           // where to get a key
  keyPlaceholder: string;   // "AIzaSy..."
  validateKey: (k: string) => boolean;
  models: ProviderModel[];  // curated, current IDs
  supportsCustomModel: true;// free-text model id escape hatch
  baseURL?: string;         // moonshot only
}
```

Curated models (as of 2026-06-02; user-overridable via custom-model field):

| Provider | Models |
|---|---|
| gemini | `gemini-3.1-flash-lite` (Fastest), `gemini-3.5-flash` (Fast), `gemini-3.1-pro-preview` (Best) |
| anthropic | `claude-haiku-4-5` (Fastest), `claude-sonnet-4-6` (Fast), `claude-opus-4-8` (Best) |
| openai | `gpt-5.4-nano` (Fastest), `gpt-5.4-mini` (Fast), `gpt-5.5` (Best) |
| moonshot | `kimi-k2.6` (Smart) |

Key validators (prefix heuristics only — real validation is the API call):
- gemini: starts `AIza`, len > 20
- anthropic: starts `sk-ant-`
- openai: starts `sk-`
- moonshot: starts `sk-` (Moonshot keys are `sk-...`)

Moonshot baseURL: `https://api.moonshot.ai/v1`.

Helpers exported:
- `getProviderForModel(modelId): ProviderId` — lookup across all `models[]`, falls back
  to scanning custom-model→provider mapping stored alongside the model selection.
- `getProvider(id): ProviderDef`
- `ALL_MODELS` — flattened list for the picker.

Model IDs are globally unique across providers, so model→provider is an unambiguous lookup.

### Component 2 — Unified LLM layer (`src/lib/gemini.ts` → rename `src/lib/llm.ts`)

Replace the `@google/genai` internals of `streamChat` with the Vercel AI SDK `streamText`.
`ChatMessage` type and the `StreamChatOptions` signature stay the same so route code is
untouched except the import path.

```
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export async function streamChat(opts): AsyncIterable<{ text: string }> {
  const providerId = getProviderForModel(opts.model);
  const apiKey = opts.apiKey?.trim() || envFallback(providerId);
  if (!apiKey) throw new Error(`${providerId} API key is not set`);

  const model = buildModel(providerId, opts.model, apiKey); // returns AI SDK LanguageModel
  const result = streamText({
    model,
    system: opts.systemInstruction,
    messages: toModelMessages(opts.history, opts.message),
    temperature: opts.temperature,
    ...(opts.maxOutputTokens ? { maxOutputTokens: opts.maxOutputTokens } : {}),
  });

  // Adapter: yield {text} so route SSE loops (`chunk.text`) stay unchanged.
  return (async function* () {
    for await (const delta of result.textStream) yield { text: delta };
  })();
}
```

`buildModel` instantiates the right provider with the user's key:
- gemini: `createGoogleGenerativeAI({ apiKey })(modelId)`
- anthropic: `createAnthropic({ apiKey })(modelId)`
- openai: `createOpenAI({ apiKey })(modelId)`
- moonshot: `createOpenAICompatible({ apiKey, baseURL })(modelId)`

`history` (`{role:"user"|"model", parts:[{text}]}`) maps to AI SDK `messages`
(`{role:"user"|"assistant", content}`); `"model"` → `"assistant"`.

`@google/genai` stays in the project — used only by the image route. AI SDK packages are
added alongside it.

### Component 3 — Routes (`/api/chat`, `/api/verify`)

Minimal change. They already read `x-api-key` + `x-model` and call `streamChat`. The only
substantive edits:
- import path `@/lib/gemini` → `@/lib/llm`.
- `history.map(... role:"model" ...)` stays (llm layer handles the mapping).
- error mapping (`401/403/429/503`) stays; provider errors surface through the same SSE
  error event.

### Component 4 — Key storage (`src/lib/useApiKey.ts`)

Move from a single key to a per-provider map.

```
keys:  Record<ProviderId, string>     // localStorage docmaster_key_<provider>
model: string                          // selected model id, implies provider
modelProvider: string  (custom models) // localStorage docmaster_model_provider, for custom-model lookup
```

API surface:
- `saveKey(provider, key)`, `clearKey(provider)`
- `keys`, `model`, `saveModel(modelId, providerId?)`
- `resolveKeyForModel(modelId)` → the provider key to send as `x-api-key`
- `hasKeyFor(provider)`

**Migration:** on first load, if legacy `docmaster_gemini_api_key` exists and
`docmaster_key_gemini` does not, copy it over, then leave the legacy key in place (no
destructive delete). Legacy `docmaster_gemini_model` migrates to the new model key if the
stored value is still a valid model.

### Component 5 — Request flow

The three senders — `ChatPanel.tsx:342`, `DocPreview.tsx:209`, `VerifierPanel.tsx:409` —
keep sending `x-api-key` + `x-model`. The only change: `x-api-key` is now
`resolveKeyForModel(selectedModel)` instead of the single Gemini key. `x-model` is the
selected model id, unchanged in mechanism.

Server derives provider from `x-model` via the shared `providers.ts`, so client and server
agree without a new header.

### Component 6 — Image generation guard (`/api/generate-image`)

Unchanged engine (`@google/genai`, `gemini-3.1-flash-image`). The client always sends the
stored **gemini** key for image requests (not the active chat provider's key). If no gemini
key is set, the route returns `400` with
`"Add a Gemini key in settings to generate images."`. ChatPanel surfaces this as an inline
error message (same path as existing image-failure handling).

### Component 7 — Settings UI (`src/components/ApiKeyModal.tsx`)

Restructure into provider sections:
- A provider selector row (4 tabs: Gemini / Claude / GPT / Kimi).
- Selected tab shows: that provider's key input (provider-specific placeholder, validator,
  "key set ✓" state, get-key link) and its model grid.
- Selecting a model anywhere sets the global active model (and records its provider for
  custom models).
- A per-provider custom-model text input ("Use a model not listed").
- When the active model's provider ≠ gemini, show a hint: "Image generation uses your
  Gemini key — add one to generate diagrams."

The existing visual language (badges, cyan accent, mono type) is preserved. `GEMINI_MODELS`
export is replaced by `providers.ts` data; `GeminiModelId` type widens to `string`.

## Data Flow

1. User picks model X in settings → `saveModel(X)` → localStorage + state.
2. User sends chat → component reads `resolveKeyForModel(X)` + `X` → POST with
   `x-api-key`, `x-model`.
3. Route → `streamChat({ model: X, apiKey, ... })` → `getProviderForModel(X)` →
   AI SDK `streamText` against that provider → SSE `{text}` chunks (unchanged format).
4. Image request → always Gemini key → `/api/generate-image` → `@google/genai`.

## Error Handling

- Missing key for selected provider: `streamChat` throws `"<provider> API key is not set"`;
  route returns 401-style message; UI prompts to open settings.
- Provider API errors (rate limit, auth, overload): surfaced through the existing SSE error
  event and the route's status-code→message mapping. AI SDK normalizes many of these.
- Image without Gemini key: 400 with explicit message, surfaced inline in chat.
- Unknown / custom model: if `getProviderForModel` can't resolve, fall back to the stored
  `modelProvider`; if still unknown, error `"Unknown model — re-select in settings."`.

## Testing

- `tests/providers.test.ts` — registry integrity (every model has a provider; IDs unique;
  validators accept/reject sample keys; `getProviderForModel` correctness; baseURL set for
  moonshot only).
- `tests/useApiKey.test.ts` — legacy single-key → per-provider migration; `resolveKeyForModel`
  returns the right provider key; `saveModel` records provider for custom models.
- `tests/llm.test.ts` — streaming dispatch smoke test with the AI SDK mocked: asserts the
  correct provider package is selected per model id and that `{text}` chunks are yielded.

Existing tests must keep passing. `tsc --noEmit`, `next build`, and `vitest` are the gates.

## Dependencies Added

`ai`, `@ai-sdk/google`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/openai-compatible`
(all AI SDK v6 line). `@google/genai` retained for the image route.

## Risks / Notes

- **Model IDs drift.** Curated lists are point-in-time (2026-06-02). The custom-model field
  is the escape hatch so new releases work without a code change.
- **AI SDK v6 streaming shape.** `result.textStream` yields strings; the adapter wraps them
  as `{text}` to avoid touching route loops. Verified against AI SDK v6 docs at build time.
- **Provider feature parity.** System prompt + temperature are universal. No provider-specific
  features (tool use, thinking config) are exposed — out of scope.
- **`@ai-sdk/openai-compatible` for Moonshot.** If Kimi diverges from OpenAI-compat in a way
  that breaks streaming, fall back to documenting Kimi as best-effort.
