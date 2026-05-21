# Implementation Plan: Flashcard Multiple Choice Review

**Branch**: `003-flashcard-multiple-choice` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-flashcard-multiple-choice/spec.md`

## Summary

Replace the "Remembered / Forgot" (and 3-grade) buttons in the flashcard review session with a 4-option multiple choice format (A, B, C, D). One option is the correct translation; three are distractors drawn randomly from the user's saved vocabulary across all lessons. Both normal review mode and Cinema Mode receive the same mechanic. A Skip button re-queues a card once per session without SM-2 impact. Correct selection maps to SM-2 grade 5; wrong selection maps to grade 1. No database schema changes are required.

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 16 App Router

**Primary Dependencies**: React 19, Tailwind v4, Supabase JS client

**Storage**: PostgreSQL via Supabase (no schema changes)

**Testing**: Vitest (`npm run test:coverage`, ≥ 80% coverage required)

**Target Platform**: Web PWA (Vercel), mobile-first

**Performance Goals**: SM-2 stays synchronous < 1 ms; distractor pool fetched once per session (no per-card round-trips)

**Constraints**: No new npm packages; no `any`; Server Components default; mutations via Server Actions only

**Scale/Scope**: Single-user session; pool size typically < 500 words

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with `.specify/memory/constitution.md` before proceeding:

| Principle | Gate Question | Status |
|-----------|--------------|--------|
| I. Code Quality | Does the plan avoid `any`, `console.log`, and direct Supabase access from Client Components? | ✅ |
| II. Testing Standards | Does the plan include automated tests with ≥ 80% coverage and no live DB dependency? | ✅ |
| III. UX Consistency | Does the plan preserve keyboard shortcuts, mobile compatibility, and pt-BR text? | ✅ |
| IV. Performance | Does the plan respect API cache TTLs and keep SM-2 synchronous? | ✅ |
| V. Clean Code | Are all new functions single-purpose, self-named, and free of dead code or premature abstractions? | ✅ |
| VI. Simple UX | Does every new screen/button serve a documented user need and reach primary actions in ≤ 2 taps? | ✅ |
| VII. Responsible Design | Is data collection minimal, opt-in for push, and free of dark patterns? | ✅ |
| VIII. Minimal Dependencies | Are all new packages justified with alternatives evaluated and no unused deps introduced? | ✅ |
| Stack Constraints | Does the plan stay within Next.js 16 App Router, Tailwind v4, Supabase, and Vercel? | ✅ |
| Quality Gates | Will `lint`, `test:coverage`, `build`, and `/review` all pass before PR creation? | ✅ |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/003-flashcard-multiple-choice/
├── plan.md         ← this file
├── research.md     ← Phase 0 output
├── data-model.md   ← Phase 1 output
└── tasks.md        ← Phase 2 output (/speckit-tasks)
```

### Source Code (affected files)

```text
app/
├── lib/
│   ├── review-utils.ts                   # ADD buildMultipleChoiceOptions + ChoiceOption type
│   └── review-utils.test.ts              # ADD tests for new function
├── actions/
│   └── review.ts                         # ADD fetchDistractorPool, fetchFallbackDistractors
└── (app)/
    └── review/
        └── review-client.tsx             # MAJOR REFACTOR — replace grade buttons + add skip

components/
└── review/
    └── multiple-choice-options.tsx       # CREATE — reusable A/B/C/D option grid
```

**Structure Decision**: Next.js App Router with existing layout conventions. New reusable UI component goes under `components/review/` per project rule (reusable components never inside `app/`). New business logic goes in `app/lib/` as a pure function. New Server Actions extend the existing `app/actions/review.ts` file grouped by domain.

## Implementation Phases

### Phase 1 — Pure Logic (no UI)

**Goal**: Build and test the distractor/shuffle logic in isolation before touching the UI.

**`app/lib/review-utils.ts`** — Add:

```ts
export type ChoiceOption = {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
  isCorrect: boolean
}

export function buildMultipleChoiceOptions(
  correct: string,
  pool: string[],
): ChoiceOption[]
```

