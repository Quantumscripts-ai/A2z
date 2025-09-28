import { useState, useEffect, useCallback } from "react";
import { VideoBatch } from "@/lib/types";

interface UseQueueReturn {
  batches: VideoBatch[];
  loading: boolean;
  error: string | null;
  refreshQueue: () => Promise<void>;
  processNextVideo: (batchId: string) => Promise<boolean>;
  cancelBatch: (batchId: string) => Promise<boolean>;
  uploadFiles: (
    files: File[],
    language: string,
    userId: string
  ) => Promise<string | null>;
}

export const useQueue = (
  userId: string,
  autoRefresh = true,
  refreshInterval = 5000
): UseQueueReturn => {
  const [batches, setBatches] = useState<VideoBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshQueue = useCallback(async () => {
    try {
      const response = await fetch(`/api/queue/status?userId=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch queue status");
      }

      setBatches(data.batches || []);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch queue status:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const processNextVideo = useCallback(
    async (batchId: string): Promise<boolean> => {
      try {
        const response = await fetch("/api/queue/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ batchId }),
        });

        if (response.ok) {
          await refreshQueue();
          return true;
        }
        return false;
      } catch (err) {
        console.error("Failed to process next video:", err);
        return false;
      }
    },
    [refreshQueue]
  );

  const cancelBatch = useCallback(
    async (batchId: string): Promise<boolean> => {
      try {
        const response = await fetch("/api/queue/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ batchId, action: "cancel" }),
        });

        if (response.ok) {
          await refreshQueue();
          return true;
        }
        return false;
      } catch (err) {
        console.error("Failed to cancel batch:", err);
        return false;
      }
    },
    [refreshQueue]
  );

  const uploadFiles = useCallback(
    async (
      files: File[],
      language: string,
      userId: string
    ): Promise<string | null> => {
      try {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        formData.append("language", language);
        formData.append("userId", userId);

        const response = await fetch("/api/queue/add", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to add files to queue");
        }

        await refreshQueue();
        return result.batchId;
      } catch (err: any) {
        console.error("Upload failed:", err);
        setError(err.message);
        return null;
      }
    },
    [refreshQueue]
  );

  // Auto-refresh effect
  useEffect(() => {
    refreshQueue();

    if (autoRefresh) {
      const interval = setInterval(refreshQueue, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshQueue, autoRefresh, refreshInterval]);

  return {
    batches,
    loading,
    error,
    refreshQueue,
    processNextVideo,
    cancelBatch,
    uploadFiles,
  };
};
