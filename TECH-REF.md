# TECH-REF.md — Universal AI Technical Reference

> **FOR AI ASSISTANTS:** Read this before writing any code for this project.
> All patterns are verified via Context7 MCP. Last updated: 2026-02-20.
> When a section is marked with project tags like `[NEXT]` or `[VITE]`, it applies only to those project types.

---

## 🗂️ Project Type Classification

Before using this document, identify your project type:

| Tag | Project Type | Examples |
| --- | --- | --- |
| `[NEXT]` | Next.js App Router | Full-stack SSR/SSG apps |
| `[VITE]` | Vite + React SPA | Pure frontend, no server |
| `[NODE]` | Node.js Backend | Express/Fastify REST API |
| `[UNIV]` | Universal | Applies to all project types |
| `[AI]` | AI/LLM Integration | Any project using Gemini |
| `[AUTH]` | Authentication | Any project with auth |
| `[DB]` | Database / ORM | Supabase, Prisma, Drizzle |
| `[TEST]` | Testing | Playwright, Vitest |
| `[PAY]` | Payments | Stripe |

> **This specific project:** `[NEXT]` + `[AI]` — Next.js 15.1.7 + @google/genai 1.x

---

## 📦 This Project's Dependencies (source of truth)

| Package                 | Version      |
| ----------------------- | ------------ |
| `next`                  | **15.1.7**   |
| `react` / `react-dom`   | **^19.0.0**  |
| `@google/genai`         | **^1.0.0**   |
| `framer-motion`         | **^12.4.7**  |
| `tailwindcss`           | **^3.4.1**   |
| `typescript`            | **^5**       |
| `lucide-react`          | **^0.475.0** |
| `react-markdown`        | **^9.0.3**   |
| `idb`                   | **^8.0.3**   |

---

## 1. `[AI]` Google GenAI — @google/genai v1.x

> ⚠️ **CRITICAL:** `@google/generative-ai` (old) is DEPRECATED.
> The new package is `@google/genai` — completely different API surface.

### ✅ Initialization

```ts
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
```

> ❌ `new GoogleGenerativeAI(apiKey)` — old, do not use

### ✅ Current Recommended Model Names (Context7-verified, Feb 2026)

| Use Case | Model ID | Notes |
| --- | --- | --- |
| General text + multimodal | `gemini-3-flash-preview` | Recommended default |
| Coding + complex reasoning | `gemini-3-pro-preview` | Slower, smarter |
| Low latency / high volume | `gemini-2.5-flash-lite` | Fastest |
| Fast image generation | `gemini-2.5-flash-image` | Most use-cases |
| High-quality image gen | `gemini-3-pro-image-preview` | Supports aspect ratio + resolution |
| Video generation | `veo-3.0-generate-001` | |

> ❌ Deprecated — do NOT use: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-pro`

### ✅ Single-turn streaming

```ts
const response = await ai.models.generateContentStream({
  model: 'gemini-3-flash-preview',
  contents: 'Write a summary.',
});
for await (const chunk of response) {
  process.stdout.write(chunk.text ?? '');
}
```

### ✅ Multi-turn chat with streaming

```ts
const chat = ai.chats.create({ model: 'gemini-3-flash-preview' });

// Non-streaming
const res = await chat.sendMessage({ message: 'Hello!' });
console.log(res.text);

// Streaming
const stream = await chat.sendMessageStream({ message: 'Continue...' });
for await (const chunk of stream) {
  process.stdout.write(chunk.text ?? '');
}

// History
const history = chat.getHistory();
```

> ❌ Old: `model.startChat({ history })` — does not exist in v1

### ✅ System instruction

```ts
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  config: { systemInstruction: 'You are a concise assistant.' },
  contents: 'What is TypeScript?',
});
console.log(response.text);
```

### ✅ Text + Image generation (gemini-2.5-flash-image)

```ts
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash-image',
  contents: 'A futuristic city at night',
});