- Pick 3 unique distractors from `pool` (excluding `correct`).
- Shuffle all 4 items using Fisher-Yates.
- Assign labels A–D in shuffled order.

**`app/lib/review-utils.test.ts`** — Add tests:

- Returns exactly 4 options.
- Exactly one option has `isCorrect: true`.
- All `text` values are distinct.
- Correct answer position varies across multiple calls (shuffle check).
- Works when pool has exactly 3 items.

**Gate**: `npm run test:coverage` must pass before proceeding to Phase 2.

---

### Phase 2 — Server Actions

**Goal**: Expose the distractor pool from the server.

**`app/actions/review.ts`** — Add two actions:

```ts
export async function fetchDistractorPool(): Promise<string[]>
```
- Query authenticated user's `flashcards`, select `back` column.
- Return deduplicated translation strings.

```ts
export async function fetchFallbackDistractors(): Promise<string[]>
```
- Query `lesson_items` where no corresponding `flashcards` row exists for the user.
- Return deduplicated `translation` values.
- Used only when `fetchDistractorPool` returns fewer than 3 results.

---

### Phase 3 — UI Component

**Goal**: Build `MultipleChoiceOptions` as a standalone component testable in isolation.

**`components/review/multiple-choice-options.tsx`**

```ts
type SelectionState = {
  selectedLabel: 'A' | 'B' | 'C' | 'D'
  isCorrect: boolean
} | null

type Props = {
  options: ChoiceOption[]
  selection: SelectionState
  onSelect: (label: 'A' | 'B' | 'C' | 'D') => void
}
```

Behavior:
- 2×2 grid (mobile: 1 column stack).
- Each button: label badge + translation text.
- `selection === null`: all buttons interactive (hover + focus ring).
- `selection !== null`:
  - Correct option → green ring/background.
  - Selected wrong option → red ring/background.
  - Remaining options → dimmed, `pointer-events-none`.
- Keyboard: handled by parent, not this component.

---

### Phase 4 — Review Client Refactor

**Goal**: Wire all pieces together in `review-client.tsx`.

**State changes**:

| State | Change |
|-------|--------|
| `flipped: boolean` | **Remove** — no flip gesture in multiple choice |
| `selection: SelectionState` | **Add** — tracks current card's answer; null on advance |
| `skipMap: Map<string, number>` | **Add** — tracks skip count per card ID |
| `distractorPool: string[]` | **Add** — fetched once at session start |
| `cards` type | `Flashcard[]` → `MultipleChoiceCard[]` (with `.options` pre-computed) |

**Session start** (both standard and cinema):

```
Parallel: fetchFlashcards() + fetchDistractorPool()
  → if pool < 3: also fetchFallbackDistractors() and merge
  → for each card: card.options = buildMultipleChoiceOptions(card.back, pool)
  → setCards(multipleChoiceCards)
```

**`handleSelect(label)`**:

```
setSelection({ selectedLabel: label, isCorrect })
setTimeout(1500, () => {
  await updateFlashcard(card.id, sm2(card, isCorrect ? 5 : 1))
  advance index
  setSelection(null)
})
```

**`handleSkip()`**:

```
if skipMap.get(card.id) >= 1:
  advance index (no SM-2 call)
else:
  skipMap.set(card.id, 1)
  append card to end of cards array
  advance index
```

**Keyboard shortcuts** (updated):

| Key | Action |
|-----|--------|
| `1` | Select option A |
| `2` | Select option B |
| `3` | Select option C |
| `4` | Select option D |
| `Space` | Skip current card |

Keys `1–4` are only active when `selection === null` (unanswerned card). Space is active unless the card has been answered.

**Cinema Mode**: No separate changes — Cinema Mode already uses the same review step UI. The refactor applies to both `cardMode === 'standard'` and `cardMode === 'cinema'` without branching.

---

### Phase 5 — Quality Gates

```bash
npm run lint          # zero ESLint errors
npm run test:coverage # all tests pass, ≥ 80% coverage on all metrics
npm run build         # production build succeeds
/review               # no unresolved critical issues
gh pr create          # only after /review is clean
```

## Complexity Tracking

No constitution violations. No entries required.
