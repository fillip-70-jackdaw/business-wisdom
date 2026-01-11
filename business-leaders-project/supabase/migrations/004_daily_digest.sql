-- Daily Digest: Personalized daily wisdom + saved articles
-- Users receive curated nuggets and saved articles daily (opt-out by default)

-- User preferences for digest delivery
CREATE TABLE digest_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,                    -- opt-out by default
  email_enabled BOOLEAN DEFAULT TRUE,              -- receive via email
  frequency TEXT DEFAULT 'daily',                  -- 'daily', 'weekly', 'never'
  send_time TIME DEFAULT '08:00:00',               -- preferred time (user's timezone)
  timezone TEXT DEFAULT 'UTC',                     -- user's timezone for send_time
  last_sent_at TIMESTAMPTZ,                        -- last email sent timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track digest history to avoid repeating content
CREATE TABLE digest_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nugget_id UUID REFERENCES nuggets(id) ON DELETE CASCADE,      -- null if article-only
  article_id UUID REFERENCES saved_articles(id) ON DELETE SET NULL,  -- null if nugget-only
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,                           -- track email opens

  CHECK (nugget_id IS NOT NULL OR article_id IS NOT NULL)  -- at least one must be set
);

-- RLS: Users can only see/manage their own digest data
ALTER TABLE digest_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE digest_history ENABLE ROW LEVEL SECURITY;

-- Digest Preferences Policies
CREATE POLICY "Users can view own preferences"
  ON digest_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON digest_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON digest_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Digest History Policies (read-only for users, system writes)
CREATE POLICY "Users can view own history"
  ON digest_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert history"
  ON digest_history FOR INSERT
  WITH CHECK (true);  -- API will validate user_id

-- Indexes for performance
CREATE INDEX idx_digest_prefs_user_id ON digest_preferences(user_id);
CREATE INDEX idx_digest_prefs_enabled ON digest_preferences(enabled, email_enabled) WHERE enabled = TRUE;
CREATE INDEX idx_digest_prefs_send_time ON digest_preferences(send_time, timezone) WHERE enabled = TRUE;

CREATE INDEX idx_digest_history_user_id ON digest_history(user_id);
CREATE INDEX idx_digest_history_sent_at ON digest_history(user_id, sent_at DESC);
CREATE INDEX idx_digest_history_nugget_id ON digest_history(nugget_id);
CREATE INDEX idx_digest_history_recent ON digest_history(user_id, nugget_id, sent_at DESC);

-- Function to automatically create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_digest_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO digest_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_digest_preferences();

-- Update timestamp trigger for preferences
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_digest_preferences_updated_at
  BEFORE UPDATE ON digest_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