for (const part of response.candidates?.[0]?.content?.parts ?? []) {
  if (part.inlineData) {
    // part.inlineData.data  → base64 string
    // part.inlineData.mimeType → 'image/png'
    const url = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  }
}
```

### ✅ High-quality image (gemini-3-pro-image-preview) — with config

```ts
const response = await ai.models.generateContent({
  model: 'gemini-3-pro-image-preview',
  contents: 'System architecture diagram',
  config: {
    imageConfig: {
      aspectRatio: '16:9',  // '1:1','4:3','16:9','21:9'
      imageSize: '2K',      // '1K', '2K', '4K'
    },
    tools: [{ googleSearch: {} }], // optional
  },
});
```

> ❌ Old: `generationConfig.responseModalities` outside `config` — wrong in v1

---

## 2. `[NEXT]` Next.js 15 — App Router

### ✅ Route Handlers

```ts
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}
```

> ❌ `pages/api/*.ts` — Pages Router only; do not use for new code

### ✅ Streaming Response

```ts
export async function POST() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('chunk 1'));
      controller.enqueue(encoder.encode('chunk 2'));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

### ✅ Dynamic Params — MUST be awaited in Next.js 15

```ts
// app/session/[id]/page.tsx
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ← REQUIRED
  return <div>{id}</div>;
}
```

> ❌ `params.id` without await — fails in Next.js 15

### ✅ Metadata API

```ts
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Page', description: '...' };
```

> ❌ `<Head>` from `next/head` — Pages Router only

### ✅ Server vs Client Components

```ts
// Server Component (default, no directive)
export default function Layout({ children }: { children: React.ReactNode }) {
  return <main>{children}</main>;
}

// Client Component
'use client'; // ← must be first line of the FILE
import { useState } from 'react';
export default function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

### ✅ Server Actions

```ts
'use server';
export async function submitForm(formData: FormData) {
  const name = formData.get('name');
}
```

---

## 3. `[VITE]` Vite + React SPA

### ✅ Project setup

```bash
npm create vite@latest my-app -- --template react-ts
```

### ✅ vite.config.ts

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': '/src' },
  },
});
```

### ✅ Environment variables

```ts
// .env
VITE_API_URL=https://api.example.com

// In code — MUST be prefixed VITE_
const url = import.meta.env.VITE_API_URL;
```

> ❌ `process.env.VITE_*` — does NOT work in Vite; use `import.meta.env`
> ❌ `process.env.SECRET` — never exposed to client in Vite; server-only env vars need a backend

### ✅ API calls from Vite SPA

```ts
// All API calls go to a separate backend (Express/Fastify/etc)
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message }),
});
```

---

## 4. `[NODE]` Node.js Backend — Express v5

### ✅ Basic route handler (Express v5)

```ts
import express, { Request, Response, NextFunction } from 'express';

const app = express();
app.use(express.json());

// Express v5: async errors are automatically caught (no need for try/catch wrapper)
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message } = req.body;
  res.json({ reply: `Echo: ${message}` });
});
```

> ❌ Express v4 pattern: wrapping async handlers in `asyncHandler()` — not needed in v5
> ❌ `app.get('/route', (req, res, next) => { ... next(err) })` for async — use native async/await in v5

### ✅ Streaming response (SSE) in Express

```ts
app.post('/api/stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const stream = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: req.body.prompt,
  });

  for await (const chunk of stream) {
    res.write(`data: ${chunk.text}\n\n`);
  }
  res.end();
});
```

### ✅ Router pattern

```ts
// routes/chat.ts
import { Router } from 'express';
const router = Router();

router.post('/', async (req, res) => {
  res.json({ ok: true });
});

export default router;

// app.ts
import chatRouter from './routes/chat';
app.use('/api/chat', chatRouter);
```

---

## 5. `[UNIV]` React 19 — Universal Hooks

### ✅ Core hooks (unchanged from React 18)

```ts
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';

const memoized = useMemo(() => computeExpensive(dep), [dep]);
const stableFn = useCallback((id: string) => doWork(id), [dep]);
```

### ✅ forwardRef + useImperativeHandle

```ts
import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface MyHandle { focus: () => void; }

const MyInput = forwardRef<MyHandle, { label: string }>(
  function MyInput({ label }, ref) {
    const inner = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => ({ focus: () => inner.current?.focus() }));
    return <input ref={inner} placeholder={label} />;
  }
);
```

### ✅ React 19: `use()` hook (new)

```ts
import { use, Suspense } from 'react';

function Message({ promise }: { promise: Promise<string> }) {
  const result = use(promise); // unwraps promise — replaces useEffect+useState pattern
  return <p>{result}</p>;
}
```

### ❌ Deprecated React patterns

| Old | Current |
| --- | --- |
| `React.FC` with implicit children | Plain function with typed props |
| `defaultProps` on functions | Default parameter values |
| `propTypes` | TypeScript |
| `ReactDOM.render()` | `createRoot(el).render(<App/>)` |
| `componentDidMount` | `useEffect(() => {}, [])` |

### ✅ React Compiler (React 19 — babel-plugin-react-compiler)

> ⚠️ **This ships with React 19, NOT React 20 (which does not exist yet).**
> Compiler is opt-in. Eliminates most `useMemo` / `useCallback` boilerplate automatically.

```bash
npm install -D babel-plugin-react-compiler
npm install react-compiler-runtime
```

```js
// babel.config.js / next.config.js
module.exports = {
  // Next.js 15: experimental.reactCompiler = true (built-in)
  plugins: [
    ['babel-plugin-react-compiler', {
      compilationMode: 'annotation', // 'infer' | 'annotation' | 'all'
    }],
  ],
};
```

```tsx
// BEFORE compiler (manual)
function ProductCard({ product }: { product: Product }) {
  const price = useMemo(() => formatPrice(product.price), [product.price]);
  const onClick = useCallback(() => addToCart(product.id), [product.id]);
  return <div onClick={onClick}>{price}</div>;
}

// AFTER compiler (auto-memoized by compiler, write plain code)
function ProductCard({ product }: { product: Product }) {
  // ✅ Compiler generates the cache slots automatically
  const price = formatPrice(product.price);
  const onClick = () => addToCart(product.id);
  return <div onClick={onClick}>{price}</div>;
}
```

> ❌ Compiler **CANNOT** optimize components that mutate props or state directly
> ❌ Components must be **pure functions** — same inputs → same output
> ✅ Use `"use no memo"` directive to opt a component out of compilation

```tsx
function DebugComponent() {
  "use no memo"; // ← opts this component out
  return <div>{Date.now()}</div>; // impure — correct to skip
}
```

---

## 6. `[UNIV]` Framer Motion v12

```ts
import { motion, AnimatePresence } from 'framer-motion';
```

```tsx
// Animated element
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.15 }}
/>

// Conditional mount/unmount animation
<AnimatePresence>
  {isOpen && (
    <motion.div key="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      content
    </motion.div>
  )}
</AnimatePresence>
```

---

## 7. `[UNIV]` TypeScript 5

```ts
// Discriminated union state
type State<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; data: T }
  | { status: 'error'; error: string };

// Satisfies (TS 4.9+)
const config = { model: 'gemini-3-flash-preview' } satisfies Record<string, string>;

// [NEXT] Async params type
type PageProps = { params: Promise<{ id: string }> };
```

---

## 8. `[NEXT]` Tailwind CSS v3 (this project)

> ⚠️ **v3 only** — Do NOT use v4 syntax.

```js
// tailwind.config.ts — v3 style
import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

> ❌ v4-only (forbidden here): `@theme {}`, `@config`, `--color-*` CSS variables

---

## 🔴 Universal Anti-Pattern Cheatsheet

| ❌ NEVER USE                                                   | ✅ USE INSTEAD                                  | Applies To |
| -------------------------------------------------------------- | ----------------------------------------------- | ---------- |
| `import { GoogleGenerativeAI } from '@google/generative-ai'`  | `import { GoogleGenAI } from '@google/genai'`   | `[AI]`     |
| `model.startChat({ history })`                                 | `ai.chats.create({ model, history })`           | `[AI]`     |
| `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-pro`            | See model table in Section 1                    | `[AI]`     |
| `pages/api/*.ts` for new routes                                | `app/api/**/route.ts`                           | `[NEXT]`   |
| `<Head>` from `next/head` in App Router                        | `export const metadata = {}`                    | `[NEXT]`   |
| `params.id` without await                                      | `const { id } = await params`                   | `[NEXT]`   |
| `process.env.VITE_*`                                           | `import.meta.env.VITE_*`                        | `[VITE]`   |
| `asyncHandler(fn)` wrapper in Express                          | Native async/await (v5 auto-catches)            | `[NODE]`   |
| `ReactDOM.render()`                                            | `createRoot(el).render(<App/>)`                 | `[UNIV]`   |
| `'use client'` inside function body                            | First line of the file                          | `[NEXT]`   |
| Tailwind v4 `@theme {}` directive                              | `tailwind.config.ts` `extend`                   | `[NEXT]`   |
| `useQuery(key, fn, options)` (v4 style)                        | `useQuery({ queryKey, queryFn, ...options })`   | `[UNIV]`   |
| `cacheTime` in QueryClient                                     | `gcTime`                                        | `[UNIV]`   |
| `isLoading` in TanStack Query v5                               | `isPending`                                     | `[UNIV]`   |
| `getServerSession(authOptions)` in NextAuth v5                 | `const session = await auth()`                  | `[NEXT]`   |
| `withAuth()` middleware in NextAuth v5                         | `export { auth as middleware }`                 | `[NEXT]`   |
| `z.string().parse(val)` (throws)                               | `z.string().safeParse(val)` (returns result)    | `[UNIV]`   |
| `supabase.auth.session()` (v1)                                 | `supabase.auth.getSession()`                    | `[DB]`     |
| `stripe.charges.create()` (old)                                | `stripe.paymentIntents.create()`                | `[PAY]`    |
| `page.$('selector')` in Playwright                             | `page.locator()` / `page.getByRole()`           | `[TEST]`   |

---

## 9. `[AUTH]` Auth.js (NextAuth) v5

> ⚠️ v5 is a complete rewrite. The old `next-auth` v4 API is entirely different.

### ✅ Configuration (auth.ts)

```ts
// auth.ts — at project root
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub, Google],
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
});
```

### ✅ Route handler

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
```

