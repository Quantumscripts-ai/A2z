-- Add queue management columns to videos table
ALTER TABLE videos 
ADD COLUMN batch_id UUID DEFAULT NULL,
ADD COLUMN queue_position INTEGER DEFAULT 0,
ADD COLUMN batch_status TEXT DEFAULT 'pending' CHECK (batch_status IN ('pending', 'processing', 'completed', 'error')),
ADD COLUMN added_to_queue_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for efficient queue processing
CREATE INDEX idx_videos_queue_processing 
ON videos (batch_id, queue_position, status) 
WHERE status IN ('uploaded', 'processing');

-- Create index for batch status queries
CREATE INDEX idx_videos_batch_status 
ON videos (batch_id, batch_status);

-- Add comments for documentation
COMMENT ON COLUMN videos.batch_id IS 'Groups multiple videos uploaded together for batch processing';
COMMENT ON COLUMN videos.queue_position IS 'Position in the processing queue within a batch (0-based)';
COMMENT ON COLUMN videos.batch_status IS 'Overall status of the batch: pending, processing, completed, error';
COMMENT ON COLUMN videos.added_to_queue_at IS 'Timestamp when video was added to the processing queue';