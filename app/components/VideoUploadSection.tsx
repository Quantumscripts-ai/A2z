"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useCredits } from "@/hooks/useCredits";
import { UI_CONSTANTS, SUPPORTED_LANGUAGES } from "@/constants";
import { getMultipleVideoMetadata, VideoMetadata } from "@/utils/videoMetadata";

interface VideoUploadSectionProps {
  userId?: string;
  onFileSelect?: (files: File[], language: string) => void;
  onUploadStart?: () => void;
  onGenerate?: (
    files: File[],
    language: string,
    helpers: {
      setProgress: (n: number) => void;
      setUploading: (b: boolean) => void;
      setBatchId: (id: string) => void;
    }
  ) => Promise<void> | void;
  className?: string;
}

const VideoUploadSection = ({
  userId,
  onFileSelect,
  onUploadStart,
  onGenerate,
  className = "",
}: VideoUploadSectionProps) => {
  const { isDark } = useTheme();
  const { credits, loading: creditsLoading } = useCredits(userId);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [creditEstimate, setCreditEstimate] = useState<{
    totalCredits: number;
    fileMetadata: VideoMetadata[];
  }>({ totalCredits: 0, fileMetadata: [] });
  const [creditWarning, setCreditWarning] = useState<string | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update credit estimates when files change
  useEffect(() => {
    if (selectedFiles.length > 0) {
      setLoadingMetadata(true);

      getMultipleVideoMetadata(selectedFiles)
        .then((metadata) => {
          const totalCredits = metadata.reduce(
            (sum, meta) => sum + meta.creditsNeeded,
            0
          );
          setCreditEstimate({ totalCredits, fileMetadata: metadata });

          // Check if user has enough credits
          if (!creditsLoading && credits < totalCredits) {
            const shortage = totalCredits - credits;
            setCreditWarning(
              `You need ${totalCredits} credits but only have ${credits}. You're short by ${shortage} credits. Please remove some videos or purchase more credits.`
            );
          } else {
            setCreditWarning(null);
          }
        })
        .catch((error) => {
          console.error("Error extracting video metadata:", error);
          // Fallback to basic estimation
          const totalCredits = selectedFiles.length;
          setCreditEstimate({
            totalCredits,
            fileMetadata: selectedFiles.map((file) => ({
              duration: 60,
              durationMinutes: 1,
              creditsNeeded: 1,
              error: "Could not read metadata",
            })),
          });
        })
        .finally(() => {
          setLoadingMetadata(false);
        });
    } else {
      setCreditEstimate({ totalCredits: 0, fileMetadata: [] });
      setCreditWarning(null);
      setLoadingMetadata(false);
    }
  }, [selectedFiles, credits, creditsLoading]);

  const validateFile = (file: File): boolean => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const isValidFormat = UI_CONSTANTS.SUPPORTED_VIDEO_FORMATS.includes(
      fileExtension || ""
    );
    const isValidSize = file.size <= UI_CONSTANTS.MAX_FILE_SIZE;

    return isValidFormat && isValidSize;
  };

  const handleFileSelect = useCallback(
    (files: File[]) => {
      const validFiles = files.filter(validateFile);
      const invalidFiles = files.filter((file) => !validateFile(file));

      if (invalidFiles.length > 0) {
        alert(
          `${invalidFiles.length} file(s) were invalid (format or size). Only valid files will be added.`
        );
      }

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
        if (onFileSelect) {
          onFileSelect([...selectedFiles, ...validFiles], selectedLanguage);
        }
      }
    },
    [onFileSelect, selectedLanguage, selectedFiles]
  );

  // Function to remove a specific file from the selection
  const handleRemoveFile = useCallback(
    (indexToRemove: number) => {
      setSelectedFiles((prev) => {
        const newFiles = prev.filter((_, index) => index !== indexToRemove);
        if (onFileSelect) {
          onFileSelect(newFiles, selectedLanguage);
        }
        return newFiles;
      });
    },
    [onFileSelect, selectedLanguage]
  );

  // Function to clear all files
  const handleClearAll = useCallback(() => {
    setSelectedFiles([]);
    if (onFileSelect) {
      onFileSelect([], selectedLanguage);
    }
  }, [onFileSelect, selectedLanguage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(Array.from(files));
      }
    },
    [handleFileSelect]
  );

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    onUploadStart?.();

    if (onGenerate) {
      try {
        await onGenerate(selectedFiles, selectedLanguage, {
          setProgress: setUploadProgress,
          setUploading: setIsUploading,
          setBatchId: setBatchId,
        });
        setUploadProgress(100);
      } finally {
        setIsUploading(false);
      }
    } else {
      // Fallback: simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTotalFileSize = useCallback(() => {
    return selectedFiles.reduce((total, file) => total + file.size, 0);
  }, [selectedFiles]);

  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const videoExtensions = ["mp4", "mov", "avi", "wmv", "flv", "mkv", "webm"];
    const audioExtensions = ["mp3", "m4a", "wav", "aac"];

    if (videoExtensions.includes(extension || "")) return "🎬";
    if (audioExtensions.includes(extension || "")) return "🎵";
    return "📁";
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 ${
          isDragOver
            ? isDark
              ? "border-purple-500 bg-purple-500/10"
              : "border-purple-400 bg-purple-50"
            : isDark
              ? "border-gray-700 bg-gray-900/30"
              : "border-gray-300 bg-gray-50/30"
        } ${className}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={UI_CONSTANTS.SUPPORTED_VIDEO_FORMATS.map(
            (format) => `.${format}`
          ).join(",")}
          onChange={handleFileInputChange}
          className="hidden"
          multiple
        />

        <div className="p-8 md:p-12 text-center">
          {/* Upload Icon */}
          <div className="mb-6">
            <div
              className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl transition-all duration-300 ${
                isDragOver
                  ? isDark
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-purple-100 text-purple-600"
                  : isDark
                    ? "bg-gray-800 text-gray-400"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              {selectedFiles.length > 0 ? "📋" : "📁"}
            </div>
          </div>

          {/* Upload Text */}
          <div className="mb-8">
            <h3
              className={`text-xl md:text-2xl font-bold mb-2 transition-colors duration-300 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {selectedFiles.length > 0
                ? `${selectedFiles.length} File${
                    selectedFiles.length > 1 ? "s" : ""
                  } Selected`
                : "Upload Your Videos"}
            </h3>

            {/* Show total size when files are selected */}
            {selectedFiles.length > 0 && (
              <p
                className={`text-sm mb-2 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Total size: {formatFileSize(getTotalFileSize())}
              </p>
            )}

            {selectedFiles.length === 0 ? (
              <p
                className={`text-sm md:text-base transition-colors duration-300 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Drag and drop your video files here, or click to browse
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Selected Files:
                  </span>
                  <button
                    onClick={handleClearAll}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      isDark
                        ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        : "text-red-600 hover:text-red-700 hover:bg-red-50"
                    }`}
                  >
                    Clear All
                  </button>
                </div>
                <div
                  className={`max-h-32 overflow-y-auto space-y-2 border rounded-lg p-2 ${
                    isDark
                      ? "border-gray-700 bg-gray-800/30"
                      : "border-gray-200 bg-gray-50/50"
                  }`}
                >
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between text-sm p-2 rounded transition-colors group ${
                        isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-100/80"
                      }`}
                    >
                      <span className="flex items-center gap-2 flex-1 min-w-0">
                        <span>{getFileIcon(file.name)}</span>
                        <span className="truncate font-medium">
                          {file.name}
                        </span>
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                          {formatFileSize(file.size)}
                        </span>
                        <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                          {loadingMetadata ? (
                            <span className="flex items-center gap-1">
                              <span className="animate-spin">⏳</span>
                              Analyzing...
                            </span>
                          ) : (
                            <>
                              {creditEstimate.fileMetadata[index]
                                ?.creditsNeeded || 1}{" "}
                              credits
                              {creditEstimate.fileMetadata[index]
                                ?.durationMinutes && (
                                <span className="ml-1 text-xs opacity-70">
                                  (
                                  {creditEstimate.fileMetadata[
                                    index
                                  ].durationMinutes.toFixed(1)}
                                  min)
                                </span>
                              )}
                              {creditEstimate.fileMetadata[index]?.error && (
                                <span
                                  className="ml-1 text-xs opacity-70"
                                  title={
                                    creditEstimate.fileMetadata[index].error
                                  }
                                >
                                  ⚠️
                                </span>
                              )}
                            </>
                          )}
                        </span>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500 hover:text-white hover:scale-110 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                          title={`Remove ${file.name}`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Credit Summary */}
                <div
                  className={`mt-4 p-3 rounded-lg border ${
                    creditWarning
                      ? isDark
                        ? "bg-red-900/20 border-red-700"
                        : "bg-red-50 border-red-200"
                      : isDark
                        ? "bg-green-900/20 border-green-700"
                        : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Total Credits Needed: {creditEstimate.totalCredits}
                    </span>
                    <span className="text-sm">
                      Your Balance: {creditsLoading ? "..." : credits}
                    </span>
                  </div>

                  {creditWarning ? (
                    <div
                      className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}
                    >
                      ⚠️ {creditWarning}
                    </div>
                  ) : (
                    <div
                      className={`text-sm ${isDark ? "text-green-400" : "text-green-600"}`}
                    >
                      ✅ You have enough credits to process these files
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Language Selection */}
            <div className="mb-8">
              <label
                className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Select Subtitle Language
              </label>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 appearance-none cursor-pointer ${
                    isDark
                      ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                      : "bg-white border-gray-300 text-gray-900 focus:border-purple-500"
                  }`}
                >
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.flag} {language.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {selectedFiles.length === 0 ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
                    isDark
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  Browse Files
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
                      isDark
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                    }`}
                  >
                    Add More Files
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading || !!creditWarning}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                      creditWarning
                        ? "bg-red-600 text-white"
                        : isDark
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                    }`}
                    title={creditWarning || ""}
                  >
                    {creditWarning
                      ? "Insufficient Credits"
                      : isUploading
                        ? "Processing..."
                        : "Generate Subtitles"}
                  </button>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p
                  className={`text-sm mt-2 transition-colors duration-300 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {uploadProgress}% Complete
                </p>
              </div>
            )}

            {/* Supported Formats */}
            <div className="mt-6">
              <p
                className={`text-xs transition-colors duration-300 ${
                  isDark ? "text-gray-500" : "text-gray-500"
                }`}
              >
                Supported formats:{" "}
                {UI_CONSTANTS.SUPPORTED_VIDEO_FORMATS.join(", ").toUpperCase()}
              </p>
              <p
                className={`text-xs mt-1 transition-colors duration-300 ${
                  isDark ? "text-gray-500" : "text-gray-500"
                }`}
              >
                Max file size: {formatFileSize(UI_CONSTANTS.MAX_FILE_SIZE)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoUploadSection;
