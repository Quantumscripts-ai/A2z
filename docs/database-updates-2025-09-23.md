# Database Updates - September 23, 2025

## Summary

This document outlines the recent database schema updates required for the TranslateA2Z application.

## Required Updates

### Video Table Updates

The videos table needs two new columns to support enhanced video information display:

1. **duration**: Decimal column to store video length in seconds
2. **file_size**: BigInt column to store file size in bytes

## Migration SQL

```sql
-- Add duration and file_size columns to videos table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='duration') THEN
        ALTER TABLE videos ADD COLUMN duration DECIMAL;
        COMMENT ON COLUMN videos.duration IS 'Video duration in seconds';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='file_size') THEN
        ALTER TABLE videos ADD COLUMN file_size BIGINT;
        COMMENT ON COLUMN videos.file_size IS 'File size in bytes';
    END IF;
END $$;

-- Add index for better performance on file_size queries if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_videos_file_size'
    ) THEN
        CREATE INDEX idx_videos_file_size ON videos(file_size);
    END IF;
END $$;
```

## Implementation Notes

1. The migration is designed to be idempotent - it will only add columns if they don't exist
2. Run this SQL in your Supabase SQL editor or through your preferred database administration tool
3. No data migration is required - new videos will populate these fields automatically

## UI Changes

The UserVideosList component has been updated to handle cases where these columns may be null for older videos.

## Post-Migration Verification

After applying this migration, verify that:

1. The videos table has the new columns
2. The UserVideosList component displays properly without errors
3. New video uploads correctly populate the duration and file_size fields
