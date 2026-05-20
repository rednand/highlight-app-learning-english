<!--
  SYNC IMPACT REPORT
  Version change: (none) → 1.0.0
  Added sections: Core Principles (I–IV), Stack Constraints, Quality Gates, Governance
  Removed sections: N/A (initial ratification)
  Modified principles: N/A (initial ratification)
  Templates updated:
    ✅ .specify/memory/constitution.md — this file
    ✅ .specify/templates/plan-template.md — Constitution Check section aligned
    ✅ .specify/templates/spec-template.md — no structural change needed (spec is tech-agnostic)
    ✅ .specify/templates/tasks-template.md — no structural change needed (quality gates are in Polish phase)
  Deferred items: RATIFICATION_DATE set to 2026-05-20 (today, first ratification).
-->

# Highlight Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

Every file committed to the repository MUST meet these standards:

- TypeScript: `any` is forbidden. Use precise types or `unknown` with a type guard.
- No `console.log` in committed code. Debug output MUST be removed before merge.
- Server Components are the default. `'use client'` is added only when browser APIs
  or event handlers are genuinely required — not as a convenience.
- All mutations MUST go through Server Actions in `app/actions/` (grouped by domain).
  Client Components MUST NOT access Supabase directly.
- No inline styles. All visual styling MUST use Tailwind utility classes.
- The `app/utils/supabase/admin.ts` client is exclusively for server-side
  service-role operations. It MUST NOT be exposed to the browser or imported
  from Client Components.
- RLS policies MUST NOT be bypassed. Every query MUST operate within the
  authenticated user's row-level security context.

### II. Testing Standards (NON-NEGOTIABLE)

Every feature that introduces or modifies business logic MUST include automated tests:

- The Vitest test suite MUST pass (`npm run test:coverage`) before any PR is merged.
- Coverage thresholds (lines, functions, branches, statements) MUST all be ≥ 80%.
- Tests MUST NOT require a live database or network connection.
  All external dependencies (Supabase, Next.js cache, navigation) MUST be
  replaced with test doubles via `vi.mock`.
- Business logic that is difficult to test inline MUST be extracted into pure
  functions in `app/lib/` before testing. Pure functions SHOULD be tested
  without any mocking.
- The CI pipeline (`.github/workflows/ci.yml`) MUST run lint and the full
  test suite on every pull request targeting `main`. A failing CI check
  MUST block merge.

### III. User Experience Consistency

Every user-facing surface MUST follow these standards to maintain a coherent experience
for Brazilian adults learning English:

- Tailwind v4 CSS-first configuration via `@theme` MUST be used. A
  `tailwind.config.js` MUST NOT be created.
- Interactive flashcard controls MUST support keyboard shortcuts
  (`Space` to flip, `1/2/3` to grade) in addition to pointer input.
- The app MUST remain functional as a PWA on mobile viewports. New UI MUST be
  tested at mobile breakpoints before shipping.
- All user-visible text in the app is in Brazilian Portuguese (pt-BR).
  English appears only as the vocabulary being learned.
- Error states MUST surface a user-friendly message. Silent failures that leave
  the UI in an ambiguous state are not permitted.

### IV. Performance Requirements

The app MUST meet these thresholds to ensure a fluid learning experience:

- TMDB API responses MUST be cached for at least 1 hour (`revalidate: 3600`)
  to avoid redundant external calls.
- Tatoeba API responses MUST be cached for at least 24 hours (`revalidate: 86400`).
- The SM-2 scheduling algorithm (`app/lib/review-utils.ts`) MUST execute
  synchronously and in under 1 ms per card — no async operations permitted
  inside the core `sm2()` function.
- The daily push-notification cron (`/api/cron/push-review`) MUST complete
  without exceeding the Vercel function timeout (10 s default). Batch size
  MUST be adjusted if user count grows.
- `npm run build` MUST succeed without errors or warnings as a mandatory
  pre-merge gate.

## Stack Constraints

These technology choices are fixed for this project and MUST NOT be changed
without a constitution amendment:

| Layer | Constraint |
|---|---|
| Framework | Next.js 16 App Router only. The `pages/` directory MUST NOT be created. |
| UI | React 19 + Tailwind v4. No other UI framework. |
| Data | Supabase (PostgreSQL + Auth). Direct DB access only from Server Components and Server Actions. |
| Auth | Google OAuth via Supabase. No other auth provider. |
| Hosting | Vercel with Vercel Cron for scheduled jobs. |
| Push | Web Push API + VAPID keys. No third-party push service. |

## Quality Gates

Every pull request MUST clear all gates before merge:

1. `npm run lint` — zero ESLint errors
2. `npm run test:coverage` — all tests pass, coverage ≥ 80% on all four metrics
3. `npm run build` — production build succeeds

## Governance

This constitution supersedes all other development guidelines for the Highlight
project. When a conflict exists between this document and any other guidance
file (CLAUDE.md, AGENTS.md, rule files), this constitution takes precedence.

Amendments require:
1. A written rationale explaining why the principle needs to change.
2. An updated `LAST_AMENDED_DATE` and incremented `CONSTITUTION_VERSION`.
3. A propagation pass over all dependent templates and runtime docs.

All PRs and code reviews MUST verify compliance with the four core principles.
Violations that are intentional (e.g., temporarily skipping a coverage gate
during a hotfix) MUST be documented in the PR description and resolved within
one follow-up PR.

Runtime development guidance lives in `CLAUDE.md` and `.claude/rules/`.

**Version**: 1.0.0 | **Ratified**: 2026-05-20 | **Last Amended**: 2026-05-20
