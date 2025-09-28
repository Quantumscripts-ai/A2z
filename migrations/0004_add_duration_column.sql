-- Add duration column to videos table to store actual video duration in seconds
-- This will help with accurate credit calculations

ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS duration NUMERIC DEFAULT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN videos.duration IS 'Video duration in seconds (extracted from client-side video metadata)';