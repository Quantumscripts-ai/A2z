-- Create videos table
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    status TEXT NOT NULL DEFAULT 'processing', -- processing, completed, failed
    language TEXT NOT NULL,
    source_language TEXT,
    target_language TEXT,
    transcription_data JSONB,
    subtitles_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    storage_path TEXT NOT NULL,
    processing_error TEXT,

    -- Ensure status is one of our valid values
    CONSTRAINT valid_status CHECK (status IN ('processing', 'completed', 'failed'))
);

-- Enable Row Level Security
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own videos"
    ON public.videos
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos"
    ON public.videos
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
    ON public.videos
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
    ON public.videos
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON public.videos
    FOR EACH ROW
    EXECUTE FUNCTION update_videos_updated_at();

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON public.videos(created_at);