### ✅ Reading session in Server Component

```ts
// app/dashboard/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth(); // ← universal auth() call

  if (!session?.user) redirect('/api/auth/signin');

  return <h1>Welcome, {session.user.name}</h1>;
}
```

### ✅ Middleware protection

```ts
// middleware.ts
export { auth as middleware } from '@/auth';

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};
```

> ❌ v4: `getServerSession(authOptions)` — removed in v5
> ❌ v4: `withAuth()` — removed in v5, use middleware export above
> ❌ v4: `useSession()` still works on client but `auth()` is preferred server-side

---

## 10. `[DB]` Supabase JS v2

### ✅ Client initialization

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase'; // generated types

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### ✅ SSR / Server Component client (Next.js)

```ts
// lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
}
```

### ✅ Querying data

```ts
// Select with filter
const { data, error } = await supabase
  .from('posts')
  .select('id, title, content, author:users(email)')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .limit(10);

// Insert
const { data: newRow, error } = await supabase
  .from('posts')
  .insert({ title: 'Hello', content: '...' })
  .select()
  .single();

// Update
const { error } = await supabase
  .from('posts')
  .update({ title: 'Updated' })
  .eq('id', postId);

// Delete
const { error } = await supabase.from('posts').delete().eq('id', postId);
```

### ✅ Auth

