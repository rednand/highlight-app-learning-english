# Implementation Plan: Automated Test Coverage for Server Actions

**Branch**: `001-add-actions` | **Date**: 2026-05-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-add-actions/spec.md`

## Summary

Extract pure business-logic functions from server actions into isolated utility modules (`app/lib/`), then cover them — and all server action domains — with a Vitest test suite enforced by a GitHub Actions CI pipeline. Coverage threshold is 80% lines/functions/branches/statements. No new database tables or routes are introduced.

## Technical Context

**Language/Version**: TypeScript 5.x

**Primary Dependencies**: Next.js 16 (App Router), React 19, Vitest 2.x, Testing Library (React + jest-dom), @vitejs/plugin-react, @vitest/coverage-v8

**Storage**: Supabase (PostgreSQL) — all DB access mocked in tests via `vi.mock`

**Testing**: Vitest 2.x, jsdom environment, v8 coverage provider

**Target Platform**: Node 20 (CI), browser (app runtime)

**Project Type**: Web application (PWA)

**Performance Goals**: Full test suite completes in under 3 minutes on CI

**Constraints**: Tests must not require a live database or network connection; coverage ≥ 80% on all four metrics

**Scale/Scope**: ~10 test files covering 6 action domains + 2 pure utility modules + 2 UI components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: No project constitution has been established (`.specify/memory/constitution.md` is a blank template). No gates to evaluate. Proceeding without constitution constraints.

## Project Structure

### Documentation (this feature)

```text
specs/001-add-actions/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (utility contracts)
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
app/lib/
├── review-utils.ts      # Pure SM-2 algorithm, formatNextReview, urgencyLabel, LessonStat
└── streak-utils.ts      # Pure streak logic: computeStreak, computeNewDays, todayAndYesterday

app/actions/             # Server Actions (consume app/lib utilities)
├── review.ts            # fetchFlashcards, updateFlashcard, getStreak, updateStreak
├── lessons.ts           # signOut, createLesson, updateLesson, deleteLesson
├── items.ts             # addLessonItem, updateLessonItem, deleteLessonItem
├── grammar.ts           # grammar progress actions
├── roadmap.ts           # roadmap progress actions
└── examples.ts          # example sentence actions

__tests__/               # All test files (Vitest)
├── review-utils.test.ts
├── streak-utils.test.ts
├── review-actions.test.ts
├── lessons-actions.test.ts
├── items-actions.test.ts
├── grammar-actions.test.ts
├── roadmap-actions.test.ts
├── examples-actions.test.ts
├── mobile-nav.test.tsx
└── quiz-client.test.tsx

vitest.config.ts         # Vitest config: jsdom, v8 coverage, 80% thresholds
vitest.setup.ts          # @testing-library/jest-dom setup
.github/workflows/ci.yml # CI: lint → test:coverage → build
```

**Structure Decision**: Single project with `__tests__/` at root, mirroring `app/actions/` domain grouping. Pure utilities in `app/lib/` alongside the actions they support.

## Phase 0: Research

*All unknowns resolved from the existing codebase — no external research required.*

### Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Test runner | Vitest 2.x | Already integrated; compatible with Next.js via `vi.mock` for `next/cache`, `next/navigation`, Supabase client |
| Test environment | jsdom | Required for React component tests; pure action tests run without DOM |
| Mocking strategy | `vi.mock` at module level | Intercepts `createClient` before any test; each test configures mock chains |
| Coverage provider | v8 (built-in Node.js) | No instrumentation overhead; native Vitest support |
| Coverage scope | `app/lib/**`, `app/actions/**`, specific UI components | Excludes push and tmdb actions (external service wrappers) |
| CI triggers | PR to `main` + push to `main` | Ensures main is always green; PRs blocked on failure |

### Supabase Mock Pattern

```typescript
vi.mock("../app/utils/supabase/server", () => ({ createClient: vi.fn() }))
// Each test: mockCreateClient.mockResolvedValue(makeSupabase(user, builderOverrides))
```

Builder factories replicate the Supabase query chain (`.from().select().eq().single()`), returning configurable `{ data, error }`.

### Pure Utility Extraction Pattern

Business logic previously inline in actions is extracted to `app/lib/`:

- `sm2(card, grade)` → `app/lib/review-utils.ts` (pure, no dependencies)
- `computeStreak(data, today, yesterday)` → `app/lib/streak-utils.ts` (pure, no dependencies)

Allows testing all branches without any mocking.

## Phase 1: Design & Contracts

### Data Model

No new database tables. TypeScript type contracts exported from `app/lib/` serve as the interface boundary. See [data-model.md](./data-model.md).

### CI Contract

`.github/workflows/ci.yml` — two jobs:

1. **lint-and-test**: `npm run lint` + `npm run test:coverage` (80% threshold gate)
2. **build**: `npm run build` (runs only after lint-and-test passes)

### Implementation Status

| Deliverable | Status |
|-------------|--------|
| `app/lib/review-utils.ts` | Done |
| `app/lib/streak-utils.ts` | Done |
| `app/actions/review.ts` (refactored) | Done |
| `app/(app)/review/review-client.tsx` (refactored) | Done |
| `vitest.config.ts` | Done |
| `vitest.setup.ts` | Done |
| `.github/workflows/ci.yml` | Done |
| `__tests__/review-utils.test.ts` | Done |
| `__tests__/streak-utils.test.ts` | Done |
| `__tests__/review-actions.test.ts` | Done |
| `__tests__/lessons-actions.test.ts` | Done |
| `__tests__/items-actions.test.ts` | Done |
| `__tests__/grammar-actions.test.ts` | To verify |
| `__tests__/roadmap-actions.test.ts` | To verify |
| `__tests__/examples-actions.test.ts` | To verify |
| `__tests__/mobile-nav.test.tsx` | To verify |
| `__tests__/quiz-client.test.tsx` | To verify |
| `npm run test:coverage` ≥ 80% | To verify |
| `npm run lint` passes | To verify |
