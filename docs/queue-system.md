# Video Queue System

This document explains the implementation of the video processing queue system that allows users to upload multiple videos at once and processes them sequentially.

## Features

- **Multi-file Upload**: Users can select and upload multiple video files at once
- **Queue Management**: Videos are organized into batches and processed one by one
- **Progress Tracking**: Real-time progress updates for each batch and individual videos
- **Auto-processing**: Background service automatically processes queued videos
- **Status Display**: UI shows current processing status, progress, and queue position

## Architecture

### Database Schema

The queue system extends the existing `videos` table with these additional columns:

- `batch_id`: UUID that groups videos uploaded together
- `queue_position`: Position in the processing queue (0-based)
- `batch_status`: Overall status of the batch (`pending`, `processing`, `completed`, `error`)
- `added_to_queue_at`: Timestamp when video was added to queue

### API Endpoints

#### POST `/api/queue/add`

Adds multiple files to the processing queue.

**Request**: FormData with multiple `files`, `language`, and `userId`
**Response**: `{ batchId, videos: [...] }`

#### POST `/api/queue/process`

Processes the next video in a batch.

**Request**: `{ batchId }`
**Response**: Processing status and result

#### GET/POST `/api/queue/status`

- **GET**: Returns queue status for a user or batch
- **POST**: Control batch processing (start/cancel)

#### POST `/api/queue/auto-process`

Background service endpoint that processes pending videos automatically.

### Components

#### `VideoUploadSection`

- Updated to support multiple file selection
- Shows list of selected files with sizes
- Handles batch upload to queue

#### `QueueStatus`

- Displays real-time queue progress
- Shows batch status and individual video progress
- Provides controls to start/cancel batch processing

#### `useQueue` Hook

- Manages queue state and operations
- Provides methods for processing and batch management
- Auto-refreshes queue status

## How It Works

1. **Upload Phase**: User selects multiple files → Files are uploaded to storage and added to queue with batch ID

2. **Queue Phase**: Videos are marked as "uploaded" and waiting in queue with position numbers

3. **Processing Phase**:

   - System processes videos one by one based on queue position
   - Video status changes: `uploaded` → `processing` → `completed`/`error`
   - Next video in queue is automatically processed

4. **Completion**: When all videos in a batch are processed, batch status becomes `completed`

## Usage

### Upload Multiple Videos

```jsx
<VideoUploadSection
  onGenerate={async (files, language, helpers) => {
    // files is now File[] instead of File
    // Process batch upload
  }}
/>
```

### Monitor Queue

```jsx
<QueueStatus userId={user.id} />
```

### Use Queue Hook

```jsx
const { batches, uploadFiles, processNextVideo } = useQueue(userId);

// Upload files
const batchId = await uploadFiles(files, "en", userId);

// Process next video
await processNextVideo(batchId);
```

## Error Handling

- If any file in a batch fails to upload, the entire batch is rolled back
- Individual video processing errors don't stop the batch
- Failed videos are marked with `error` status and error details in transcript field
- Users can retry or cancel remaining videos in a batch

## Performance Considerations

- Videos are processed one at a time to avoid overwhelming the transcription service
- Background auto-processing includes delays between videos
- UI updates every 5 seconds by default (configurable)
- Database queries are optimized with appropriate indexes

## Future Enhancements

- Priority queue support
- Batch size limits
- Resume interrupted processing
- Webhook notifications for completion
- Admin dashboard for queue management