```ts
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Get current user (server-side preferred)
const { data: { user } } = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();
```

### ✅ Auth state change listener

```ts
supabase.auth.onAuthStateChange((event, session) => {
  // event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED'
  console.log(event, session?.user);
});
```

> ❌ v1: `supabase.auth.session()` — removed, use `getSession()` or `getUser()`
> ❌ v1: `supabase.auth.user()` — removed, use `getUser()`

---

## 11. `[UNIV]` TanStack Query v5

> ⚠️ v5 has breaking changes from v4. All hook signatures changed.

### ✅ Setup

```ts
// app/providers.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000, // ← v5: was "cacheTime" in v4
      },
    },
  }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

### ✅ useQuery — v5 signature

```ts
import { useQuery } from '@tanstack/react-query';

// ✅ v5: single object argument
const { data, isPending, isError, error } = useQuery({
  queryKey: ['posts', userId],
  queryFn: () => fetchPosts(userId),
  staleTime: 60_000,
});

// ❌ v4 (broken in v5):
// useQuery(['posts'], fetchPosts, { staleTime: 60000 })
```

> ❌ `isLoading` in v5 is true only when no cached data + fetching. Use `isPending` instead for "first load" state.

### ✅ useMutation — v5 signature

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const { mutate, isPending } = useMutation({
  mutationFn: (data: CreatePost) => createPost(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },
});

// Call it:
mutate({ title: 'Hello', content: '...' });
```

### ✅ v4 → v5 Migration Cheatsheet

| v4 | v5 |
| --- | --- |
| `useQuery(key, fn, opts)` | `useQuery({ queryKey, queryFn, ...opts })` |
| `cacheTime` | `gcTime` |
| `isLoading` | `isPending` |
| `useMutation(fn, opts)` | `useMutation({ mutationFn, ...opts })` |
| `useIsFetching(key, filters)` | `useIsFetching({ queryKey, ...filters })` |

---

## 12. `[UNIV]` Zod v3 / v4

> ℹ️ **Zod v4 is out** (`@colinhacks/zod v4.0.1`, Feb 2026). v3 still works; v4 is opt-in.
> **Install v4:** `npm install zod@^4` then `import { z } from 'zod'` as before.
> **Use both:** `import * as z3 from 'zod/v3'; import * as z4 from 'zod/v4'`
> **New in v4:** `z.stringbool()`, expanded `discriminatedUnion()`, 14x faster TS compilation.

### ✅ Schema definition

```ts
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  role: z.enum(['admin', 'user', 'guest']).default('user'),
});

type User = z.infer<typeof UserSchema>; // TypeScript type from schema
```

### ✅ Parsing — use safeParse, not parse

```ts
// ✅ safeParse: never throws, returns { success, data, error }
const result = UserSchema.safeParse(rawInput);
if (!result.success) {
  console.error(result.error.flatten()); // formatted errors
} else {
  const user = result.data; // fully typed
}

// ⚠️ parse: throws ZodError — only use when you want it to throw
const user = UserSchema.parse(rawInput);
```

### ✅ Common schema patterns

```ts
// Arrays
const TagsSchema = z.array(z.string()).min(1).max(10);

// Union / discriminated union
const ResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), data: z.string() }),
  z.object({ status: z.literal('error'), message: z.string() }),
]);

// Transform after validation
const TrimmedString = z.string().transform(s => s.trim());

// Partial / required
const PatchSchema = UserSchema.partial(); // all fields optional
const RequiredSchema = UserSchema.required(); // all fields required
```

### ✅ API request validation

```ts
// In Next.js Route Handler
export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = UserSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }
  // result.data is typed User
}
```

> ❌ Do NOT rely on `.parse()` in API handlers — it throws uncaught exceptions

---

## 13. `[UNIV]` React Hook Form v7

### ✅ Basic form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await loginUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <p>{errors.email.message}</p>}
      <input type="password" {...register('password')} />
      {errors.password && <p>{errors.password.message}</p>}
      <button disabled={isSubmitting}>Login</button>
    </form>
  );
}
```

### ✅ Controlled components (e.g., Radix UI, custom inputs)

```tsx
import { Controller } from 'react-hook-form';

