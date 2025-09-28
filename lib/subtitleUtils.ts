import { SubtitleCue } from "@/lib/types";

// Format time for SRT (SubRip) format: HH:MM:SS,mmm
const formatSrtTime = (seconds: number): string => {
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

// Format time for VTT (WebVTT) format: HH:MM:SS.mmm
const formatVttTime = (seconds: number): string => {
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

// Format time for ASS (Advanced SubStation Alpha) format: H:MM:SS.cc
const formatAssTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600).toString();
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  const cs = Math.floor((seconds % 1) * 100)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}:${secs}.${cs}`;
};

// Convert subtitles to SRT format
export const subtitlesToSrt = (subtitles: SubtitleCue[]): string => {
  if (!subtitles || subtitles.length === 0) return "";

  const sortedSubtitles = [...subtitles]
    .sort((a, b) => a.startTime - b.startTime)
    .map((subtitle, index) => ({
      ...subtitle,
      id: index + 1,
    }));

  return sortedSubtitles
    .map(
      (cue) =>
        `${cue.id}\n${formatSrtTime(cue.startTime)} --> ${formatSrtTime(
          cue.endTime
        )}\n${cue.text}\n`
    )
    .join("\n");
};

// Convert subtitles to VTT format
export const subtitlesToVtt = (subtitles: SubtitleCue[]): string => {
  if (!subtitles || subtitles.length === 0) return "";

  const sortedSubtitles = [...subtitles].sort(
    (a, b) => a.startTime - b.startTime
  );

  const header = "WEBVTT\n\n";
  const content = sortedSubtitles
    .map(
      (cue, index) =>
        `${index + 1}\n${formatVttTime(cue.startTime)} --> ${formatVttTime(
          cue.endTime
        )}\n${cue.text}\n`
    )
    .join("\n");

  return header + content;
};

// Convert subtitles to ASS format
export const subtitlesToAss = (subtitles: SubtitleCue[]): string => {
  if (!subtitles || subtitles.length === 0) return "";

  const sortedSubtitles = [...subtitles].sort(
    (a, b) => a.startTime - b.startTime
  );

  const header = `[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,16,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = sortedSubtitles
    .map(
      (cue) =>
        `Dialogue: 0,${formatAssTime(cue.startTime)},${formatAssTime(
          cue.endTime
        )},Default,,0,0,0,,${cue.text.replace(/\n/g, "\\N")}`
    )
    .join("\n");

  return header + events + "\n";
};

// Convert plain text transcript to SRT (for backward compatibility)
export const toSrtFromPlainText = (transcript: string): string => {
  if (!transcript) return "";

  // Split text into sentences or chunks
  const sentences = transcript
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const avgSecondsPerSentence = 3; // Default duration per sentence

  const subtitles: SubtitleCue[] = sentences.map((text, index) => {
    const startTime = index * avgSecondsPerSentence;
    const endTime = startTime + Math.max(2, text.length / 10); // At least 2 seconds

    return {
      id: index + 1,
      startTime,
      endTime,
      text: text + ".",
    };
  });

  return subtitlesToSrt(subtitles);
};

// Download file utility
export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string = "text/plain"
): void => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Supported subtitle formats
export const SUBTITLE_FORMATS = [
  { value: "srt", label: "SRT (SubRip)", mimeType: "text/srt" },
  { value: "vtt", label: "VTT (WebVTT)", mimeType: "text/vtt" },
  { value: "ass", label: "ASS (Advanced SSA)", mimeType: "text/ass" },
] as const;

export type SubtitleFormat = (typeof SUBTITLE_FORMATS)[number]["value"];
