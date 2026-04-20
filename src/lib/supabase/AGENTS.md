# AGENTS.md — `src/lib/supabase/`

Three Supabase SSR clients + shared types. Uses `@supabase/ssr` 0.5 (cookie-based session), **not** the legacy `@supabase/auth-helpers-nextjs`.

## Files

| File | Use from | Purpose |
|---|---|---|
| `client.ts` | `"use client"` components | `createBrowserClient` — cookie-reads browser session |
| `server.ts` | RSC / Server Actions / Route Handlers | `createServerClient` with `next/headers` cookies; `setAll` try/catch because RSC can't write cookies (middleware handles that) |
| `middleware.ts` | `src/middleware.ts` only | `updateSession()` — refreshes session, syncs cookies onto response, redirects unauthenticated users to `/login?next=...` |
| `types.ts` | everywhere | Generated/handwritten DB types |

## Non-obvious behaviors

1. **Missing env vars are non-fatal.** All three fall back to `http://localhost:54321` + `public-anon-placeholder` and log a `console.warn` (browser) or silently degrade (server). `middleware.ts` additionally *skips the auth redirect* when env is unset (`supabaseConfigured` check) — so dev without Supabase still renders pages. Preserve this.
2. **Public path allow-list** lives in `middleware.ts` (`isPublic`): `/login`, `/_next`, `/api/auth`, `/manifest`, `/icons`, `/favicon.ico`, `/robots.txt`, `/sw.js`. Add to this list if you introduce new public assets/routes — otherwise authenticated users hit the redirect loop.
3. **`server.ts` `setAll` swallows errors silently.** That's intentional (Server Components can't mutate cookies). Don't "fix" it by rethrowing — middleware is the write path.
4. **Middleware calls `supabase.auth.getUser()`, not `getSession()`.** Required per Supabase SSR docs to trigger token refresh server-side. Keep it that way.

## Patterns

```ts
// RSC
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient(); // note: await

// Client Component
"use client";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
```

## Anti-patterns

- Importing `client.ts` in a Server Component (will hydrate-leak, no session).
- Importing `server.ts` in a Client Component (will blow up on `next/headers`).
- Instantiating at module top-level — always call inside the component/handler so per-request cookies bind correctly.
- Calling `getSession()` in middleware instead of `getUser()`.
- Extending the public allow-list without matching `vercel.json` CSP.