<Controller
  control={control}
  name="role"
  render={({ field }) => (
    <Select value={field.value} onValueChange={field.onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="user">User</SelectItem>
      </SelectContent>
    </Select>
  )}
/>
```

> ❌ Do NOT use `register()` on Radix/headless UI components — use `Controller` instead

### ✅ FormProvider for nested forms

```tsx
import { useForm, FormProvider, useFormContext } from 'react-hook-form';

// Parent: wraps with FormProvider
function ParentForm() {
  const methods = useForm<FormData>();
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <ChildSection />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

// Child: access form context without prop drilling
function ChildSection() {
  const { register, formState: { errors } } = useFormContext<FormData>();
  return <input {...register('email')} />;
}
```

### ✅ Server validation errors via setError

```tsx
const { setError } = useForm();

const onSubmit = async (data: FormData) => {
  const res = await fetch('/api/register', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) {
    const serverErr = await res.json();
    // Map server errors back to fields
    setError('username', { type: 'server', message: serverErr.username });
  }
};
```

## 14. `[UNIV]` Zustand v5

> ⚠️ **v5 TypeScript:** Use **curry syntax** `create<State>()( ... )` — double parentheses. This ensures correct type inference with middleware.

### ✅ Store creation

```ts
// store/useCounterStore.ts
import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  reset: () => void;
}

// ✅ v5: curry syntax — note the ()() double call
export const useCounterStore = create<CounterState>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}));
```

> ❌ `create<State>((set) => ...)` — old v4 single-call; loses type inference with middleware in v5

### ✅ Usage in component

```ts
// Select only what you need (prevents unnecessary re-renders)
const count = useCounterStore((state) => state.count);
const increment = useCounterStore((state) => state.increment);
```

### ✅ With Immer for complex state

```ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useStore = create<State>()(immer((set) => ({
  todos: [],
  addTodo: (text: string) => set((state) => {
    state.todos.push({ id: Date.now(), text, done: false });
  }),
})));
```

### ✅ Persist with partialize

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  setTheme: (t: 'dark' | 'light') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarOpen: true,
      setTheme: (t) => set({ theme: t }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }), // only persist 'theme'
    }
  )
);
```

### ✅ Stack multiple middlewares

```ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Order: devtools wraps persist wraps immer (inner-to-outer)
const useStore = create<State>()(devtools(persist(immer((set) => ({
  count: 0,
  increment: () => set((s) => { s.count += 1; }),
})), { name: 'my-store' })));
```

---

## 15. `[UNIV]` Radix UI Primitives

> Radix provides **unstyled, accessible** components. You always bring your own styles.
> **New unified package (2025):** `import { Dialog, DropdownMenu } from 'radix-ui'` — single package instead of separate `@radix-ui/react-*` packages. Both work.

### ✅ Composition pattern (Radix way)

```tsx
import * as Dialog from '@radix-ui/react-dialog';

function MyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg">
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Description>Description</Dialog.Description>
          <Dialog.Close asChild>
            <button>Close</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### ✅ asChild pattern

```tsx
// asChild: renders the child element instead of the default element
// Useful for using your own button/anchor with Radix behavior
<Dialog.Trigger asChild>
  <MyCustomButton>Open</MyCustomButton>
</Dialog.Trigger>
```

> ❌ Do NOT nest Radix `<Trigger>` inside another interactive element — it breaks accessibility

### Packages in this project

```text
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-scroll-area
@radix-ui/react-separator
@radix-ui/react-slot
@radix-ui/react-tabs
@radix-ui/react-tooltip
```

---

## 16. `[TEST]` Playwright v1.4x

### ✅ Basic test

```ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/login');

  // ✅ Use role-based locators (preferred over CSS selectors)
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});
```

### ✅ Locator priority (use in this order)

```ts
// 1. By role (most accessible, most robust)
page.getByRole('button', { name: 'Submit' })
// 2. By label (for form inputs)
page.getByLabel('Email address')
// 3. By placeholder
page.getByPlaceholder('Search...')
// 4. By text content
page.getByText('Dashboard')
// 5. By test ID (last resort)
page.getByTestId('submit-btn')
// ❌ Avoid CSS selectors: page.$('.btn-primary') — brittle
```

### ✅ Assertions

```ts
await expect(element).toBeVisible();
await expect(element).toHaveText('Hello');
await expect(element).toHaveValue('input value');
await expect(page).toHaveTitle(/My App/);
await expect(page).toHaveURL(/dashboard/);
```

### ✅ playwright.config.ts

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

> ❌ Old: `page.$('selector')` → use `page.locator('selector')` or role-based locators
> ❌ Old: `page.waitForTimeout(1000)` → use `await expect(element).toBeVisible()` instead

---

## 17. `[PAY]` Stripe JS

### ✅ Frontend — load Stripe

```ts
import { loadStripe } from '@stripe/stripe-js';

// ✅ Call outside component to avoid re-init on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);
```

### ✅ Frontend — Stripe Elements

```tsx
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: 'https://example.com/success' },
    });
    if (error) console.error(error.message);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>Pay</button>
    </form>
  );
}

function Checkout({ clientSecret }: { clientSecret: string }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  );
}
```

### ✅ Backend — create PaymentIntent

```ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000, // in cents
  currency: 'usd',
  automatic_payment_methods: { enabled: true },
});

