"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { getVideoWithTeamAccess } from "@/lib/teamCollaboration";
import TimelineSegment from "@/app/components/TimelineSegment";
import Link from "next/link";

interface VideoData {
  id: string;
  filename: string;
  status: "uploaded" | "processing" | "completed" | "error";
  language?: string;
  file_url?: string;
  storage_path?: string;
  transcript?: string | null;
  created_at?: string;
  user_id: string;
}

interface SubtitleCue {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
  selected?: boolean;
  speaker?: number;
}

interface Speaker {
  id: number;
  name: string;
  color?: string;
}

interface UndoState {
  subtitles: SubtitleCue[];
  timestamp: number;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  const ms = Math.floor((seconds % 1) * 1000)
    .toString()
    .padStart(3, "0");
  return `${hours}:${minutes}:${secs},${ms}`;
};

// Format time for display in the UI (00:00:00)
const formatDisplayTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}:${secs}`;
};

const parseTimeToSeconds = (timeStr: string): number => {
  const [time, ms] = timeStr.split(",");
  const [hours, minutes, seconds] = time.split(":");
  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(seconds) +
    parseInt(ms) / 1000
  );
};

const parseSrtToSubtitles = (srtText: string): SubtitleCue[] => {
  const cues: SubtitleCue[] = [];
  const blocks = srtText.trim().split(/\n\s*\n/);

  blocks.forEach((block, blockIndex) => {
    const lines = block.trim().split("\n");
    if (lines.length >= 3) {
      const idLine = lines[0].trim();
      const timeLine = lines[1].trim();
      const textLines = lines.slice(2).join("\n").trim();

      // Parse ID, but fallback to sequential numbering if parsing fails
      let id = parseInt(idLine);
      if (isNaN(id)) {
        id = blockIndex + 1;
      }

      if (timeLine.includes(" --> ")) {
        try {
          const [startTime, endTime] = timeLine.split(" --> ");
          cues.push({
            id,
            startTime: parseTimeToSeconds(startTime.trim()),
            endTime: parseTimeToSeconds(endTime.trim()),
            text: textLines,
          });
        } catch (err) {
          console.error("Error parsing subtitle block:", block, err);
        }
      }
    }
  });

  // Sort by start time and ensure sequential IDs
  return cues
    .sort((a, b) => a.startTime - b.startTime)
    .map((cue, index) => ({
      ...cue,
      id: index + 1,
    }));
};

const convertPlainTextToSubtitles = (text: string): SubtitleCue[] => {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const cues: SubtitleCue[] = [];
  let currentTime = 0;

  sentences.forEach((sentence, index) => {
    const words = sentence.split(/\s+/).filter(Boolean).length;
    const duration = Math.min(8, Math.max(2, words * 0.5));
    const startTime = currentTime;
    const endTime = currentTime + duration;

    cues.push({
      id: index + 1,
      startTime,
      endTime,
      text: sentence,
    });

    currentTime = endTime + 0.2; // small gap between sentences
  });

  return cues;
};

const subtitlesToSrt = (subtitles: SubtitleCue[]): string => {
  // Sort subtitles by start time and ensure sequential IDs (don't modify original array)
  const sortedSubtitles = [...subtitles] // Create a copy first
    .sort((a, b) => a.startTime - b.startTime)
    .map((subtitle, index) => ({
      ...subtitle,
      id: index + 1, // Ensure sequential IDs starting from 1
    }));

  return sortedSubtitles
    .map(
      (cue) =>
        `${cue.id}\n${formatTime(cue.startTime)} --> ${formatTime(
          cue.endTime
        )}\n${cue.text}\n`
    )
    .join("\n");
};

// Convert subtitles to VTT format
const subtitlesToVtt = (subtitles: SubtitleCue[]): string => {
  const vttTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    const ms = Math.floor((seconds % 1) * 1000)
      .toString()
      .padStart(3, "0");
    return `${hours}:${minutes}:${secs}.${ms}`;
  };

  const header = "WEBVTT\n\n";
  const content = subtitles
    .map(
      (cue) =>
        `${cue.id}\n${vttTime(cue.startTime)} --> ${vttTime(cue.endTime)}\n${
          cue.text
        }\n`
    )
    .join("\n");

  return header + content;
};

// Convert subtitles to ASS format (Advanced SubStation Alpha)
const subtitlesToAss = (subtitles: SubtitleCue[]): string => {
  const assTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const centiseconds = Math.floor((seconds % 1) * 100);
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
  };

  const header = `[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const content = subtitles
    .map(
      (cue) =>
        `Dialogue: 0,${assTime(cue.startTime)},${assTime(
          cue.endTime
        )},Default,,0,0,0,,${cue.text.replace(/\n/g, "\\N")}`
    )
    .join("\n");

  return header + content;
};

