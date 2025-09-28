// Utility to extract video duration and metadata from files
export interface VideoMetadata {
  duration: number; // in seconds
  durationMinutes: number;
  creditsNeeded: number;
  width?: number;
  height?: number;
  error?: string;
}

export const getVideoMetadata = (file: File): Promise<VideoMetadata> => {
  return new Promise((resolve) => {
    // Check if it's a video file
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/");

    if (!isVideo && !isAudio) {
      // For non-video files, fall back to file size estimation
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const compressionRatios: Record<string, number> = {
        mp3: 1,
        m4a: 1,
        wav: 10,
        aac: 0.8,
      };
      const mbPerMinute = compressionRatios[extension] || 8;
      const fileSizeMB = file.size / (1024 * 1024);
      const estimatedMinutes = Math.ceil(fileSizeMB / mbPerMinute);
      const creditsNeeded = Math.max(1, Math.min(estimatedMinutes, 60));

      resolve({
        duration: estimatedMinutes * 60,
        durationMinutes: estimatedMinutes,
        creditsNeeded,
        error: `Non-video file - estimated from size`,
      });
      return;
    }

    // Create video/audio element
    const mediaElement = isVideo
      ? document.createElement("video")
      : document.createElement("audio");

    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      mediaElement.remove();
    };

    const handleSuccess = () => {
      const duration = mediaElement.duration;
      const durationMinutes = duration / 60;
      const creditsNeeded = Math.ceil(durationMinutes); // 1 credit per minute, rounded up

      const result: VideoMetadata = {
        duration: duration,
        durationMinutes: durationMinutes,
        creditsNeeded: creditsNeeded,
      };

      // Add video dimensions if it's a video
      if (isVideo && "videoWidth" in mediaElement) {
        const videoEl = mediaElement as HTMLVideoElement;
        result.width = videoEl.videoWidth;
        result.height = videoEl.videoHeight;
      }

      cleanup();
      resolve(result);
    };

    const handleError = () => {
      // Fall back to file size estimation if duration extraction fails
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const compressionRatios: Record<string, number> = {
        // Video formats
        mp4: 8,
        mov: 12,
        avi: 15,
        wmv: 6,
        flv: 5,
        mkv: 10,
        webm: 4,
        // Audio formats
        mp3: 1,
        m4a: 1,
        wav: 10,
        aac: 0.8,
      };
      const mbPerMinute = compressionRatios[extension] || 8;
      const fileSizeMB = file.size / (1024 * 1024);
      const estimatedMinutes = Math.ceil(fileSizeMB / mbPerMinute);
      const creditsNeeded = Math.max(1, Math.min(estimatedMinutes, 60));

      cleanup();
      resolve({
        duration: estimatedMinutes * 60,
        durationMinutes: estimatedMinutes,
        creditsNeeded,
        error: `Could not read duration - estimated from size`,
      });
    };

    // Set up event listeners
    mediaElement.addEventListener("loadedmetadata", handleSuccess, {
      once: true,
    });
    mediaElement.addEventListener("error", handleError, { once: true });

    // Set timeout for cases where metadata never loads
    setTimeout(handleError, 5000); // 5 second timeout

    // Start loading
    mediaElement.preload = "metadata";
    mediaElement.src = objectUrl;
    mediaElement.load();
  });
};

export const getMultipleVideoMetadata = async (
  files: File[]
): Promise<VideoMetadata[]> => {
  const promises = files.map((file) => getVideoMetadata(file));
  return Promise.all(promises);
};