// Return client_secret to frontend
return NextResponse.json({ clientSecret: paymentIntent.client_secret });
```

### ✅ Webhook verification

> ⚠️ **Critical (Express):** Use `express.raw({ type: 'application/json' })` — NOT `express.json()`. Stripe requires the raw body buffer. On Next.js, use `request.text()` (see below).

```ts
// Next.js Route Handler
export async function POST(request: NextRequest) {
  const body = await request.text();  // MUST be raw text, not json()
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      await fulfillOrder(intent);
      break;
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.error('Payment failed:', intent.last_payment_error?.message);
      break;
    }
    case 'customer.subscription.deleted':
      // cancel user subscription...
      break;
  }

  return NextResponse.json({ received: true });
}
```

```ts
// Express.js (raw body middleware required)
app.post('/webhook',
  express.raw({ type: 'application/json' }), // ← NOT express.json()
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    // handle event...
    res.json({ received: true });
  }
);
```

> ❌ Old: `stripe.charges.create()` — use `stripe.paymentIntents.create()` instead
> ❌ Do NOT verify webhooks without `stripe.webhooks.constructEvent()` — security risk

---

## 🔗 Context7 Source Verification

| Library | Context7 ID | Verified |
| --- | --- | --- |
| Next.js 15 | `/vercel/next.js/v15.1.8` | 2026-02-20 |
| @google/genai v1 | `/googleapis/js-genai` | 2026-02-20 |
| React 19 | `/websites/react_dev` | 2026-02-20 |
| Vite | `/vitejs/vite` | 2026-02-20 |
| Express v5 | `/expressjs/express` | 2026-02-20 |
| Framer Motion | `/framer/motion` | 2026-02-20 |
| TanStack Query v5 | `/tanstack/query/v5.60.5` | 2026-02-20 |
| Auth.js (NextAuth) v5 | `/nextauthjs/next-auth` | 2026-02-20 |
| Supabase JS v2 | `/supabase/supabase-js/v2.58.0` | 2026-02-20 |
| Zod v3 / v4 | `/colinhacks/zod/v4.0.1` | 2026-02-20 ✅ |
| Zustand v5 | `/pmndrs/zustand/v5.0.8` | 2026-02-20 ✅ |
| Playwright v1.51 | `/microsoft/playwright/v1.51.0` | 2026-02-20 ✅ |
| React Hook Form v7 | `/react-hook-form/react-hook-form/v7.66.0` | 2026-02-20 ✅ |
| Radix Primitives | `/websites/radix-ui_primitives` | 2026-02-20 ✅ |
| Stripe JS | `/stripe/stripe-node/v19.1.0` | 2026-02-20 ✅ |
| Prisma v6 | `/websites/prisma_io` | 2026-02-20 ✅ |
| Better Auth v1.3 | `/better-auth/better-auth` | 2026-02-20 ✅ |
| React Compiler | `/facebook/react` v19.2.0 | 2026-02-20 ✅ |
| Zero (Local-First) | `/llmstxt/zero_rocicorp_dev_llms_txt` | 2026-02-20 ✅ |

> **To update:** Ask AI: *"Cross-check TECH-REF.md against Context7 for [library]. Update any deprecated patterns."*

---

## 18. `[DB]` Prisma ORM v6

> **Install:** `npm install prisma @prisma/client`
> **Init:** `npx prisma init` → creates `prisma/schema.prisma`

### ✅ Prisma schema definition

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // or "mysql" | "sqlite" | "mongodb"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]   // one-to-many relation
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
}
```

### ✅ Prisma Client singleton (Node.js / Next.js)

```ts
// lib/prisma.ts  ← create once, import everywhere
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// ✅ Prevent multiple instances in Next.js hot reload
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

> ❌ Do NOT `new PrismaClient()` in every file — connection pool exhaustion

### ✅ CRUD operations

```ts
import { prisma } from '@/lib/prisma';

// --- CREATE ---
const user = await prisma.user.create({
  data: { email: 'alice@example.com', name: 'Alice' },
});

// createMany (no return by default in some DBs)
await prisma.user.createMany({
  data: [{ email: 'bob@ex.com' }, { email: 'carol@ex.com' }],
  skipDuplicates: true,
});

// --- READ ---
const user = await prisma.user.findUnique({ where: { id: '123' } });
const user = await prisma.user.findFirst({ where: { email: { contains: '@ex.com' } } });

const users = await prisma.user.findMany({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 20,  // pagination
});

// --- UPDATE ---
const updated = await prisma.user.update({
  where: { id: '123' },
  data: { name: 'Alice Updated' },
});

// upsert (create or update)
const upserted = await prisma.user.upsert({
  where: { email: 'alice@example.com' },
  update: { name: 'Alice' },
  create: { email: 'alice@example.com', name: 'Alice' },
});

// --- DELETE ---
await prisma.user.delete({ where: { id: '123' } });
await prisma.user.deleteMany({ where: { createdAt: { lt: new Date('2024-01-01') } } });
```

### ✅ Relations — include & select

```ts
// include: eager-load related records
const userWithPosts = await prisma.user.findUnique({
  where: { id: '123' },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    },
  },
});
// Type: User & { posts: Post[] }

// select: choose specific fields (smaller payload)
const emails = await prisma.user.findMany({
  select: { id: true, email: true },
  // posts NOT included — leaner query
});
```

> ❌ Do NOT chain `.include` and `.select` on the same query — Prisma forbids it

### ✅ Transactions

```ts
// Sequential (interactive transaction)
const [post, notification] = await prisma.$transaction([
  prisma.post.create({ data: { title: 'Hello', authorId: '123' } }),
  prisma.notification.create({ data: { userId: '123', type: 'POST_CREATED' } }),
]);

