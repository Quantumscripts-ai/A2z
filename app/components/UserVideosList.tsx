"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { useUserVideos, VideoRow } from "@/hooks/useUserVideos";
import {
  toSrtFromPlainText,
  downloadFile,
  SUBTITLE_FORMATS,
  SubtitleFormat,
} from "@/lib/subtitleUtils";

interface UserVideosListProps {
  userId: string;
}

// Function to clean transcript text, removing JSON metadata
const cleanTranscript = (transcript: string | null): string => {
  if (!transcript) return "";

  try {
    // Try to parse as JSON first
    if (transcript.trim().startsWith("{") && transcript.trim().endsWith("}")) {
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

const UserVideosList = ({ userId }: UserVideosListProps) => {
  const { isDark } = useTheme();
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({});

  // Using React Query to fetch and cache videos
  const { data: videos, isLoading, refetch } = useUserVideos(userId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".dropdown-container")) {
        setDropdownOpen({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Still use Supabase realtime for live updates
  useEffect(() => {
    // Subscribe to realtime updates for this user's videos
    const channel = supabase
      .channel(`videos-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "videos",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch videos when changes occur
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  const handleToggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleDropdown = (id: string) => {
    setDropdownOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadSubtitle = (video: VideoRow, format: SubtitleFormat) => {
    if (!video.transcript) return;

    // Clean the transcript before converting
    const cleanedText = cleanTranscript(video.transcript);
    const baseName = video.filename?.replace(/\.[^/.]+$/, "") || "subtitle";

    let content: string;
    let extension: string;
    let mimeType: string;

    switch (format) {
      case "srt":
        content = toSrtFromPlainText(cleanedText);
        extension = "srt";
        mimeType = "text/srt";
        break;
      case "vtt":
        // Convert to SRT first, then parse and convert to VTT
        const srtContent = toSrtFromPlainText(cleanedText);
        content = convertSrtToVtt(srtContent);
        extension = "vtt";
        mimeType = "text/vtt";
        break;
      case "ass":
        // Convert to SRT first, then parse and convert to ASS
        const srtForAss = toSrtFromPlainText(cleanedText);
        content = convertSrtToAss(srtForAss);
        extension = "ass";
        mimeType = "text/ass";
        break;
      default:
        content = toSrtFromPlainText(cleanedText);
        extension = "srt";
        mimeType = "text/srt";
    }

    downloadFile(content, `${baseName}.${extension}`, mimeType);

    // Close dropdown after download
    setDropdownOpen((prev) => ({ ...prev, [video.id]: false }));
  };

  // Convert SRT format to VTT
  const convertSrtToVtt = (srtContent: string): string => {
    const lines = srtContent.split("\n");
    let vttContent = "WEBVTT\n\n";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip sequence numbers
      if (/^\d+$/.test(line)) {
        continue;
      }

      // Convert time format from SRT to VTT
      if (line.includes(" --> ")) {
        const vttLine = line.replace(/,/g, ".");
        vttContent += vttLine + "\n";
      } else if (line.length > 0) {
        vttContent += line + "\n";
      } else {
        vttContent += "\n";
      }
    }

    return vttContent;
  };

  // Convert SRT format to ASS
  const convertSrtToAss = (srtContent: string): string => {
    const header = `[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,16,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const lines = srtContent.split("\n");
    const events: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.includes(" --> ")) {
        const [startTime, endTime] = line.split(" --> ");
        const startAss = convertTimeToAss(startTime);
        const endAss = convertTimeToAss(endTime);

        // Get subtitle text (next non-empty line)
        let textLine = "";
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim()) {
            textLine = lines[j].trim();
            break;
          }
        }

        if (textLine) {
          events.push(
            `Dialogue: 0,${startAss},${endAss},Default,,0,0,0,,${textLine.replace(/\n/g, "\\N")}`
          );
        }
      }
    }

    return header + events.join("\n") + "\n";
  };

  // Convert SRT time format to ASS time format
  const convertTimeToAss = (srtTime: string): string => {
    const [time, ms] = srtTime.split(",");
    const [hours, minutes, seconds] = time.split(":");
    const cs = Math.floor(parseInt(ms) / 10)
      .toString()
      .padStart(2, "0");
    return `${parseInt(hours)}:${minutes}:${seconds}.${cs}`;
  };

  const handleEditSubtitles = (video: VideoRow) => {
    router.push(`/videos/${video.id}`);
  };

  if (isLoading) {
    return (
      <div
        className={`p-6 rounded-2xl border ${
          isDark ? "bg-black/50 border-gray-800" : "bg-white/50 border-gray-200"
        }`}
      >
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>
          Loading videos...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl border backdrop-blur-sm p-6 md:p-8 transition-all duration-300 ${
        isDark ? "bg-black/50 border-gray-800" : "bg-white/50 border-gray-200"
      }`}
    >
      <h3
        className={`text-xl md:text-2xl font-bold mb-4 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Your Videos
      </h3>
      {!videos || videos.length === 0 ? (
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>
          No videos yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((v) => (
            <div
              key={v.id}
              className={`overflow-hidden rounded-2xl border transition-all transform hover:scale-[1.02] hover:shadow-lg ${
                isDark
                  ? "bg-gray-900/30 border-gray-700/50"
                  : "bg-gray-50/50 border-gray-200/50"
              }`}
            >
              {/* Thumbnail section */}
              <div className="aspect-video w-full relative overflow-hidden bg-black/20">
                {/* Always use placeholder since thumbnail_url doesn't exist in database */}
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/30 to-blue-900/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={`w-16 h-16 mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  <span
                    className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {v.filename
                      ? `${v.filename.substring(0, 20)}${v.filename.length > 20 ? "..." : ""}`
                      : "Video Preview"}
                  </span>
                </div>

                {/* Status badge */}
                <span
                  className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full shadow ${
                    v.status === "completed"
                      ? isDark
                        ? "bg-green-600/80 text-white"
                        : "bg-green-100 text-green-700"
                      : v.status === "processing"
                        ? isDark
                          ? "bg-yellow-600/80 text-white"
                          : "bg-yellow-100 text-yellow-700"
                        : v.status === "uploaded"
                          ? isDark
                            ? "bg-blue-600/80 text-white"
                            : "bg-blue-100 text-blue-700"
                          : isDark
                            ? "bg-red-600/80 text-white"
                            : "bg-red-100 text-red-700"
                  }`}
                >
                  {v.status}
                </span>
              </div>

              {/* Content section */}
              <div className="p-4">
                <h4
                  className={`font-medium truncate ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                  title={v.filename || "Untitled Video"}
                >
                  {v.filename || "Untitled Video"}
                </h4>

                <p
                  className={`text-xs mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {v.created_at
                    ? new Date(v.created_at).toLocaleString()
                    : "Unknown date"}{" "}
                  • {v.language?.toUpperCase() || "EN"}
                </p>

                {/* Transcript preview */}
                <div
                  className={`mt-3 text-sm ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {v.transcript ? (
                    <>
                      <p
                        className={`${
                          expanded[v.id] ? "" : "line-clamp-2"
                        } whitespace-pre-wrap text-xs`}
                      >
                        {cleanTranscript(v.transcript)}
                      </p>
                      <button
                        onClick={() => handleToggleExpand(v.id)}
                        className="mt-1 text-xs text-purple-500 hover:text-purple-600"
                      >
                        {expanded[v.id] ? "Show less" : "Show more"}
                      </button>
                    </>
                  ) : (
                    <p
                      className={`text-xs italic ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      {v.status === "completed"
                        ? "No transcript available"
                        : v.status === "processing"
                          ? "Transcript processing..."
                          : "Waiting to process transcript"}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex items-center gap-2">
                  {v.transcript ? (
                    <>
                      <button
                        onClick={() => handleEditSubtitles(v)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex-1"
                        title="Edit Subtitles"
                      >
                        Edit
                      </button>

                      {/* Dropdown for subtitle formats */}
                      <div className="relative flex-1 dropdown-container">
                        <button
                          onClick={() => handleToggleDropdown(v.id)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition flex items-center justify-center gap-1"
                          title="Download Subtitles"
                        >
                          Download
                          <svg
                            className={`w-3 h-3 transform transition-transform ${dropdownOpen[v.id] ? "rotate-180" : ""}`}
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
                        </button>

                        {dropdownOpen[v.id] && (
                          <div
                            className={`absolute bottom-full left-0 right-0 mb-1 rounded-lg border shadow-lg z-10 ${
                              isDark
                                ? "bg-gray-800 border-gray-700"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            {SUBTITLE_FORMATS.map((format) => (
                              <button
                                key={format.value}
                                onClick={() =>
                                  handleDownloadSubtitle(v, format.value)
                                }
                                className={`w-full px-3 py-2 text-xs text-left hover:bg-opacity-10 hover:bg-purple-600 transition first:rounded-t-lg last:rounded-b-lg ${
                                  isDark
                                    ? "text-gray-200 hover:text-white"
                                    : "text-gray-700 hover:text-gray-900"
                                }`}
                                title={`Download as ${format.label}`}
                              >
                                {format.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <button
                      disabled
                      className={`px-3 py-1.5 text-xs rounded-lg w-full 
                        ${
                          isDark
                            ? "bg-gray-700 text-gray-400"
                            : "bg-gray-200 text-gray-500"
                        } 
                        cursor-not-allowed`}
                    >
                      {v.status === "processing"
                        ? "Processing..."
                        : v.status === "error"
                          ? "Error Processing"
                          : "Waiting to Process"}
                    </button>
                  )}
                </div>

                {/* View file link */}
                {/* <div className="mt-3 text-center">
                  {v.file_url ? (
                    <a
                      href={v.file_url}
                      target="_blank"
                      className="text-xs text-purple-500 hover:underline"
                    >
                      View Original File
                    </a>
                  ) : (
                    <span
                      className={`text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}
                    >
                      File not available
                    </span>
                  )}
                </div> */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserVideosList;
