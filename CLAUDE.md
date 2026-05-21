# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # Lint — must pass before any PR
```

Run `npm run test:coverage` for the Vitest suite (80% coverage required). Verify UI changes manually via the dev server.

## Architecture

**Highlight** is a PWA for English vocabulary learning, with spaced-repetition flashcards.

### Data model

```
lessons  ──< lesson_items ──< flashcards
                                └── SM-2 state: ease_factor, interval_days, next_review_at
push_subscriptions (per user, for daily review reminders)
```

`lessons.roadmap_key` links a class to the hardcoded roadmap tree in `app/(app)/roadmap/roadmap-data.ts` using the format `"Level||Theme||Session"`.

Roadmap completion state is stored in **localStorage** (`hl_roadmap_done`) — there is no server-side progress table.

### Request flow

Server Components fetch Supabase directly → render. Mutations go through Server Actions in `app/actions/` (grouped by domain: `lessons.ts`, `items.ts`, `review.ts`, `push.ts`). Client Components never touch Supabase directly.

### Key systems

| System | Files |
|---|---|
| SM-2 algorithm | `app/lib/review-utils.ts` (pure), `app/actions/review.ts`, `app/(app)/review/review-client.tsx` |
| Word extraction from text | `app/(app)/lessons/[id]/transcript-extractor.tsx` + `common-words.ts` |
| Daily push cron | `app/api/cron/push-review/route.ts` (Vercel cron, noon UTC) |
| Auth (Google OAuth) | `app/auth/`, `app/utils/supabase/` |

### External APIs

- **MyMemory** (`api.mymemory.translated.net`): EN→PT translation
- **Dictionary API** (`api.dictionaryapi.dev`): IPA phonetics
- **Tatoeba** (`tatoeba.org/api_v0`): example sentences
- **Web Push**: browser notifications via `web-push` + VAPID keys in `.env.local`

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `specs/004-cinema-source-quiz/plan.md`.
<!-- SPECKIT END -->
