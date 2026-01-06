-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leaders table
CREATE TABLE leaders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_credit TEXT,
  photo_license TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nuggets table
CREATE TABLE nuggets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID NOT NULL REFERENCES leaders(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  topic_tags TEXT[] DEFAULT '{}',
  type TEXT NOT NULL CHECK (type IN ('quote', 'principle', 'framework', 'story')),
  source_title TEXT,
  source_url TEXT,
  confidence TEXT NOT NULL DEFAULT 'attributed' CHECK (confidence IN ('verified', 'attributed', 'paraphrased')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nugget_id UUID NOT NULL REFERENCES nuggets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, nugget_id)
);

-- Indexes for performance
CREATE INDEX idx_nuggets_leader_id ON nuggets(leader_id);
CREATE INDEX idx_nuggets_status ON nuggets(status);
CREATE INDEX idx_nuggets_created_at ON nuggets(created_at DESC);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_leaders_slug ON leaders(slug);

-- Enable Row Level Security
ALTER TABLE leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE nuggets ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leaders
-- Anyone can read leaders
CREATE POLICY "Leaders are publicly readable"
  ON leaders FOR SELECT
  USING (true);

-- Only admins can insert/update/delete leaders (will use service role key)
-- No policy needed - will use service role to bypass RLS

-- RLS Policies for nuggets
-- Anyone can read published nuggets
CREATE POLICY "Published nuggets are publicly readable"
  ON nuggets FOR SELECT
  USING (status = 'published');

-- Admins can read all nuggets (using service role key bypasses RLS)

-- RLS Policies for favorites
-- Users can read their own favorites
CREATE POLICY "Users can read own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can remove favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);
