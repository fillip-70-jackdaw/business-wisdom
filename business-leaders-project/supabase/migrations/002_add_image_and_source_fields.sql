-- Add additional fields for better image tracking and source metadata

-- Leaders: add photo source URL and attribution
ALTER TABLE leaders
ADD COLUMN IF NOT EXISTS photo_source_url TEXT,
ADD COLUMN IF NOT EXISTS photo_attribution TEXT;

-- Nuggets: add source year for better attribution
ALTER TABLE nuggets
ADD COLUMN IF NOT EXISTS source_year INTEGER;

-- Create index for faster lookups by leader slug
CREATE INDEX IF NOT EXISTS idx_leaders_slug ON leaders(slug);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_nuggets_status ON nuggets(status);
