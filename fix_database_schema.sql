-- Execute this SQL in your Supabase SQL Editor or database client
-- This will add the missing columns to your videos table

-- Add duration and file_size columns to videos table
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS duration DECIMAL,
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Add index for better performance on file_size queries (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_videos_file_size ON videos(file_size);

-- Add comments for documentation
COMMENT ON COLUMN videos.duration IS 'Video duration in seconds';
COMMENT ON COLUMN videos.file_size IS 'File size in bytes';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'videos' 
AND column_name IN ('duration', 'file_size');