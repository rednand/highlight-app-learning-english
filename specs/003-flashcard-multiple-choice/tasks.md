# Tasks: Flashcard Multiple Choice Review

**Input**: Design documents from `specs/003-flashcard-multiple-choice/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: No new project infrastructure needed — feature modifies existing files only.

- [X] T001 Confirm branch `003-flashcard-multiple-choice` is checked out and `npm run lint` passes on current codebase

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and pure shuffle logic — MUST be complete before any user story phase begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Add `ChoiceOption` and `SelectionState` types to `app/lib/review-utils.ts`
- [X] T003 Implement `buildMultipleChoiceOptions(correct, pool)` pure function in `app/lib/review-utils.ts` (Fisher-Yates shuffle, 3 unique distractors, labels A–D)
- [X] T004 [P] Write unit tests for `buildMultipleChoiceOptions` in `app/lib/review-utils.test.ts` — verify: 4 options returned, exactly one `isCorrect`, all texts distinct, shuffle distributes correct position, handles pool of exactly 3
- [X] T005 [P] Add `fetchDistractorPool(): Promise<string[]>` Server Action in `app/actions/review.ts` — queries user's `flashcards.back` values, returns deduplicated array

**Checkpoint**: `npm run test:coverage` must pass before proceeding to Phase 3.

---

## Phase 3: User Story 1 — Multiple Choice in Normal Review Mode (Priority: P1) 🎯 MVP

**Goal**: Replace "Remembered/Forgot" grade buttons with a 4-option multiple choice grid on every review card in the standard review flow.

**Independent Test**: Navigate to `/review`, start a standard session, complete a full review cycle using only A/B/C/D selections and verify: correct answer highlights green, wrong answer highlights red + reveals correct in green, SM-2 `next_review_at` is updated after each selection, session completes normally.

### Implementation for User Story 1

- [X] T006 [US1] Create `components/review/multiple-choice-options.tsx` — renders 2×2 grid of `ChoiceOption[]`; idle state (all interactive), answered state (green/red highlights, all disabled); accepts `options`, `selection`, `onSelect` props
- [X] T007 [US1] Remove `flipped` state and all flip-related JSX from `app/(app)/review/review-client.tsx`
- [X] T008 [US1] Add `selection: SelectionState`, `skipMap: Map<string, number>`, and `distractorPool: string[]` states to `app/(app)/review/review-client.tsx`
- [X] T009 [US1] Update `startReview` in `app/(app)/review/review-client.tsx` to run `fetchDistractorPool()` in parallel with `fetchFlashcards()` and embed `.options` on each card via `buildMultipleChoiceOptions`
- [X] T010 [US1] Add `handleSelect(label)` in `app/(app)/review/review-client.tsx` — sets `selection`, calls `updateFlashcard` with `sm2(card, 5)` or `sm2(card, 1)` after 1 500 ms delay, advances index, resets `selection`
- [X] T011 [US1] Add `handleSkip()` in `app/(app)/review/review-client.tsx` — re-queues card to end of array on first skip (sets `skipMap`), dismisses silently on second skip, no SM-2 call
- [X] T012 [US1] Replace grade button section in `app/(app)/review/review-client.tsx` JSX with `<MultipleChoiceOptions>` component + Skip button below the grid
- [X] T013 [US1] Update keyboard event handler in `app/(app)/review/review-client.tsx` — keys `1/2/3/4` → `handleSelect('A'/'B'/'C'/'D')` (only when `selection === null`); `Space` → `handleSkip()` (only when card is unanswered); remove old grade shortcuts

**Checkpoint**: At this point User Story 1 is fully functional and testable independently. Verify manually via dev server before proceeding.

---

## Phase 4: User Story 2 — Multiple Choice in Cinema Mode (Priority: P2)

**Goal**: Ensure Cinema Mode cards also present the 4-option multiple choice grid, with media context (poster/thumbnail) still visible above the options.

**Independent Test**: Start a Cinema Mode session, verify that each card shows: media poster/thumbnail and title at top, then 4 multiple choice options below; selecting an answer triggers red/green feedback; Skip button is present; SM-2 is updated after each selection.

### Implementation for User Story 2

- [X] T014 [P] [US2] Update `startCinema` in `app/(app)/review/review-client.tsx` to also call `fetchDistractorPool()` and build `.options` on cinema cards (same as T009 for `startReview`)
- [X] T015 [US2] Adjust Cinema Mode card back layout in `app/(app)/review/review-client.tsx` — ensure media context block (poster/thumbnail + title/artist) renders above `<MultipleChoiceOptions>` without clipping on mobile viewports; remove any cinema-specific grade button overrides

**Checkpoint**: Cinema Mode session completes end-to-end with multiple choice interactions; media context is visible on all screen sizes.

---

## Phase 5: User Story 3 — Edge Case: Insufficient Vocabulary (Priority: P3)

**Goal**: Users with fewer than 4 total saved words can still start a review session and see a valid 4-option card.

**Independent Test**: Create a test account with exactly 2 saved flashcards; start a review; verify 4 distinct options appear with no crash; verify the options are not duplicates.

### Implementation for User Story 3

- [X] T016 [P] [US3] Add `fetchFallbackDistractors(): Promise<string[]>` Server Action in `app/actions/review.ts` — queries `lesson_items.translation` for items where no `flashcards` row exists for the user; returns deduplicated values
- [X] T017 [US3] Update session start in `app/(app)/review/review-client.tsx` — after `fetchDistractorPool()`, if `pool.length < 3`, call `fetchFallbackDistractors()` and merge into pool before calling `buildMultipleChoiceOptions`
- [X] T018 [US3] Add graceful empty-state guard in `app/(app)/review/review-client.tsx` — if total distinct pool + fallback < 3, show informational message in Portuguese ("Adicione mais palavras ao seu vocabulário para ativar a revisão") instead of crashing

**Checkpoint**: All three user stories fully functional. Edge case with tiny vocabulary handled gracefully.

---

## Phase 6: Polish & Quality Gates

**Purpose**: Cross-cutting concerns and mandatory gates before PR.

- [X] T019 [P] Run `npm run lint` and fix all ESLint errors across modified files
- [X] T020 Run `npm run test:coverage` — verify ≥ 80% coverage on all four metrics (lines, functions, branches, statements)
- [X] T021 Run `npm run build` — confirm production build succeeds with no errors or warnings
- [X] T022 Run `/review` — resolve all critical issues before opening PR
- [ ] T023 Run `gh pr create` — only after T022 review is clean

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user story phases**
- **US1 (Phase 3)**: Depends on Phase 2 completion — primary MVP increment
- **US2 (Phase 4)**: Depends on Phase 3 completion — shares same component, minimal delta
- **US3 (Phase 5)**: Can start after Phase 2 — T016 (new Server Action) is independent of US1/US2 UI work
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational phase — no dependency on US2 or US3
- **US2 (P2)**: Depends on US1 (T006–T013 must be complete; US2 is a thin layer on top)
- **US3 (P3)**: T016 is independent of US1/US2; T017–T018 depend on session start logic from T009/T014

### Within Each Phase

- Models/types before services (T002 before T003, T005)
- Pure logic before UI (T003 before T006)
- Component before client wiring (T006 before T012)
- All states added before handlers (T007–T008 before T010–T011)

### Parallel Opportunities

- T004 (tests) and T005 (Server Action) can run in parallel after T002–T003
- T014 (Cinema startCinema) and T015 (Cinema layout) within Phase 4
- T016 (fallback Server Action) can run in parallel during any phase after Phase 2
- T019 (lint) runs in parallel with T020 (tests) after implementation is complete

---

## Parallel Example: Phase 2 (Foundational)

```
# After T002 (types) and T003 (function) are done, launch in parallel:
Task T004: "Write unit tests for buildMultipleChoiceOptions in app/lib/review-utils.test.ts"
Task T005: "Add fetchDistractorPool Server Action in app/actions/review.ts"
```

## Parallel Example: Phase 6 (Quality Gates)

```
# After all implementation is done, launch in parallel:
Task T019: "npm run lint — fix all ESLint errors"
Task T020: "npm run test:coverage — verify ≥ 80% coverage"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T005) — **critical blocker**
3. Complete Phase 3: US1 (T006–T013)
4. **STOP and VALIDATE**: Run dev server, complete a full standard review session manually
5. If US1 passes → proceed to US2/US3

### Incremental Delivery

1. Setup + Foundational → Types and pure logic ready
2. US1 complete → Standard review mode works with multiple choice (MVP ✅)
3. US2 complete → Cinema Mode works with multiple choice
4. US3 complete → Edge case with tiny vocabulary handled
5. Polish → All quality gates pass → PR opened

---

## Notes

- `[P]` tasks operate on different files or have no shared dependencies — safe to run concurrently
- `[Story]` label maps each task to a specific user story for traceability
- US2 is intentionally thin: Cinema Mode shares the same `review-client.tsx` component and `MultipleChoiceOptions`; the only delta is the `startCinema` distractor fetch (T014) and layout adjustment (T015)
- No database migrations required — purely UI/logic change
- No new npm packages required
- Keyboard shortcuts update (T013) is a non-breaking change: replaces old shortcuts that no longer apply in a multiple choice flow
