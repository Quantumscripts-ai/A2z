-- Add duration and file_size columns to videos table
ALTER TABLE videos 
ADD COLUMN duration DECIMAL,
ADD COLUMN file_size BIGINT;

-- Add index for better performance on file_size queries
CREATE INDEX idx_videos_file_size ON videos(file_size);

-- Add comments for documentation
COMMENT ON COLUMN videos.duration IS 'Video duration in seconds';
COMMENT ON COLUMN videos.file_size IS 'File size in bytes';