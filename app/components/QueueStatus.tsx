"use client";

import { useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useQueue } from "@/hooks/useQueue";
import { VideoData } from "@/lib/types";

interface QueueStatusProps {
  userId: string;
  refreshInterval?: number;
}

const QueueStatus = ({ userId, refreshInterval = 5000 }: QueueStatusProps) => {
  const { isDark } = useTheme();
  const { batches, loading, error, processNextVideo, cancelBatch } = useQueue(
    userId,
    true,
    refreshInterval
  );

  // Auto-process next video in batches that are processing
  useEffect(() => {
    if (!batches.length) return;

    // Only get the latest batch
    const latestBatch = batches.reduce((latest, current) => {
      if (!latest) return current;
      return new Date(current.created_at) > new Date(latest.created_at)
        ? current
        : latest;
    }, batches[0]);

    // Only auto-process if the batch is in processing state and not complete
    if (latestBatch.batch_status === "processing" && !latestBatch.isComplete) {
      // Check if there are videos waiting to be processed
      const waitingVideos = latestBatch.videos.filter(
        (v) => v.status === "uploaded"
      );
      const processingVideos = latestBatch.videos.filter(
        (v) => v.status === "processing"
      );

      if (waitingVideos.length > 0 && processingVideos.length === 0) {
        // Process next video if none are currently processing
        processNextVideo(latestBatch.batch_id);
      }
    }
  }, [batches, processNextVideo]);

  if (loading) {
    return (
      <div
        className={`animate-pulse ${
          isDark ? "text-gray-300" : "text-gray-600"
        }`}
      >
        Loading queue status...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-500 text-sm`}>
        Failed to load queue status: {error}
      </div>
    );
  }

  // Only show if there are batches
  if (batches.length === 0) {
    return null; // Don't show anything if no batches
  }

  // Get the latest batch based on created_at timestamp
  const latestBatch = batches.reduce((latest, current) => {
    if (!latest) return current;
    return new Date(current.created_at) > new Date(latest.created_at)
      ? current
      : latest;
  }, batches[0]);

  // Hide queue status if the latest batch is completed or has errors (no active processing)
  if (
    latestBatch.isComplete ||
    latestBatch.batch_status === "completed" ||
    latestBatch.batch_status === "error"
  ) {
    return null; // Hide the queue when processing is done
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "processing":
        return "text-blue-500";
      case "error":
        return "text-red-500";
      default:
        return isDark ? "text-gray-400" : "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✅";
      case "processing":
        return "⏳";
      case "error":
        return "❌";
      default:
        return "⏸️";
    }
  };

  return (
    <div className="space-y-4">
      <h3
        className={`text-lg font-semibold ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Processing Queue
      </h3>

      <div
        key={latestBatch.batch_id}
        className={`border rounded-2xl p-4 ${
          isDark
            ? "bg-gray-900/30 border-gray-700/50"
            : "bg-gray-50/50 border-gray-200/50"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Batch ({latestBatch.total_videos} files)
            </span>
            <span
              className={`text-xs ${getStatusColor(latestBatch.batch_status)}`}
            >
              {getStatusIcon(latestBatch.batch_status)}{" "}
              {latestBatch.batch_status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!latestBatch.isComplete &&
              latestBatch.batch_status !== "processing" && (
                <button
                  onClick={() => processNextVideo(latestBatch.batch_id)}
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Start
                </button>
              )}

            {latestBatch.batch_status === "processing" &&
              !latestBatch.isComplete && (
                <button
                  onClick={() => cancelBatch(latestBatch.batch_id)}
                  className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Cancel
                </button>
              )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">
              Progress: {latestBatch.completed_videos}/
              {latestBatch.total_videos}
            </span>
            <span className="text-xs text-gray-500">
              {latestBatch.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${latestBatch.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Currently processing */}
        {latestBatch.currentlyProcessing && (
          <div className="mb-2">
            <span className="text-xs text-blue-500">
              Currently processing: {latestBatch.currentlyProcessing}
            </span>
          </div>
        )}

        {/* Video list */}
        <div className="space-y-1">
          {latestBatch.videos.map((video: VideoData) => (
            <div
              key={video.id}
              className="flex items-center justify-between text-sm py-1"
            >
              <span className="flex items-center gap-2">
                <span className={getStatusColor(video.status)}>
                  {getStatusIcon(video.status)}
                </span>
                <span className="truncate max-w-xs">{video.filename}</span>
              </span>
              <span className={`text-xs ${getStatusColor(video.status)}`}>
                {video.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QueueStatus;
