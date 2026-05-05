-- ============================================================
-- English Notes SaaS — Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add columns to existing lessons table
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS lesson_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Create lesson_items table (replaces vocabulary)
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

CREATE POLICY "Users can manage their own lesson items"
  ON lesson_items FOR ALL
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Add lesson_item_id column to flashcards
ALTER TABLE flashcards
  ADD COLUMN IF NOT EXISTS lesson_item_id UUID
    REFERENCES lesson_items(id) ON DELETE SET NULL;
