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
