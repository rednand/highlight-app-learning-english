-- ============================================================
-- English Notes SaaS — Migration
-- Run this in the Supabase SQL Editor
-- Safe to run multiple times (idempotent)
-- ============================================================

-- 1. Add columns to existing lessons table
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS lesson_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Create lesson_items table
CREATE TABLE IF NOT EXISTS lesson_items (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id   UUID        NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term        TEXT        NOT NULL,
  translation TEXT,
  type        TEXT        NOT NULL DEFAULT 'word'
                CHECK (type IN ('word', 'expression', 'phrase')),
  context     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lesson_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lesson_items'
    AND policyname = 'Users can manage their own lesson items'
  ) THEN
    CREATE POLICY "Users can manage their own lesson items"
      ON lesson_items FOR ALL TO authenticated
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Add phonetic and my_sentence to lesson_items
ALTER TABLE lesson_items ADD COLUMN IF NOT EXISTS phonetic    TEXT;
ALTER TABLE lesson_items ADD COLUMN IF NOT EXISTS my_sentence TEXT;

-- 4. Add roadmap_key to lessons
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS roadmap_key TEXT;

-- 5. Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT        NOT NULL,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'push_subscriptions'
    AND policyname = 'Users can manage their own push subscriptions'
  ) THEN
    CREATE POLICY "Users can manage their own push subscriptions"
      ON push_subscriptions FOR ALL TO authenticated
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 6. Add lesson_item_id to flashcards
ALTER TABLE flashcards
  ADD COLUMN IF NOT EXISTS lesson_item_id UUID
    REFERENCES lesson_items(id) ON DELETE SET NULL;

-- 7. Roadmap progress
CREATE TABLE IF NOT EXISTS roadmap_progress (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_key TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_key)
);

ALTER TABLE roadmap_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'roadmap_progress'
    AND policyname = 'Users can manage their own roadmap progress'
  ) THEN
    CREATE POLICY "Users can manage their own roadmap progress"
      ON roadmap_progress FOR ALL TO authenticated
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 9. Source type + music fields
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS source_type          TEXT DEFAULT 'lesson';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS music_artist         TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS music_thumbnail_url  TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lessons_source_type_check'
    AND conrelid = 'lessons'::regclass
  ) THEN
    ALTER TABLE lessons
      ADD CONSTRAINT lessons_source_type_check
      CHECK (source_type IN ('lesson', 'movie', 'music'));
  END IF;
END $$;

-- 8. TMDB media context on lessons
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS tmdb_id          INTEGER;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS tmdb_type        TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS tmdb_poster_path TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS tmdb_season      INTEGER;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lessons_tmdb_type_check'
    AND conrelid = 'lessons'::regclass
  ) THEN
    ALTER TABLE lessons
      ADD CONSTRAINT lessons_tmdb_type_check
      CHECK (tmdb_type IN ('movie', 'tv') OR tmdb_type IS NULL);
  END IF;
END $$;

-- 10. Book fields
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS book_author    TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS book_cover_url TEXT;

DO $$ BEGIN
  ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_source_type_check;
  ALTER TABLE lessons
    ADD CONSTRAINT lessons_source_type_check
    CHECK (source_type IN ('lesson', 'movie', 'music', 'book'));
END $$;

-- 12. User streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id          UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  days             INT   NOT NULL DEFAULT 1,
  last_review_date DATE  NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_streaks'
    AND policyname = 'Users can manage their own streak'
  ) THEN
    CREATE POLICY "Users can manage their own streak"
      ON user_streaks FOR ALL TO authenticated
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 11. Grammar quiz progress
CREATE TABLE IF NOT EXISTS grammar_progress (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_slug    TEXT        NOT NULL,
  correct      INT         NOT NULL DEFAULT 0,
  total        INT         NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, rule_slug)
);

ALTER TABLE grammar_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'grammar_progress'
    AND policyname = 'Users can manage their own grammar progress'
  ) THEN
    CREATE POLICY "Users can manage their own grammar progress"
      ON grammar_progress FOR ALL TO authenticated
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 12. Track when a flashcard was last reviewed (for the daily goal)
ALTER TABLE flashcards
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;

-- 13. AI grammar practice attempts
CREATE TABLE IF NOT EXISTS practice_attempts (
  id                     UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_slug              TEXT        NOT NULL,
  direction              TEXT        NOT NULL,
  source_text            TEXT        NOT NULL,
  reference_translation  TEXT        NOT NULL,
  my_translation         TEXT        NOT NULL,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE practice_attempts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'practice_attempts'
    AND policyname = 'Users can manage their own practice attempts'
  ) THEN
    CREATE POLICY "Users can manage their own practice attempts"
      ON practice_attempts FOR ALL TO authenticated
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 14. Store AI correction feedback for practice attempts
ALTER TABLE practice_attempts
  ADD COLUMN IF NOT EXISTS ai_feedback TEXT;

-- 15. Discard flashcards from review (keeps the word in the lesson)
ALTER TABLE flashcards
  ADD COLUMN IF NOT EXISTS discarded_at TIMESTAMPTZ;

-- 16. Lesson notes (a list of notes per lesson/media)
CREATE TABLE IF NOT EXISTS lesson_notes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id   UUID        NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lesson_notes_lesson_id_idx ON lesson_notes (lesson_id, created_at);

ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lesson_notes'
    AND policyname = 'Users can manage their own lesson notes'
  ) THEN
    CREATE POLICY "Users can manage their own lesson notes"
      ON lesson_notes FOR ALL TO authenticated
      USING  (auth.uid() = user_id)
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (SELECT 1 FROM lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid())
      );
  END IF;
END $$;

-- Move each lesson's old single note into the list, then clear the old column
-- so lesson_notes is the only source (safe to re-run: moved notes are gone)
INSERT INTO lesson_notes (lesson_id, user_id, content, created_at, updated_at)
SELECT l.id, l.user_id, l.notes, l.created_at, l.created_at
FROM lessons l
WHERE l.notes IS NOT NULL AND btrim(l.notes) <> '';

UPDATE lessons SET notes = NULL WHERE notes IS NOT NULL;
