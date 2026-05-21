# Data Model: Flashcard Multiple Choice Review

**Feature**: 003-flashcard-multiple-choice
**Date**: 2026-05-21

---

## No Schema Changes Required

This feature is a pure UI/logic change. The existing database schema (`flashcards`, `lesson_items`, `lessons`) is unchanged.

---

## New Runtime Types (TypeScript — no DB migration)

### `ChoiceOption`

Represents one of the four labelled answer options on a multiple choice card.

```ts
type ChoiceOption = {
  label: 'A' | 'B' | 'C' | 'D'
  text: string       // the translation shown to the user
  isCorrect: boolean // true for exactly one option per card
}
```

### `MultipleChoiceCard`

Extends the existing `Flashcard` type used in `review-client.tsx` with pre-computed options for the session.

```ts
type MultipleChoiceCard = Flashcard & {
  options: ChoiceOption[]   // shuffled, generated at session start
  skipCount: number         // 0 | 1; capped at 1 re-queue per session
}
```

### `SelectionState`

Tracks the user's answer on the currently displayed card. Reset to `null` on card advance.

```ts
type SelectionState = {
  selectedLabel: 'A' | 'B' | 'C' | 'D'
  isCorrect: boolean
} | null
```

---

## Pure Function: `buildMultipleChoiceOptions`

Lives in `app/lib/review-utils.ts`. No side effects.

```ts
function buildMultipleChoiceOptions(
  correct: string,            // the card's `back` (correct translation)
  pool: string[],             // all other user translations (distractors source)
  count?: number,             // defaults to 4
): ChoiceOption[]
```

**Invariants**:
- Returns exactly `count` (default 4) options.
- Exactly one option has `isCorrect: true`.
- All `text` values are distinct (no duplicates).
- The correct option is placed in a random position among A–D.
- If `pool.length < count - 1`, the function fills remaining slots with placeholder strings to maintain the 4-option guarantee (handled upstream by `fetchFallbackDistractors`; this function assumes the pool is already large enough).

---

## State Changes in `review-client.tsx`

### Removed state
- `flipped: boolean` — cards no longer have a "flip" gesture; options are shown immediately.

### Added state
- `selection: SelectionState` — tracks the current card's selection result.
- `skipMap: Map<string, number>` — tracks skip count per card ID across the session.

### Modified state
- `cards` type changes from `Flashcard[]` to `MultipleChoiceCard[]` — options are computed once at session start and embedded in each card object.

---

## Server Action Changes

### Existing: `fetchFlashcards` — unchanged
Continues to return due cards for the session.

### New: `fetchDistractorPool(excludeCardId?: string): Promise<string[]>`
Located in `app/actions/review.ts`.

- Returns all `back` values from the authenticated user's `flashcards` table.
- Excludes the `back` value of `excludeCardId` if provided (not strictly necessary at the action level since `buildMultipleChoiceOptions` deduplicates, but defensively cleaner).
- Used once at session start to populate the distractor pool.

### New: `fetchFallbackDistractors(): Promise<string[]>`
Located in `app/actions/review.ts`.

- Queries `lesson_items` for `translation` values where no corresponding `flashcards` row exists for the user.
- Used only when `fetchDistractorPool` returns fewer than 3 results.

---

## Session Initialization Flow (Updated)

```
1. User starts review session (standard or cinema)
2. Parallel fetch:
   a. fetchFlashcards(lessonId?) → Flashcard[]
   b. fetchDistractorPool()      → string[]  (all user translations)
3. If pool.length < 3:
   c. fetchFallbackDistractors() → string[]  (appended to pool)
4. For each card, call buildMultipleChoiceOptions(card.back, pool)
   → assign card.options
5. Initialize skipMap as empty Map
6. Render first MultipleChoiceCard
```

---

## Grading Flow (Updated)

```
User selects option
  → setSelection({ selectedLabel, isCorrect })
  → show visual feedback (red/green highlights)
  → after ~1.5s auto-advance:
      if isCorrect:  await updateFlashcard(card.id, sm2(card, 5))
      if !isCorrect: await updateFlashcard(card.id, sm2(card, 1))
      → advance index

User taps Skip
  → if skipMap.get(card.id) >= 1: dismiss (no SM-2 call), advance index
  → else: skipMap.set(card.id, 1); push card to end of cards array; advance index
```
