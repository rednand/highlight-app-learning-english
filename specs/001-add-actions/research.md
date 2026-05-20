# Research: Automated Test Coverage for Server Actions

**Date**: 2026-05-20 | **Branch**: `001-add-actions`

All unknowns resolved directly from the existing codebase. No external research was required.

## Decision Log

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|-------------------------|
| Test runner | Vitest 2.x | Already in package.json; Vite-native, fast HMR, first-class vi.mock | Jest (heavier, ESM transform complexity with Next.js 16) |
| DOM environment | jsdom 25 | Required for Testing Library component tests | happy-dom (less complete API) |
| Coverage provider | v8 | Built into Node.js, no extra instrumentation, native Vitest support | Istanbul (additional package, slower) |
| Mocking strategy | vi.mock at module scope | Supabase client is a factory — must intercept before module evaluation | Manual dependency injection (would require refactoring action signatures) |
| Coverage threshold | 80% (lines, functions, branches, statements) | Conservative enough to be achievable on first pass; high enough to catch regressions | 100% (too brittle for integration-heavy actions) |
| CI runner | ubuntu-latest, Node 20 | Matches Vercel production environment | Windows/macOS runners (unnecessary cost) |
| Pure utility extraction | `app/lib/` | Co-located with `app/actions/`; already the project's pattern for shared logic | Inline in actions (untestable without mocking), separate package (overkill) |

## Resolved: Supabase Mock Architecture

Supabase queries are builder-chained: `.from(table).select(cols).eq(col, val).single()`. Tests must replicate this chain as a mock object where each method returns `this` and the terminal method resolves a `{ data, error }` promise.

Pattern (established and working):

```typescript
vi.mock("../app/utils/supabase/server", () => ({ createClient: vi.fn() }))

function makeBuilder(opts = {}) {
  const b = { select: vi.fn(), eq: vi.fn(), single: vi.fn().mockResolvedValue(opts), ... }
  b.select.mockReturnValue(b); b.eq.mockReturnValue(b)
  return b
}
```

## Resolved: Next.js Server Action Constraints

Server actions use `'use server'` directive and call `next/cache` (`revalidatePath`) and `next/navigation` (`redirect`). Both modules must be mocked:

```typescript
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation(() => { throw new Error("NEXT_REDIRECT") }),
}))
```

`redirect` throws in Next.js internals; the mock must replicate this to avoid test hangs.
