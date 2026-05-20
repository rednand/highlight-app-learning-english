---
description: "Task list for Automated Test Coverage for Server Actions"
---

# Tasks: Automated Test Coverage for Server Actions

**Input**: Design documents from `specs/001-add-actions/`

**Branch**: `001-add-actions` | **Date**: 2026-05-20

**Organization**: Tasks grouped by user story — each story is independently completable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install test runner, configure coverage, add npm scripts.

- [x] T001 Install vitest, @vitest/coverage-v8, @testing-library/react, @testing-library/jest-dom, @vitejs/plugin-react, jsdom in package.json devDependencies
- [x] T002 Create `vitest.config.ts` at repo root — jsdom environment, v8 coverage, 80% thresholds, include `app/lib/**` and `app/actions/**`
- [x] T003 Create `vitest.setup.ts` at repo root — import `@testing-library/jest-dom`
- [x] T004 Add `test`, `test:run`, `test:coverage` scripts to `package.json`

**Checkpoint**: `npm run test:run` should execute (even with zero test files) without errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extract pure utility functions from server actions and client components so they can be unit-tested in isolation.

**⚠️ CRITICAL**: US1 tests depend on these modules existing. Must complete before Phase 3.

- [x] T005 Create `app/lib/review-utils.ts` — export `Grade` type, `FlashcardSM2` interface, `LessonStat` interface, `sm2()`, `formatNextReview()`, `urgencyLabel()`
- [x] T006 Create `app/lib/streak-utils.ts` — export `StreakRecord` interface, `computeStreak()`, `computeNewDays()`, `todayAndYesterday()`
- [x] T007 Update `app/actions/review.ts` — import `computeStreak`, `computeNewDays`, `todayAndYesterday` from `../lib/streak-utils` (remove inline logic)
- [x] T008 Update `app/(app)/review/review-client.tsx` — import `sm2`, `formatNextReview`, `urgencyLabel`, `Grade`, `LessonStat` from `../../lib/review-utils` (remove inline implementations)

**Checkpoint**: `npm run build` must still pass after extraction. No runtime behavior changes.

---

## Phase 3: User Story 1 — Validate Business Logic Safely (Priority: P1) 🎯 MVP

**Goal**: Cover all SM-2 scheduling and streak calculation branches with passing pure-function tests.

**Independent Test**: Run `npm run test:run -- review-utils streak-utils`. All tests pass, no mocking required.

- [x] T009 [P] [US1] Create `__tests__/review-utils.test.ts` — test `sm2()` for grades 1, 3, 5 with interval=1 and interval>1; test `formatNextReview()` for null, past, 1-day, multi-day; test `urgencyLabel()` for dueCount>0, near review, far review
- [x] T010 [P] [US1] Create `__tests__/streak-utils.test.ts` — test `computeStreak()` for null record, today, yesterday, older date; test `computeNewDays()` for today (null), yesterday (+1), no record (1), broken streak (1)

**Checkpoint**: `npm run test:run -- --reporter=verbose` shows US1 tests passing with zero mocks.

---

## Phase 4: User Story 2 — Verify Server Action Contracts (Priority: P2)

**Goal**: Cover all server action domains with mocked-DB unit tests verifying auth gate, error path, and happy path.

**Independent Test**: Run `npm run test:run -- review-actions lessons-actions items-actions grammar-actions roadmap-actions examples-actions mobile-nav quiz-client`. All tests pass.

### Review domain

- [x] T011 [P] [US2] Create `__tests__/review-actions.test.ts` — test `getStreak`, `updateStreak`, `fetchFlashcards`, `updateFlashcard`; mock `app/utils/supabase/server`; cover unauthenticated path, happy path, DB error path

### Lessons, Items domains

- [x] T012 [P] [US2] Create `__tests__/lessons-actions.test.ts` — test `createLesson`, `updateLesson`, `deleteLesson`, `signOut`; mock supabase + `next/cache` + `next/navigation`; cover unauthenticated, happy, and error paths
- [x] T013 [P] [US2] Create `__tests__/items-actions.test.ts` — test `addLessonItem`, `updateLessonItem`, `deleteLessonItem`; mock supabase + `next/cache`; cover unauthenticated, happy, and error paths

### Grammar, Roadmap, Examples domains

