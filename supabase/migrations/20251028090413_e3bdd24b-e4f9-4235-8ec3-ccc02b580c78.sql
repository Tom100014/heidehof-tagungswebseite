-- Create weather_activity_cache table for smart caching
CREATE TABLE IF NOT EXISTS weather_activity_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  window_label TEXT NOT NULL CHECK (window_label IN ('morning', 'noon', 'evening')),
  window_date DATE NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  weather_condition TEXT,
  temperature NUMERIC,
  categorized_activities JSONB NOT NULL,
  reasoning TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate cache entries per window per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_weather_cache_window_day 
ON weather_activity_cache (window_label, window_date);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_weather_cache_window_end 
ON weather_activity_cache (window_end DESC);

-- Enable RLS
ALTER TABLE weather_activity_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access (cached data is public)
CREATE POLICY "Allow public read access to weather cache"
ON weather_activity_cache
FOR SELECT
USING (true);

-- Allow service role to manage cache
CREATE POLICY "Service role can manage weather cache"
ON weather_activity_cache
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');