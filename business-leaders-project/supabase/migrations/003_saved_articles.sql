-- Saved Articles: Personal read-later feature
-- Users can save article URLs for future reading (private to each user)

CREATE TABLE saved_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,                    -- fetched or user-provided
  description TEXT,              -- fetched from meta tags
  image_url TEXT,                -- fetched og:image
  domain TEXT,                   -- extracted from URL for display
  is_read BOOLEAN DEFAULT FALSE, -- mark as read
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,           -- when marked as read

  UNIQUE(user_id, url)           -- prevent duplicate saves
);

-- RLS: Users can only see/manage their own articles
ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own articles"
  ON saved_articles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own articles"
  ON saved_articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own articles"
  ON saved_articles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own articles"
  ON saved_articles FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for fast user queries
CREATE INDEX idx_saved_articles_user_id ON saved_articles(user_id);
CREATE INDEX idx_saved_articles_created_at ON saved_articles(created_at DESC);
CREATE INDEX idx_saved_articles_is_read ON saved_articles(user_id, is_read);