- [x] T014 [P] [US2] Create `__tests__/grammar-actions.test.ts` — test grammar progress actions in `app/actions/grammar.ts`; mock supabase + `next/cache`; cover unauthenticated and happy paths
- [x] T015 [P] [US2] Create `__tests__/roadmap-actions.test.ts` — test roadmap progress actions in `app/actions/roadmap.ts`; mock supabase + `next/cache`; cover unauthenticated and happy paths
- [x] T016 [P] [US2] Create `__tests__/examples-actions.test.ts` — test example sentence actions in `app/actions/examples.ts`; mock supabase + `next/cache`; cover unauthenticated and happy paths

### UI component smoke tests

- [x] T017 [P] [US2] Create `__tests__/mobile-nav.test.tsx` — render `app/(app)/mobile-nav.tsx` with Testing Library; assert nav links render without crashing
- [x] T018 [P] [US2] Create `__tests__/quiz-client.test.tsx` — render `app/(app)/grammar/quiz/[slug]/quiz-client.tsx` with Testing Library and minimal props; assert quiz UI renders without crashing

**Checkpoint**: `npm run test:run` — all 10 test files pass. No live DB or network calls.

---

## Phase 5: User Story 3 — CI Pipeline Blocks Failing Commits (Priority: P3)

**Goal**: GitHub Actions pipeline runs lint + tests on every PR to `main` and blocks merge on failure.

**Independent Test**: Open a test PR with a deliberately failing test. CI check reports failure. Merge is blocked.

- [x] T019 Create `.github/workflows/ci.yml` — define `lint-and-test` job (Node 20, `npm ci`, `npm run lint`, `npm run test:coverage`) and `build` job (depends on lint-and-test; injects placeholder env vars for Supabase and VAPID secrets)
- [x] T020 [P] [US3] Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as GitHub Actions secrets in repo settings (manual step — document in PR description)

**Checkpoint**: Push branch to GitHub. CI workflow appears in Actions tab and runs successfully.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify end-to-end coverage gate, fix lint, clean up any stale references.

- [x] T021 Run `npm run test:coverage` locally — confirm all four metrics (lines, functions, branches, statements) are ≥ 80%; fix any under-covered paths
- [x] T022 Run `npm run lint` locally — fix all ESLint errors (no `any`, no `console.log`, no unused imports)
- [x] T023 [P] Update `CLAUDE.md` — change "No test suite exists" to document `npm run test:coverage` command and 80% threshold requirement
- [x] T024 [P] Update `CLAUDE.md` Key Systems table — add `app/lib/review-utils.ts` as the canonical location of the SM-2 algorithm

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001–T004) — **blocks US1 tests**
- **US1 (Phase 3)**: Depends on Foundational (T005–T008) — pure function tests
- **US2 (Phase 4)**: Depends on Foundational (T005–T008) — US2 tasks T011–T018 are all parallel with each other
- **US3 (Phase 5)**: Depends on Setup (T001–T004) — independent of US1/US2 test files
- **Polish (Phase 6)**: Depends on all prior phases complete

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational extraction (T005, T006)
- **US2 (P2)**: Depends on Foundational extraction (T005–T008); independent of US1 test files
- **US3 (P3)**: Depends only on Setup (npm scripts exist); independent of US1/US2

### Parallel Opportunities

Within Phase 4 (US2), T011–T018 all operate on different files and can run simultaneously:

```
T011 review-actions.test.ts      ─┐
T012 lessons-actions.test.ts     ─┤
T013 items-actions.test.ts       ─┤ All parallel — different files
T014 grammar-actions.test.ts     ─┤
T015 roadmap-actions.test.ts     ─┤
T016 examples-actions.test.ts    ─┤
T017 mobile-nav.test.tsx         ─┤
T018 quiz-client.test.tsx        ─┘
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational extraction (T005–T008)
3. Complete Phase 3: Pure utility tests (T009–T010)
4. **STOP and VALIDATE**: `npm run test:run -- review-utils streak-utils` — all pass
5. Coverage of SM-2 and streak logic is complete

### Incremental Delivery

1. Setup + Foundational → extraction complete, build still passes
2. US1 → pure function coverage validated
3. US2 → server action coverage validated, `npm run test:coverage` ≥ 80%
4. US3 → CI pipeline active, PRs auto-checked
5. Polish → lint clean, CLAUDE.md accurate

---

## Notes

- All [P] tasks within a phase touch different files — safe to parallelize
- US2 tasks (T011–T018) may already be partially or fully implemented on the working branch — verify before rewriting
- `redirect()` from `next/navigation` must be mocked to throw `new Error("NEXT_REDIRECT")` — Next.js internals require this
- Supabase mock chains must return `this` from each builder method to support chained queries
- Coverage excludes `app/actions/push.ts` and `app/actions/tmdb.ts` (external service wrappers)