// With rollback on error
await prisma.$transaction(async (tx) => {
  const user = await tx.user.update({
    where: { id: '123' },
    data: { credits: { decrement: 10 } },
  });
  if (user.credits < 0) throw new Error('Insufficient credits'); // auto rollback
  await tx.purchase.create({ data: { userId: user.id, amount: 10 } });
});
```

### ✅ Migrations

```bash
# Generate migration from schema changes
npx prisma migrate dev --name add_user_role

# Deploy to production (no .env prompt)
npx prisma migrate deploy

# Reset DB (dev only — drops all data)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio

# Re-generate client after schema change
npx prisma generate
```

> ❌ Do NOT run `migrate dev` in production — use `migrate deploy`

---

## 19. `[UNIV]` TypeScript Utility Types

> These are built-in TypeScript generics. No import needed.

### ✅ Essential utility types

```ts
interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// Partial — all fields optional
type UserUpdate = Partial<User>;

// Required — all fields mandatory
type StrictUser = Required<User>;

// Readonly — immutable
type FrozenUser = Readonly<User>;

// Pick — subset of fields
type PublicUser = Pick<User, 'id' | 'email' | 'name'>;

// Omit — remove fields
type CreateUserDTO = Omit<User, 'id' | 'createdAt'>;
type SafeUser = Omit<User, 'password'>; // never expose password

// Record — key-value map
type UserMap = Record<string, User>;
type RoleConfig = Record<User['role'], { canDelete: boolean }>;

// Exclude — from union
type NonAdmin = Exclude<User['role'], 'admin'>; // 'user'

// Extract — from union
type AdminRole = Extract<User['role'], 'admin'>; // 'admin'

// NonNullable — remove null | undefined
type SureString = NonNullable<string | null | undefined>; // string

// ReturnType — extract function return type
async function getUser() { return {} as User; }
type UserResult = Awaited<ReturnType<typeof getUser>>; // User

// Parameters — extract function param types
function createUser(name: string, role: User['role']) {}
type CreateUserParams = Parameters<typeof createUser>; // [string, User['role']]
```

### ✅ Common patterns

```ts
// Discriminated union (type-safe API responses)
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: number };

function handleResponse<T>(res: ApiResponse<T>) {
  if (res.success) {
    console.log(res.data); // ✅ T available
  } else {
    console.log(res.error, res.code); // ✅ error + code available
  }
}

// Generic constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Template literal types
type EventName = `on${Capitalize<string>}`;
type Route = `/api/${string}`;

// Conditional types
type IsArray<T> = T extends unknown[] ? true : false;
type StringOrNumber<T> = T extends string ? string : number;

// Infer
type UnpackPromise<T> = T extends Promise<infer U> ? U : T;
type Unpacked = UnpackPromise<Promise<string>>; // string
```

---

## 20. `[NEXT]` `[VITE]` Tailwind CSS v3/v4 Patterns

> **Project uses** Tailwind v3 (`tailwindcss: ^3.4.1`).
> v4 notes included for future migration awareness.

### ✅ Tailwind v3 config (current)

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

### ✅ Dark mode pattern

```tsx
// _app.tsx / layout.tsx — toggle dark class on <html>
import { useState, useEffect } from 'react';
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return <>{children}</>;
}

// In components: dark: prefix
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
```

### ✅ Tailwind v4 migration notes (CSS-first config)

```css
/* v4: NO tailwind.config.ts needed — configure in CSS */
@import "tailwindcss";

@theme {
  --color-brand-500: #3b82f6;
  --font-sans: 'Inter', sans-serif;
  --radius-card: 0.75rem;
}
```

```tsx
{/* v4: same utility classes, but config lives in CSS */}
<div className="bg-brand-500 font-sans rounded-card" />
```

> ❌ v3: `@apply` in global CSS is fine
> ⚠️ v4: `@apply` still works but discouraged — use CSS variables instead
> ⚠️ v4: `darkMode: 'class'` in config replaced by CSS media variant

---

## 21. `[AUTH]` Better Auth v1.3

> **Install:** `npm install better-auth`
> Framework-agnostic, plugin-based, replaces Auth.js (NextAuth) and Lucia.
> Context7 ID: `/better-auth/better-auth` v1.3.x (High, 2,752 snippets)

### ✅ Server setup (Next.js App Router)

```ts
// lib/auth.ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization, twoFactor, passkey } from 'better-auth/plugins';
import { prisma } from '@/lib/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  emailAndPassword: { enabled: true },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  plugins: [
    // ✓ Multi-tenant org support
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      membershipLimit: 100,
      creatorRole: 'owner',
      invitationExpiresIn: 60 * 60 * 48, // 48h
    }),

    // ✓ 2FA (TOTP)
    twoFactor({
      issuer: 'MyApp',
    }),

    // ✓ Passkeys (WebAuthn)
    passkey(),
  ],
});

export type Session = typeof auth.$Infer.Session;
```

> ❌ Do NOT use `next-auth` for new projects — Auth.js is in maintenance mode
> ❌ Do NOT mix Better Auth with Lucia — pick one

### ✅ Route handler (App Router)

```ts
// app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

### ✅ Client setup

```ts
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/client';
import { organizationClient, twoFactorClient, passkeyClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    organizationClient(),
    twoFactorClient(),
    passkeyClient(),
  ],
});

export const { signIn, signOut, signUp, useSession } = authClient;
```

