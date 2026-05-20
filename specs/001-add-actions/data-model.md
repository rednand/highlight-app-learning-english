# Data Model: Automated Test Coverage for Server Actions

**Date**: 2026-05-20 | **Branch**: `001-add-actions`

No new database tables are introduced. This document defines the TypeScript interface contracts exported from `app/lib/` — the boundary between pure utility functions and their consumers.

## app/lib/review-utils.ts

### Types

```typescript
type Grade = 0 | 1 | 2 | 3 | 4 | 5

interface FlashcardSM2 {
  ease_factor: number    // SM-2 ease factor, min 1.3, default 2.5
  interval_days: number  // Days until next review, default 1
}

interface LessonStat {
  totalCount: number          // Total flashcards in the lesson
  dueCount: number            // Cards due now (next_review_at <= now)
  minNextReview: string | null // ISO timestamp of soonest upcoming review
  dominio: number             // Mastery score (0–100)
}
```

### Functions

| Function | Signature | Behaviour |
|----------|-----------|-----------|
| `sm2` | `(card: FlashcardSM2, grade: Grade) → { ease_factor, interval_days, next_review_at }` | Applies SM-2 algorithm. grade < 3 → interval = 1. interval = 1 → 6. else → round(interval × ef). ef clamped to ≥ 1.3. |
| `formatNextReview` | `(dateStr: string \| null) → string` | Returns "—" for null, "Agora" if due, "Amanhã" if 1 day, "Em N dias" otherwise. |
| `urgencyLabel` | `(stat: LessonStat \| undefined) → { label, color } \| null` | "Urgente" (red) if dueCount > 0; "Moderado" (yellow) if next review ≤ 2 days; "Tranquilo" (green) otherwise. |

## app/lib/streak-utils.ts

### Types

```typescript
interface StreakRecord {
  days: number              // Consecutive review days
  last_review_date: string  // ISO date string YYYY-MM-DD
}
```

### Functions

| Function | Signature | Behaviour |
|----------|-----------|-----------|
| `computeStreak` | `(data: StreakRecord \| null, today: string, yesterday: string) → number` | Returns 0 if no record. Returns `days` if last_review_date is today or yesterday. Returns 0 (broken streak) otherwise. |
| `computeNewDays` | `(existing: StreakRecord \| null, today: string, yesterday: string) → number \| null` | Returns null if already reviewed today (no-op). Returns existing.days + 1 if yesterday. Returns 1 for first review or broken streak. |
| `todayAndYesterday` | `() → { today: string, yesterday: string }` | Returns current UTC date and prior day as YYYY-MM-DD strings. |

## SM-2 Algorithm Branch Coverage

All branches tested in `__tests__/review-utils.test.ts`:

| Condition | Expected interval | Test case |
|-----------|------------------|-----------|
| grade < 3 (e.g., 1) | Reset to 1 | "grade 1: reseta interval para 1" |
| grade ≥ 3, interval = 1 | Jump to 6 | "grade 5: salta para 6 dias" |
| grade ≥ 3, interval > 1 | round(interval × ef) | "grade 5: interval > 1 multiplica" |
| ease_factor floor | Max(1.3, computed) | implied by grade-1 tests |
