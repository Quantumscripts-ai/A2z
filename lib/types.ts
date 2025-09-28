export interface SubtitleCue {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
  selected?: boolean;
  speaker?: number;
}

export interface VideoData {
  id: string;
  filename: string;
  status: "uploaded" | "processing" | "completed" | "error";
  language?: string;
  file_url?: string;
  storage_path?: string;
  transcript?: string | null;
  created_at?: string;
  user_id: string;
  // Queue management fields
  batch_id?: string | null;
  queue_position?: number;
  batch_status?: "pending" | "processing" | "completed" | "error";
  added_to_queue_at?: string;
}

export interface VideoBatch {
  batch_id: string;
  user_id: string;
  total_videos: number;
  completed_videos: number;
  failed_videos: number;
  processing_videos?: number;
  pending_videos?: number;
  batch_status: "pending" | "processing" | "completed" | "error";
  created_at: string;
  videos: VideoData[];
  // Calculated properties
  progress?: number;
  isComplete?: boolean;
  currentlyProcessing?: string | null;
}

export interface QueueItem {
  video_id: string;
  filename: string;
  queue_position: number;
  status: "uploaded" | "processing" | "completed" | "error";
  batch_id: string;
}
