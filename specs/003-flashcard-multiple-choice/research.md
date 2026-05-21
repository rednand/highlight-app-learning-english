# Research: Flashcard Multiple Choice Review

**Feature**: 003-flashcard-multiple-choice
**Date**: 2026-05-21

---

## Decision 1: Distractor Pool — Where and When to Fetch

**Decision**: Fetch all user flashcard `back` values in a single Server Action call at session start, alongside the due cards.

**Rationale**: The current `fetchFlashcards` already runs at session start. Adding a parallel call `fetchDistractorPool()` that returns all `back` values (or extending `fetchFlashcards` to include them) avoids a round-trip per card. Since a typical user vocabulary is in the hundreds of words, the payload is negligible.

**Alternatives considered**:
- Fetch distractors per card on demand: rejected — adds network latency on every card flip, breaks the offline-capable PWA goal.
- Fetch from a global word database: rejected — spec explicitly defines distractors as user's own vocabulary.

---

## Decision 2: Grade Mapping for Multiple Choice

**Decision**: Correct selection → `sm2(card, 5)` (Grade 5). Wrong selection → `sm2(card, 1)` (Grade 1).

**Rationale**: The existing SM-2 implementation already handles grade 1 (failure, interval resets to 1 day) and grade 5 (easy recall, interval multiplies). The spec maps "correct = remembered" and "wrong = forgot" — these map cleanly to the two extremes. The intermediate grade 3 ("Quase") is not applicable in multiple choice (there is no partial answer).

**Alternatives considered**:
- Grade 3 for correct (conservative): rejected — the user correctly identified the translation; penalizing with a cautious grade reduces the benefit of spaced repetition.
- Introduce a new scoring dimension for "fast vs slow selection": rejected — spec does not request difficulty gradations.

---

## Decision 3: Multiple Choice Option Shuffling

**Decision**: Extract a pure function `buildMultipleChoiceOptions(correct: string, pool: string[], seed?: number): ChoiceOption[]` in `app/lib/review-utils.ts` that returns 4 shuffled `ChoiceOption` objects `{ label: 'A'|'B'|'C'|'D', text: string, isCorrect: boolean }`.

**Rationale**: Pure functions in `app/lib/` are the established pattern for business logic (SM-2 lives here). The function is trivially testable, has no side effects, and can be called synchronously on the client — no async needed.

**Alternatives considered**:
- Generate options inside the component: rejected — couples logic to rendering, harder to test.
- Generate options on the server and embed in the card object: rejected — the pool is already fetched; shuffling can happen client-side without an extra Server Action round-trip.

---

## Decision 4: Skip Mechanic — State Management

**Decision**: Add a `skipMap: Map<string, number>` state to `review-client.tsx`. On skip, push the card to the end of the `cards` array. Track skip count per card ID. On second skip, dismiss silently (no SM-2 call).

**Rationale**: The spec requires skipped cards to re-appear once. A `Map` keyed by card ID is O(1) lookup and avoids duplicating logic in the card array itself.

**Alternatives considered**:
- Separate `skippedCards` array: workable but requires more state bookkeeping.
- Mark skip in the database: rejected — spec says no SM-2 impact; a DB write would add unnecessary overhead.

---

## Decision 5: Keyboard Shortcuts Update

**Decision**: In multiple choice mode, remap keyboard shortcuts to `1/2/3/4` for options A/B/C/D respectively. The `Space` key skips (replacing its previous "flip" role). The old grade shortcuts (1/2/3 for grade 1/3/5) are removed in multiple choice mode.

**Rationale**: Constitution Principle III requires keyboard shortcut support. In multiple choice there is no "flip" gesture — options are visible immediately. Mapping `1-4` to `A-D` is the natural analogue. Space as skip is intuitive and keeps one hand on the keyboard.

**Alternatives considered**:
- Keep Space as flip, use A/B/C/D letter keys: rejected — forces the user to move from number row to letter row, inconsistent with the existing numeric shortcut convention.

---

## Decision 6: Fallback Pool When User Has < 3 Distractors

**Decision**: When the user's vocabulary pool has fewer than 3 words available as distractors, fill remaining slots from the same `lesson_items` table but from cards the user has *not yet saved as flashcards* (items without a corresponding `flashcards` row), queried via a dedicated `fetchFallbackDistractors()` Server Action.

**Rationale**: This matches the spec assumption. It keeps distractors contextually relevant (within the same app's vocabulary universe) without introducing a global word list dependency.

**Alternatives considered**:
- Show fewer than 4 options: rejected — spec requires exactly 4 distinct options always.
- Duplicate options: rejected — confusing UX, user could notice and guess by elimination.

---

## Files to Create / Modify

| File | Action | Reason |
|------|--------|--------|
| `app/lib/review-utils.ts` | Modify | Add `buildMultipleChoiceOptions` pure function |
| `app/actions/review.ts` | Modify | Add `fetchDistractorPool()` Server Action |
| `app/(app)/review/review-client.tsx` | Major refactor | Replace grade buttons with multiple choice UI + skip logic |
| `components/review/multiple-choice-options.tsx` | Create | Reusable A/B/C/D option grid component |
| `app/lib/review-utils.test.ts` | Modify | Add tests for `buildMultipleChoiceOptions` |

No new npm packages required. No database schema changes required.