// Download file utility
const downloadFile = (
  content: string,
  filename: string,
  contentType: string = "text/plain"
) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const VideoSubtitleEditor = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [video, setVideo] = useState<VideoData | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  // Access control state
  const [accessType, setAccessType] = useState<"owner" | "shared" | null>(null);
  const [userPermissions, setUserPermissions] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<
    "admin" | "editor" | "member" | null
  >(null);

  // Advanced editing features
  const [selectedSubtitles, setSelectedSubtitles] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [undoStack, setUndoStack] = useState<UndoState[]>([]);
  const [redoStack, setRedoStack] = useState<UndoState[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([
    { id: 0, name: "Speaker 0", color: "#4285F4" }, // Default speaker with blue color
  ]);
  const [currentSpeaker, setCurrentSpeaker] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [timelineOffset, setTimelineOffset] = useState<number>(0);
  const [activeSubtitle, setActiveSubtitle] = useState<number | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Subtitle display settings
  const [subtitleSettings, setSubtitleSettings] = useState({
    showSubtitles: true,
    fontSize: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    textColor: "#ffffff",
    position: "bottom" as "top" | "bottom" | "center",
  });

  // Timeline specific state
  const [timelineZoom, setTimelineZoom] = useState<number>(1);
  const [timelineScroll, setTimelineScroll] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSubtitle, setDraggedSubtitle] = useState<number | null>(null);

  // Helper function to check if user can edit
  const canEdit = () => {
    if (accessType === "owner") return true;
    if (
      accessType === "shared" &&
      (userRole === "admin" || userRole === "editor")
    )
      return true;
    return false;
  };

  // Helper function to check if user can save
  const canSave = () => {
    return canEdit();
  };

  // Get current active subtitle
  const getCurrentSubtitle = useCallback(() => {
    return subtitles.find(
      (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
    );
  }, [subtitles, currentTime]);

  // Function to update subtitle timing
  const updateSubtitleTiming = useCallback(
    (subtitleId: number, startTime: number, endTime: number) => {
      setSubtitles((prev) =>
        prev.map((sub) =>
          sub.id === subtitleId
            ? {
                ...sub,
                startTime: Math.max(0, startTime),
                endTime: Math.max(startTime + 0.1, endTime),
              }
            : sub
        )
      );
    },
    []
  );

  // Save state for undo
  const saveToUndoStack = () => {
    setUndoStack((prev) => [
      ...prev,
      { subtitles: [...subtitles], timestamp: Date.now() },
    ]);
    setRedoStack([]); // Clear redo stack when new action is performed
    if (undoStack.length > 50) {
      setUndoStack((prev) => prev.slice(-50)); // Keep only last 50 states
    }
  };

  const updateSubtitle = (
    id: number,
    field: keyof SubtitleCue,
    value: string | number
  ) => {
    saveToUndoStack();
    setSubtitles((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, [field]: value } : sub))
    );
  };

  const seekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Renumber all subtitles sequentially starting from 1
  const renumberSubtitles = useCallback((subtitleList: SubtitleCue[]) => {
    return subtitleList
      .sort((a, b) => a.startTime - b.startTime) // Sort by start time first
      .map((subtitle, index) => ({
        ...subtitle,
        id: index + 1, // Renumber sequentially starting from 1
      }));
  }, []);

  // Split a subtitle into two parts at the current video time
  const splitSubtitle = useCallback(
    (subtitleId: number) => {
      saveToUndoStack();

      const subtitle = subtitles.find((sub) => sub.id === subtitleId);
      if (!subtitle) return;

      // Get split time - use current video time if it's within the subtitle range
      const splitTime =
        currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
          ? currentTime
          : (subtitle.startTime + subtitle.endTime) / 2; // Default to middle

      // Smart text splitting - find natural break points
      const text = subtitle.text;
      const sentences = text.split(/([.!?]\s+)/).filter(Boolean);

      let firstText: string;
      let secondText: string;

      // If we have multiple sentences, split at sentence boundary
      if (sentences.length > 2) {
        const midPoint = Math.floor(sentences.length / 2);
        firstText = sentences.slice(0, midPoint).join("").trim();
        secondText = sentences.slice(midPoint).join("").trim();
      } else {
        // Fall back to word-based splitting
        const words = text.split(" ").filter(Boolean);
        if (words.length < 2) return; // Can't split single word

        const totalDuration = subtitle.endTime - subtitle.startTime;
        const firstPartDuration = splitTime - subtitle.startTime;
        const ratio = firstPartDuration / totalDuration;
        const splitIndex = Math.max(
          1,
          Math.min(words.length - 1, Math.floor(words.length * ratio))
        );

        firstText = words.slice(0, splitIndex).join(" ");
        secondText = words.slice(splitIndex).join(" ");
      }

      setSubtitles((prev) => {
        // Create the updated subtitle list with the split
        const updatedSubtitles = prev.map((sub) =>
          sub.id === subtitleId
            ? { ...sub, endTime: splitTime, text: firstText }
            : sub
        );

        // Add the new subtitle (second part) - we'll renumber it properly
        const newSubtitle: SubtitleCue = {
          id: subtitleId + 1, // Temporary ID, will be renumbered
          startTime: splitTime + 0.1,
          endTime: subtitle.endTime,
          text: secondText,
          speaker: subtitle.speaker,
        };

        const allSubtitles = [...updatedSubtitles, newSubtitle];

        // Renumber all subtitles to maintain sequential order
        return renumberSubtitles(allSubtitles);
      });

      // Seek to the split point for immediate feedback
      seekToTime(splitTime);
    },
    [subtitles, currentTime, saveToUndoStack, renumberSubtitles]
  );

  // Merge current subtitle with the next one
  const mergeWithNext = useCallback(
    (subtitleId: number) => {
      saveToUndoStack();

      const sortedSubtitles = subtitles.sort(
        (a, b) => a.startTime - b.startTime
      );
      const currentIndex = sortedSubtitles.findIndex(
        (sub) => sub.id === subtitleId
      );

      if (currentIndex === -1 || currentIndex === sortedSubtitles.length - 1) {
        return; // Can't merge if it's the last subtitle or not found
      }

      const currentSubtitle = sortedSubtitles[currentIndex];
      const nextSubtitle = sortedSubtitles[currentIndex + 1];

      setSubtitles((prev) => {
        const mergedSubtitles = prev
          .map((sub) =>
            sub.id === subtitleId
              ? {
                  ...sub,
                  endTime: nextSubtitle.endTime,
                  text: `${currentSubtitle.text} ${nextSubtitle.text}`,
                }
              : sub
          )
          .filter((sub) => sub.id !== nextSubtitle.id); // Remove the merged subtitle

        // Renumber all subtitles to maintain sequential order
        return renumberSubtitles(mergedSubtitles);
      });

      // Seek to the start of merged subtitle
      seekToTime(currentSubtitle.startTime);
    },
    [subtitles, saveToUndoStack, renumberSubtitles]
  );

  // Delete a subtitle
  const deleteSubtitle = useCallback(
    (subtitleId: number) => {
      saveToUndoStack();
      setSubtitles((prev) => {
        const filteredSubtitles = prev.filter((sub) => sub.id !== subtitleId);
        // Renumber remaining subtitles to maintain sequential order
        return renumberSubtitles(filteredSubtitles);
      });
    },
    [saveToUndoStack, renumberSubtitles]
  );

  // Timeline utility functions
  const zoomTimeline = useCallback((direction: "in" | "out") => {
    setTimelineZoom((prev) => {
      const newZoom =
        direction === "in"
          ? Math.min(prev * 1.5, 10)
          : Math.max(prev / 1.5, 0.1);
      return newZoom;
    });
  }, []);

  const resetTimelineZoom = useCallback(() => {
    setTimelineZoom(1);
    setTimelineScroll(0);
  }, []);

  // Jump to specific subtitle on timeline click
  const jumpToSubtitle = useCallback(
    (subtitleId: number) => {
      const subtitle = subtitles.find((sub) => sub.id === subtitleId);
      if (subtitle) {
        seekToTime(subtitle.startTime);
        setActiveSubtitle(subtitleId);

        // Scroll subtitle into view in the editor
        const subtitleElement = document.getElementById(
          `subtitle-${subtitleId}`
        );
        if (subtitleElement) {
          subtitleElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    },
    [subtitles, seekToTime]
  );

  // Media player controls
  const playPause = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const skipForward = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += 5; // Skip 5 seconds forward
  }, []);

  const skipBackward = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime -= 5; // Skip 5 seconds backward
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }

    if (user && id) {
      fetchVideoData();
    }
  }, [user, authLoading, id, router]);

  const fetchSignedVideoUrl = async (storagePath: string) => {
    try {
      setLoadingVideo(true);
      const response = await fetch("/api/storage/signed-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storagePath: storagePath,
          expiresIn: 3600, // 1 hour
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get signed URL");
      }

      const { signedUrl } = await response.json();
      setSignedVideoUrl(signedUrl);
    } catch (err) {
      console.error("Error fetching signed video URL:", err);
      setSignedVideoUrl(null);
    } finally {
      setLoadingVideo(false);
    }
  };

  // Function to clean transcript text, removing JSON metadata
  const cleanTranscript = (transcript: string | null): string => {
    if (!transcript) return "";

    try {
      // Try to parse as JSON first
      if (
        transcript.trim().startsWith("{") &&
        transcript.trim().endsWith("}")
      ) {
        const parsed = JSON.parse(transcript);
        // If it has a text field, return that
        if (parsed.text) return parsed.text;
      }

      // Otherwise, check if it contains JSON-like parts to extract text
      if (
        transcript.includes('"task":"transcribe"') ||
        transcript.includes('"language":')
      ) {
        // Look for a text field pattern in the string
        const textMatch = transcript.match(/"text"\s*:\s*"((?:\\"|[^"])*?)"/);
        if (textMatch && textMatch[1]) {
          // Unescape JSON string content
          return textMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
        }
      }

      // If no JSON extraction works, return as is
      return transcript;
    } catch (e) {
      // If any error in parsing, return the original
      return transcript;
    }
  };

  const fetchVideoData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error, accessType, permissions, userRole } =
        await getVideoWithTeamAccess(id as string, user.id);

      if (error || !data) {
        throw new Error("Video not found or access denied");
      }

      setVideo(data);
      setAccessType(accessType as "owner" | "shared");
      setUserPermissions(permissions);
      setUserRole(userRole || null);

      console.log(
        "Loaded video data from database:",
        data.transcript?.substring(0, 200) + "...",
        "Access type:",
        accessType,
        "Permissions:",
        permissions,
        "User role:",
        userRole
      ); // Debug log

      // Fetch signed URL if storage_path exists
      if (data.storage_path) {
        await fetchSignedVideoUrl(data.storage_path);
      }

      if (data.transcript) {
        // Clean the transcript first to remove any JSON metadata
        const cleanedTranscript = cleanTranscript(data.transcript);

        console.log(
          "Parsing transcript, contains ' --> ':",
          cleanedTranscript.includes(" --> ")
        );
        // Try to parse as SRT first, fallback to plain text
        if (cleanedTranscript.includes(" --> ")) {
          const parsedSubtitles = parseSrtToSubtitles(cleanedTranscript);
          console.log("Parsed", parsedSubtitles.length, "subtitles from SRT");
          setSubtitles(parsedSubtitles);
        } else {
          const convertedSubtitles =
            convertPlainTextToSubtitles(cleanedTranscript);
          console.log(
            "Converted",
            convertedSubtitles.length,
            "subtitles from plain text"
          );
          setSubtitles(convertedSubtitles);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load video");
    } finally {
      setLoading(false);
    }
  };

  // Video event handlers
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;

      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);

        // Find and set active subtitle
        const activeSubtitle = subtitles.find(
          (sub) =>
            video.currentTime >= sub.startTime &&
            video.currentTime <= sub.endTime
        );

        if (activeSubtitle) {
          setActiveSubtitle(activeSubtitle.id);
        } else {
          setActiveSubtitle(null);
        }
      };

      const handleLoadedMetadata = () => {
        setDuration(video.duration);
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);

      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);

      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
      };
    }
  }, [subtitles]);

  // Manual save function (simplified without auto-save integration)
  const handleSaveManual = useCallback(async () => {
    if (!video || subtitles.length === 0) return;

    try {
      setSaving(true);

      const srtContent = subtitlesToSrt(subtitles);

      const { error } = await supabase
        .from("videos")
        .update({ transcript: srtContent })
        .eq("id", video.id)
        .eq("user_id", user?.id);

      if (error) {
        throw new Error("Failed to save subtitles");
      }

      // Use the clean SRT content for the video object
      setVideo({ ...video, transcript: srtContent });
      alert("Subtitles saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save subtitles");
    } finally {
      setSaving(false);
    }
  }, [video, subtitles, user?.id]);

  // Download functions for different formats
  const downloadSubtitles = useCallback(
    (format: "srt" | "vtt" | "ass") => {
      if (!video || subtitles.length === 0) {
        alert("No subtitles to download!");
        return;
      }

      const baseFilename =
        video.filename?.replace(/\.[^/.]+$/, "") || "subtitles";
      let content: string;
      let extension: string;
      let contentType: string;

      switch (format) {
        case "srt":
          content = subtitlesToSrt(subtitles);
          extension = "srt";
          contentType = "text/srt";
          break;
        case "vtt":
          content = subtitlesToVtt(subtitles);
          extension = "vtt";
          contentType = "text/vtt";
          break;
        case "ass":
          content = subtitlesToAss(subtitles);
          extension = "ass";
          contentType = "text/ass";
          break;
        default:
          return;
      }

      downloadFile(content, `${baseFilename}.${extension}`, contentType);
    },
    [video, subtitles]
  );

  // Download video function
  const downloadVideo = useCallback(async () => {
    if (!signedVideoUrl || !video) {
      alert("Video not available for download!");
      return;
    }

    try {
      setLoadingVideo(true);

      // Fetch the video blob
      const response = await fetch(signedVideoUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch video");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = video.filename || "video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download video. Please try again.");
    } finally {
      setLoadingVideo(false);
    }
  }, [signedVideoUrl, video]);

  // Keyboard shortcuts for common actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (
        (e.target as HTMLElement)?.tagName === "INPUT" ||
        (e.target as HTMLElement)?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Get currently active/selected subtitle
      const activeSubtitleId = activeSubtitle;
      if (!activeSubtitleId) return;

      switch (e.key.toLowerCase()) {
        case "s":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleSaveManual();
          } else {
            e.preventDefault();
            splitSubtitle(activeSubtitleId);
          }
          break;
        case "m":
          e.preventDefault();
          mergeWithNext(activeSubtitleId);
          break;
        case "delete":
        case "backspace":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (window.confirm("Delete this subtitle?")) {
              deleteSubtitle(activeSubtitleId);
            }
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    activeSubtitle,
    handleSaveManual,
    splitSubtitle,
    mergeWithNext,
    deleteSubtitle,
  ]);

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className={`text-red-500 mb-4`}>{error}</p>
            <button
              onClick={() => router.push("/workspace")}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="flex items-center justify-center h-screen">
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            Video not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 border-b ${
          isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/workspace"
              className="text-gray-400 hover:text-gray-300"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">
                {video.filename || "Subtitle Editor"}
              </h1>
              {accessType === "shared" && (
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      userRole === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : userRole === "editor"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {userRole?.toUpperCase()} ACCESS
                  </span>
                  <span className="text-xs text-gray-500">
                    {canEdit() ? "Can edit" : "View only"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {canEdit() && (
              <button
                onClick={handleSaveManual}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            )}

            <div className="relative group">
              <button
                disabled={subtitles.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Export
              </button>

              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-300 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1 min-w-[140px]">
                  <button
                    onClick={() => downloadSubtitles("srt")}
                    className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                  >
                    SRT Format
                  </button>
                  <button
                    onClick={() => downloadSubtitles("vtt")}
                    className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                  >
                    VTT Format
                  </button>
                  <button
                    onClick={() => downloadSubtitles("ass")}
                    className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                  >
                    ASS Format
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={downloadVideo}
                    disabled={!signedVideoUrl || loadingVideo}
                    className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Video Only
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Video Player */}
        <div className="space-y-4">
          <div
            className={`relative aspect-video rounded-lg overflow-hidden ${
              isDark ? "bg-black" : "bg-gray-800"
            }`}
          >
            {signedVideoUrl && (
              <video
                ref={videoRef}
                src={signedVideoUrl}
                className="w-full h-full object-contain"
                controls={true}
                preload="metadata"
              />
            )}
          </div>

          {/* Subtitle Display */}
          {subtitleSettings.showSubtitles && (
            <div
              className={`relative min-h-[80px] p-4 rounded-lg flex items-center justify-center ${
                isDark
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-gray-100 border border-gray-200"
              }`}
            >
              {getCurrentSubtitle() ? (
                <div className="text-center">
                  <div
                    className="inline-block px-4 py-2 rounded-lg max-w-full"
                    style={{
                      backgroundColor: subtitleSettings.backgroundColor,
                      color: subtitleSettings.textColor,
                      fontSize: `${subtitleSettings.fontSize}px`,
                      lineHeight: "1.4",
                    }}
                  >
                    {getCurrentSubtitle()?.text}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {speakers.find(
                      (s) => s.id === getCurrentSubtitle()?.speaker
                    )?.name || "Unknown Speaker"}
                    {" • "}
                    {formatDisplayTime(
                      getCurrentSubtitle()?.startTime || 0
                    )} → {formatDisplayTime(getCurrentSubtitle()?.endTime || 0)}
                  </div>
                </div>
              ) : (
                <div
                  className={`text-center ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  <div className="text-sm">No subtitle at current time</div>
                  <div className="text-xs mt-1">
                    {formatDisplayTime(currentTime)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subtitle Settings */}
          <div
            className={`p-3 rounded-lg ${
              isDark
                ? "bg-gray-800 border border-gray-700"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Subtitle Display</h3>
              <button
                onClick={() =>
                  setSubtitleSettings((prev) => ({
                    ...prev,
                    showSubtitles: !prev.showSubtitles,
                  }))
                }
                className={`px-2 py-1 text-xs rounded ${
                  subtitleSettings.showSubtitles
                    ? "bg-green-600 text-white"
                    : "bg-gray-500 text-white"
                }`}
              >
                {subtitleSettings.showSubtitles ? "ON" : "OFF"}
              </button>
            </div>

            <div className="space-y-2">
              {/* Font Size */}
              <div className="flex items-center justify-between">
                <label className="text-xs">Font Size:</label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={subtitleSettings.fontSize}
                  onChange={(e) =>
                    setSubtitleSettings((prev) => ({
                      ...prev,
                      fontSize: parseInt(e.target.value),
                    }))
                  }
                  className="w-20"
                />
                <span className="text-xs w-8">
                  {subtitleSettings.fontSize}px
                </span>
              </div>

              {/* Background */}
              <div className="flex items-center justify-between">
                <label className="text-xs">Background:</label>
                <select
                  value={subtitleSettings.backgroundColor}
                  onChange={(e) =>
                    setSubtitleSettings((prev) => ({
                      ...prev,
                      backgroundColor: e.target.value,
                    }))
                  }
                  className={`text-xs px-2 py-1 rounded border ${
                    isDark
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <option value="rgba(0, 0, 0, 0.8)">Dark</option>
                  <option value="rgba(255, 255, 255, 0.9)">Light</option>
                  <option value="rgba(0, 0, 0, 0.6)">Semi-dark</option>
                  <option value="transparent">None</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Subtitle Editor */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Subtitles ({subtitles.length})
          </h2>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {subtitles
              .sort((a, b) => a.startTime - b.startTime)
              .map((subtitle) => {
                const isActive = activeSubtitle === subtitle.id;

                return (
                  <div
                    key={subtitle.id}
                    id={`subtitle-${subtitle.id}`}
                    className={`p-4 rounded-lg border transition-colors ${
                      isActive
                        ? isDark
                          ? "bg-purple-900/20 border-purple-500"
                          : "bg-purple-50 border-purple-300"
                        : isDark
                          ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                          : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        #{subtitle.id}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => seekToTime(subtitle.startTime)}
                          className="text-xs text-purple-600 hover:text-purple-700"
                        >
                          ▶ Play
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {canEdit() && (
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1">
                          {/* Split Button */}
                          <button
                            onClick={() => splitSubtitle(subtitle.id)}
                            title="Split this subtitle into two parts"
                            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
                              isDark
                                ? "bg-blue-900/20 text-blue-300 hover:bg-blue-900/30"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            }`}
                          >
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M14 6l-1 1v4l1 1h4l1-1V7l-1-1h-4zM5 6L4 7v4l1 1h4l1-1V7L9 6H5z" />
                              <path d="M12 10v4m-2-2h4" />
                            </svg>
                            <span>Split</span>
                          </button>

                          {/* Merge Button */}
                          {subtitles.findIndex((s) => s.id === subtitle.id) <
                            subtitles.length - 1 && (
                            <button
                              onClick={() => mergeWithNext(subtitle.id)}
                              title="Combine this subtitle with the next one"
                              className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
                                isDark
                                  ? "bg-green-900/20 text-green-300 hover:bg-green-900/30"
                                  : "bg-green-50 text-green-600 hover:bg-green-100"
                              }`}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M17 7H7c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM7 9h4v6H7V9zm6 0h4v6h-4V9z" />
                                <path d="M12 11v2m-1-1h2" />
                              </svg>
                              <span>Merge</span>
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this subtitle?"
                                )
                              ) {
                                deleteSubtitle(subtitle.id);
                              }
                            }}
                            title="Delete this subtitle"
                            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
                              isDark
                                ? "bg-red-900/20 text-red-300 hover:bg-red-900/30"
                                : "bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                          >
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>

                        {/* Help Text */}
                        <div className="text-xs text-gray-400">
                          💡 Tip: Position video at split point, then click
                          Split
                        </div>
                      </div>
                    )}

                    {/* Timing Controls */}
                    {canEdit() && (
                      <div className="flex items-center space-x-2 text-sm mb-2">
                        <div className="flex items-center space-x-1">
                          <label className="text-xs">Start:</label>
                          <input
                            type="text"
                            placeholder="4.5 or 00:00:04.5"
                            defaultValue={subtitle.startTime.toString()}
                            onKeyDown={(e) => {
                              // Allow numbers, colon, period, and navigation keys
                              if (
                                !/[0-9:.]/.test(e.key) &&
                                ![
                                  "Backspace",
                                  "Delete",
                                  "ArrowLeft",
                                  "ArrowRight",
                                  "Tab",
                                ].includes(e.key) &&
                                !(e.key === "a" && e.ctrlKey)
                              ) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              // Provide visual feedback while typing
                              const value = e.target.value;
                              if (
                                value.match(
                                  /^\d{1,2}:\d{1,2}:\d{1,2}(\.\d+)?$/
                                ) ||
                                !isNaN(parseFloat(value))
                              ) {
                                e.target.style.color = "#10b981"; // green for valid format
                              } else {
                                e.target.style.color = "#6b7280"; // gray while typing
                              }
                            }}
                            onBlur={(e) => {
                              const timeStr = e.target.value.trim();
                              let seconds = 0;

                              try {
                                // Parse HH:MM:SS.mmm format (more flexible)
                                if (
                                  timeStr.match(
                                    /^\d{1,2}:\d{1,2}:\d{1,2}(\.\d+)?$/
                                  )
                                ) {
                                  const [time, decimal] = timeStr.split(".");
                                  const [hours, minutes, secs] = time
                                    .split(":")
                                    .map(Number);
                                  const decimalPart = decimal
                                    ? parseFloat("0." + decimal)
                                    : 0;
                                  seconds =
                                    hours * 3600 +
                                    minutes * 60 +
                                    secs +
                                    decimalPart;
                                } else {
                                  // Fallback to direct number input (supports decimals)
                                  seconds = parseFloat(timeStr);
                                  if (isNaN(seconds)) {
                                    throw new Error("Invalid number format");
                                  }
                                }

                                if (
                                  seconds >= 0 &&
                                  seconds < subtitle.endTime
                                ) {
                                  updateSubtitleTiming(
                                    subtitle.id,
                                    seconds,
                                    subtitle.endTime
                                  );
                                  seekToTime(seconds);
                                  e.target.style.color = "";

                                  // Smart display format: if user typed direct seconds, keep that format
                                  // If they typed time format, convert to time format
                                  if (timeStr.includes(":")) {
                                    // User used time format, display as time format with proper decimals
                                    const wholeSecs = Math.floor(seconds);
                                    const decimal =
                                      Math.round((seconds - wholeSecs) * 10) /
                                      10;
                                    e.target.value =
                                      formatDisplayTime(seconds) +
                                      (decimal > 0
                                        ? "." + decimal.toString().split(".")[1]
                                        : ".0");
                                  } else {
                                    // User typed direct seconds, keep as decimal seconds
                                    e.target.value = seconds.toString();
                                  }
                                } else {
                                  throw new Error("Invalid range");
                                }
                              } catch (error) {
                                // Reset to original value if invalid
                                e.target.value = subtitle.startTime.toString();
                                e.target.style.color = "";
                                alert(
                                  `Start time must be less than end time (${subtitle.endTime}s)`
                                );
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            className={`w-24 px-2 py-1 text-xs rounded border text-center font-mono ${
                              isDark
                                ? "bg-gray-700 border-gray-600 text-white focus:border-purple-500"
                                : "bg-white border-gray-300 focus:border-purple-500"
                            } focus:ring-1 focus:ring-purple-500 focus:outline-none`}
                          />
                        </div>

                        <span>→</span>

                        <div className="flex items-center space-x-1">
                          <label className="text-xs">End:</label>
                          <input
                            type="text"
                            placeholder="5.0 or 00:00:05.0"
                            defaultValue={subtitle.endTime.toString()}
                            onKeyDown={(e) => {
                              // Allow numbers, colon, period, and navigation keys
                              if (
                                !/[0-9:.]/.test(e.key) &&
                                ![
                                  "Backspace",
                                  "Delete",
                                  "ArrowLeft",
                                  "ArrowRight",
                                  "Tab",
                                ].includes(e.key) &&
                                !(e.key === "a" && e.ctrlKey)
                              ) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              // Provide visual feedback while typing
                              const value = e.target.value;
                              if (
                                value.match(
                                  /^\d{1,2}:\d{1,2}:\d{1,2}(\.\d+)?$/
                                ) ||
                                !isNaN(parseFloat(value))
                              ) {
                                e.target.style.color = "#10b981"; // green for valid format
                              } else {
                                e.target.style.color = "#6b7280"; // gray while typing
                              }
                            }}
                            onBlur={(e) => {
                              const timeStr = e.target.value.trim();
                              let seconds = 0;

                              try {
                                // Parse HH:MM:SS.mmm format (more flexible)
                                if (
                                  timeStr.match(
                                    /^\d{1,2}:\d{1,2}:\d{1,2}(\.\d+)?$/
                                  )
                                ) {
                                  const [time, decimal] = timeStr.split(".");
                                  const [hours, minutes, secs] = time
                                    .split(":")
                                    .map(Number);
                                  const decimalPart = decimal
                                    ? parseFloat("0." + decimal)
                                    : 0;
                                  seconds =
                                    hours * 3600 +
                                    minutes * 60 +
                                    secs +
                                    decimalPart;
                                } else {
                                  // Fallback to direct number input (supports decimals)
                                  seconds = parseFloat(timeStr);
                                  if (isNaN(seconds)) {
                                    throw new Error("Invalid number format");
                                  }
                                }

                                const minEndTime = subtitle.startTime + 0.1;
                                const maxEndTime = duration || 999;

                                if (
                                  seconds >= minEndTime &&
                                  seconds <= maxEndTime
                                ) {
                                  updateSubtitleTiming(
                                    subtitle.id,
                                    subtitle.startTime,
                                    seconds
                                  );
                                  seekToTime(seconds);
                                  e.target.style.color = "";

                                  // Smart display format: if user typed direct seconds, keep that format
                                  // If they typed time format, convert to time format
                                  if (timeStr.includes(":")) {
                                    // User used time format, display as time format with proper decimals
                                    const wholeSecs = Math.floor(seconds);
                                    const decimal =
                                      Math.round((seconds - wholeSecs) * 10) /
                                      10;
                                    e.target.value =
                                      formatDisplayTime(seconds) +
                                      (decimal > 0
                                        ? "." + decimal.toString().split(".")[1]
                                        : ".0");
                                  } else {
                                    // User typed direct seconds, keep as decimal seconds
                                    e.target.value = seconds.toString();
                                  }
                                } else {
                                  throw new Error("Invalid range");
                                }
                              } catch (error) {
                                // Reset to original value if invalid
                                e.target.value = subtitle.endTime.toString();
                                e.target.style.color = "";
                                alert(
                                  `End time must be between ${
                                    subtitle.startTime + 0.1
                                  }s and ${duration || 999}s`
                                );
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            className={`w-24 px-2 py-1 text-xs rounded border text-center font-mono ${
                              isDark
                                ? "bg-gray-700 border-gray-600 text-white focus:border-purple-500"
                                : "bg-white border-gray-300 focus:border-purple-500"
                            } focus:ring-1 focus:ring-purple-500 focus:outline-none`}
                          />
                        </div>

                        <span className="text-xs">
                          (
                          {Math.round(
                            (subtitle.endTime - subtitle.startTime) * 10
                          ) / 10}
                          s)
                        </span>
                      </div>
                    )}

                    {/* Subtitle Text */}
                    <textarea
                      value={subtitle.text}
                      onChange={
                        canEdit()
                          ? (e) =>
                              updateSubtitle(
                                subtitle.id,
                                "text",
                                e.target.value
                              )
                          : undefined
                      }
                      readOnly={!canEdit()}
                      className={`w-full rounded p-2 min-h-[60px] ${
                        isDark
                          ? "bg-gray-700 text-white border border-gray-600 focus:border-purple-500"
                          : "bg-gray-50 text-gray-900 border border-gray-300 focus:border-purple-500"
                      } focus:ring-1 focus:ring-purple-500 focus:outline-none`}
                    />
                  </div>
                );
              })}
          </div>

          {/* Dual Timeline */}
          <div
            className={`p-4 rounded-lg border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center space-x-2">
                <span>🎬</span>
                <span>Timeline</span>
              </h3>

              {/* Timeline Controls */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => zoomTimeline("out")}
                    className={`p-1 rounded text-xs ${
                      isDark
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    title="Zoom Out"
                  >
                    🔍−
                  </button>
                  <span className="text-xs text-gray-500 min-w-[40px] text-center">
                    {Math.round(timelineZoom * 100)}%
                  </span>
                  <button
                    onClick={() => zoomTimeline("in")}
                    className={`p-1 rounded text-xs ${
                      isDark
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    title="Zoom In"
                  >
                    🔍+
                  </button>
                  <button
                    onClick={resetTimelineZoom}
                    className={`p-1 px-2 rounded text-xs ${
                      isDark
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    title="Reset Zoom"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Video Timeline */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Video Progress
                  </label>
                  <span className="text-xs text-gray-500">
                    {formatDisplayTime(currentTime)} /{" "}
                    {formatDisplayTime(duration)}
                  </span>
                </div>

                {/* Video Progress Bar */}
                <div
                  className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden cursor-pointer group"
                  onClick={(e) => {
                    if (!duration) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const clickPercent = Math.max(
                      0,
                      Math.min(1, clickX / rect.width)
                    );
                    const newTime = clickPercent * duration;
                    console.log("Timeline click:", {
                      clickX,
                      width: rect.width,
                      clickPercent,
                      newTime,
                      duration,
                    });
                    seekToTime(newTime);
                  }}
                  onMouseMove={(e) => {
                    if (!duration) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const hoverX = e.clientX - rect.left;
                    const hoverPercent = Math.max(
                      0,
                      Math.min(1, hoverX / rect.width)
                    );
                    const hoverTime = hoverPercent * duration;

                    // Update hover indicator position and time
                    const hoverIndicator = e.currentTarget.querySelector(
                      ".hover-time-indicator"
                    ) as HTMLElement;
                    const hoverText = e.currentTarget.querySelector(
                      ".hover-time-text"
                    ) as HTMLElement;

                    if (hoverIndicator) {
                      hoverIndicator.style.left = `${hoverPercent * 100}%`;
                    }
                    if (hoverText) {
                      hoverText.style.left = `${hoverPercent * 100}%`;
                      hoverText.textContent = formatDisplayTime(hoverTime);
                    }
                  }}
                >
                  {/* Background track */}
                  <div className="absolute inset-0 bg-gray-300 dark:bg-gray-600"></div>

                  {/* Progress fill */}
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-150"
                    style={{
                      width:
                        duration > 0
                          ? `${(currentTime / duration) * 100}%`
                          : "0%",
                    }}
                  ></div>

                  {/* Current time indicator (always visible) */}
                  <div
                    className="absolute top-1/2 w-3 h-3 bg-white border-2 border-purple-500 rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 z-10"
                    style={{
                      left:
                        duration > 0
                          ? `${(currentTime / duration) * 100}%`
                          : "0%",
                    }}
                  ></div>

                  {/* Hover time indicator */}
                  <div
                    className="hover-time-indicator absolute top-1/2 w-4 h-4 bg-yellow-400 border-2 border-yellow-600 rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
                    style={{ left: "0%" }}
                  ></div>

                  {/* Hover time text */}
                  <div
                    className="hover-time-text absolute -top-8 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transform -translate-x-1/2 z-20"
                    style={{ left: "0%" }}
                  >
                    0:00:00
                  </div>
                </div>
              </div>

              {/* Subtitle Timeline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Subtitles ({subtitles.length})
                  </label>
                  <div className="text-xs text-gray-500">
                    Click blocks to jump • Hover for details
                  </div>
                </div>

                {/* Subtitle Blocks Timeline */}
                <div className="relative h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border">
                  {/* Time markers */}
                  <div className="absolute inset-x-0 top-0 h-full">
                    {Array.from(
                      { length: Math.ceil(duration / (30 / timelineZoom)) },
                      (_, i) => {
                        const timeStep = 30 / timelineZoom;
                        const timeValue = i * timeStep;
                        if (timeValue > duration) return null;

                        return (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"
                            style={{
                              left:
                                duration > 0
                                  ? `${(timeValue / duration) * 100}%`
                                  : "0%",
                            }}
                          >
                            <span className="absolute -top-5 text-xs text-gray-400 transform -translate-x-1/2 whitespace-nowrap">
                              {formatDisplayTime(timeValue)}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {/* Subtitle blocks */}
                  {subtitles.map((subtitle, index) => {
                    const startPercent =
                      duration > 0 ? (subtitle.startTime / duration) * 100 : 0;
                    const widthPercent =
                      duration > 0
                        ? ((subtitle.endTime - subtitle.startTime) / duration) *
                          100
                        : 0;
                    const isActive = activeSubtitle === subtitle.id;
                    const speakerColor =
                      speakers.find((s) => s.id === subtitle.speaker)?.color ||
                      "#4285F4";

                    return (
                      <div
                        key={subtitle.id}
                        className={`absolute top-2 bottom-2 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 hover:scale-y-110 group border-2 ${
                          isActive
                            ? "ring-2 ring-yellow-400 ring-opacity-80 z-10 border-white"
                            : "border-transparent hover:border-white/50"
                        }`}
                        style={{
                          left: `${startPercent}%`,
                          width: `${Math.max(
                            widthPercent * timelineZoom,
                            0.8
                          )}%`,
                          backgroundColor: isActive
                            ? speakerColor
                            : `${speakerColor}90`,
                          minWidth: "3px",
                        }}
                        onClick={() => jumpToSubtitle(subtitle.id)}
                        title={`#${subtitle.id} (${formatDisplayTime(
                          subtitle.startTime
                        )} - ${formatDisplayTime(
                          subtitle.endTime
                        )}): ${subtitle.text.substring(0, 100)}${
                          subtitle.text.length > 100 ? "..." : ""
                        }`}
                      >
                        {/* Subtitle number indicator */}
                        {widthPercent * timelineZoom > 4 && (
                          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow-lg">
                            #{subtitle.id}
                          </div>
                        )}

                        {/* Hover tooltip */}
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                          #{subtitle.id}: {subtitle.text.substring(0, 30)}...
                        </div>
                      </div>
                    );
                  })}

                  {/* Current time indicator on subtitle timeline */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none shadow-lg"
                    style={{
                      left:
                        duration > 0
                          ? `${(currentTime / duration) * 100}%`
                          : "0%",
                    }}
                  >
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-red-500"></div>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-red-500"></div>
                  </div>
                </div>
              </div>

              {/* Timeline Navigation Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => seekToTime(Math.max(0, currentTime - 10))}
                    className={`flex items-center space-x-1 px-3 py-1 text-xs rounded ${
                      isDark
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <span>⏪</span>
                    <span>-10s</span>
                  </button>
                  <button
                    onClick={() => seekToTime(Math.max(0, currentTime - 1))}
                    className={`flex items-center space-x-1 px-2 py-1 text-xs rounded ${
                      isDark
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <span>⏮</span>
                    <span>-1s</span>
                  </button>
                  <button
                    onClick={() =>
                      seekToTime(Math.min(duration, currentTime + 1))
                    }
                    className={`flex items-center space-x-1 px-2 py-1 text-xs rounded ${
                      isDark
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <span>+1s</span>
                    <span>⏭</span>
                  </button>
                  <button
                    onClick={() =>
                      seekToTime(Math.min(duration, currentTime + 10))
                    }
                    className={`flex items-center space-x-1 px-3 py-1 text-xs rounded ${
                      isDark
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <span>+10s</span>
                    <span>⏩</span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-xs text-gray-500">
                    💡 Use scroll wheel on timeline for precision
                  </div>
                  <div className="text-xs text-gray-400">
                    Active: {activeSubtitle ? `#${activeSubtitle}` : "None"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSubtitleEditor;
