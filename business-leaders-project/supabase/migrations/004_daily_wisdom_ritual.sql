-- Daily Wisdom Ritual: Streak tracking and email preferences
-- Migration 004

-- User daily preferences and streak tracking
CREATE TABLE user_daily_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Streak tracking
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_visit_date DATE,
  total_visits INTEGER DEFAULT 0,

  -- Email preferences
  email_enabled BOOLEAN DEFAULT FALSE,
  email_time TIME DEFAULT '08:00:00',
  email_timezone TEXT DEFAULT 'America/New_York',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily nugget cache (stores selected nugget for each day for consistency)
CREATE TABLE daily_nuggets (
  date DATE PRIMARY KEY,
  nugget_id UUID NOT NULL REFERENCES nuggets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_daily_preferences_email
  ON user_daily_preferences(email_enabled, email_time)
  WHERE email_enabled = TRUE;

CREATE INDEX idx_daily_nuggets_date
  ON daily_nuggets(date DESC);

-- Enable RLS
ALTER TABLE user_daily_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nuggets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_daily_preferences
CREATE POLICY "Users can view own daily preferences"
  ON user_daily_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily preferences"
  ON user_daily_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily preferences"
  ON user_daily_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Daily nuggets are publicly readable (same nugget for everyone)
CREATE POLICY "Daily nuggets are publicly readable"
  ON daily_nuggets FOR SELECT
  USING (true);

-- Allow authenticated users to insert daily nuggets (for caching)
CREATE POLICY "Authenticated users can insert daily nuggets"
  ON daily_nuggets FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_daily_preferences_updated_at
  BEFORE UPDATE ON user_daily_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_preferences_updated_at();