### ✅ Usage in components

```tsx
import { authClient } from '@/lib/auth-client';

// Session hook (reactive)
const { data: session, isPending } = authClient.useSession();

// Sign in with email
await authClient.signIn.email({ email, password, callbackURL: '/dashboard' });

// Sign in with social
await authClient.signIn.social({ provider: 'github', callbackURL: '/dashboard' });

// Sign out
await authClient.signOut();

// Organization
await authClient.organization.create({ name: 'Acme Corp', slug: 'acme' });
await authClient.organization.inviteMember({ email, role: 'member', organizationId });
```

### ✅ Protect server routes

```ts
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return Response.json({ user: session.user });
}
```

### ✅ Better Auth vs Auth.js quick comparison

| Feature | Better Auth v1.3 | Auth.js v5 |
| --- | --- | --- |
| Multi-tenant orgs | ✅ Built-in plugin | ❌ Manual |
| 2FA / TOTP | ✅ Built-in plugin | ❌ Manual / adapter |
| Passkeys (WebAuthn) | ✅ Built-in plugin | ❌ Manual |
| DB adapter | Prisma, Drizzle, Mongo, etc. | Same |
| Framework support | Any (Next.js, Hono, Express) | Next.js-first |
| Maintenance status | **Active** | Maintenance mode |
| MCP server | ✅ (`npx @better-auth/cli`) | ❌ |

---

## 22. `[NODE]` Deployment — Self-Hosting

> Stop paying Vercel for CPU-heavy workloads. Two proven self-hosting approaches.

### ✅ Coolify (GUI PaaS on your VPS)

```bash
# Install on fresh Ubuntu VPS (1-liner)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Then at `http://your-vps-ip:8000`:

- Connect GitHub repo → deploy as Docker container
- 280+ one-click templates (Next.js, Postgres, Redis, etc.)
- Automatic SSL (Let's Encrypt)
- Docker Swarm for multi-server scaling

```yaml
# coolify.yaml (optional override)
services:
  web:
    build: .
    port: 3000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
```

### ✅ Kamal (CLI deploy, zero-overhead)

```bash
gem install kamal  # Ruby gem
kamal init         # generates config/deploy.yml
```

```yaml
# config/deploy.yml
service: myapp
image: myuser/myapp

servers:
  web:
    - 192.168.0.1

registry:
  username: <%= ENV['REGISTRY_USERNAME'] %>
  password:
    - REGISTRY_PASSWORD

env:
  clear:
    NODE_ENV: production
  secret:
    - DATABASE_URL
    - NEXTAUTH_SECRET

proxy:
  ssl: true
  host: myapp.example.com
```

```bash
kamal setup    # First deploy (installs Docker, configures server)
kamal deploy   # Subsequent deploys (zero-downtime rolling update)
kamal rollback # Instant rollback to previous version
kamal logs     # Tail production logs
```

> ✅ Kamal: zero runtime overhead, SSH-based, no dashboard complexity
> ✅ Coolify: best for teams who want a GUI and 1-click databases
> ❌ Do NOT use Kamal without proper healthcheck — rollback won't trigger

### ✅ Docker Compose (simple option)

```yaml
# docker-compose.prod.yml
services:
  app:
    build: .
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    ports:
      - '3000:3000'
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER"]
      interval: 10s
      retries: 5

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - certs:/etc/letsencrypt

volumes:
  pgdata:
  certs:
```

---

## 23. `[DB]` Zero — Local-First Sync Engine

> **Status:** Pre-v1 / alpha — not production-ready yet. Follow and evaluate.
> **Install:** `npm install @rocicorp/zero`
> Context7 ID: `/llmstxt/zero_rocicorp_dev_llms_txt` (High, 443 snippets)
> Core idea: Postgres replicates into SQLite on the client. Reads are **instant** (local), writes are **optimistic** and sync in background. No `useEffect` + fetch patterns.

### ✅ Zero schema definition

```ts
// zero/schema.ts
import { table, string, boolean, createSchema } from '@rocicorp/zero';

const user = table('user')
  .columns({
    id:      string(),
    name:    string(),
    partner: boolean(),
  })
  .primaryKey('id');

const message = table('message')
  .columns({
    id:       string(),
    senderId: string(),
    body:     string(),
  })
  .primaryKey('id');

export const schema = createSchema({ tables: [user, message] });
```

### ✅ Provider + useQuery

```tsx
import { ZeroProvider, useQuery } from '@rocicorp/zero/react';
import { schema } from './zero/schema';

// Root — wrap app
export default function Root() {
  return (
    <ZeroProvider
      cacheURL={process.env.NEXT_PUBLIC_ZERO_CACHE_URL!}
      schema={schema}
      context={{ userID: session.userId }}
    >
      <App />
    </ZeroProvider>
  );
}

// Component — instant local reads
function Messages() {
  const [messages] = useQuery(
    z => z.message.orderBy('createdAt', 'desc').limit(50)
  );
  return messages.map(m => <div key={m.id}>{m.body}</div>);
}
```

> ❌ Do NOT use Zero in production apps today — API surface changes frequently
> ✅ Great for learning local-first patterns — watch for v1 release
