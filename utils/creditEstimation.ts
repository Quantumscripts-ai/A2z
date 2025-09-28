// Video duration estimation utilities for client-side credit calculation

export interface FileEstimate {
  name: string;
  size: number;
  sizeInMB: number;
  estimatedCredits: number;
  estimatedDurationMinutes: number;
}

export const estimateVideoDurationClient = (
  fileSize: number,
  fileName: string
): number => {
  // Get file extension
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  // Different compression ratios for different formats (MB per minute)
  const compressionRatios: Record<string, number> = {
    // Video formats - more realistic estimates
    mp4: 8, // ~8MB per minute for typical 1080p
    mov: 12, // ~12MB per minute (less compressed)
    avi: 15, // ~15MB per minute (often uncompressed)
    wmv: 6, // ~6MB per minute
    flv: 5, // ~5MB per minute
    mkv: 10, // ~10MB per minute
    webm: 4, // ~4MB per minute (highly compressed)

    // Audio formats
    mp3: 1, // ~1MB per minute
    m4a: 1, // ~1MB per minute
    wav: 10, // ~10MB per minute (uncompressed)
    aac: 0.8, // ~0.8MB per minute
  };

  const mbPerMinute = compressionRatios[extension] || 8; // Default to 8MB/min
  const fileSizeMB = fileSize / (1024 * 1024);
  const estimatedMinutes = Math.ceil(fileSizeMB / mbPerMinute);

  // Debug logging (remove in production)
  console.log(`Credit Estimation for ${fileName}:`, {
    fileSize: `${fileSizeMB.toFixed(2)} MB`,
    extension,
    mbPerMinute,
    estimatedMinutes,
    finalCredits: Math.max(1, Math.min(estimatedMinutes, 60)),
  });

  // Return the calculated estimate, minimum 1 credit per file, maximum 60 credits
  return Math.max(1, Math.min(estimatedMinutes, 60)); // Cap at 60 credits per file
};

export const calculateTotalCreditsNeeded = (
  files: File[]
): {
  totalCredits: number;
  fileEstimates: FileEstimate[];
} => {
  const fileEstimates: FileEstimate[] = files.map((file) => {
    const sizeInMB = Math.round((file.size / (1024 * 1024)) * 100) / 100;
    const estimatedCredits = estimateVideoDurationClient(file.size, file.name);
    const estimatedDurationMinutes =
      Math.round((file.size / (1024 * 1024) / 10) * 100) / 100; // Rough estimate

    return {
      name: file.name,
      size: file.size,
      sizeInMB,
      estimatedCredits,
      estimatedDurationMinutes,
    };
  });

  const totalCredits = fileEstimates.reduce(
    (sum, file) => sum + file.estimatedCredits,
    0
  );

  return { totalCredits, fileEstimates };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
