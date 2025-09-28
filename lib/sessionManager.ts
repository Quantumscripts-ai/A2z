// Session-based editing system for real-time subtitle editing
import { supabase } from "@/lib/supabase";
import { SubtitleCue } from "./types";

export interface EditingSession {
  id: string;
  video_id: string;
  user_id: string;
  session_data: {
    subtitles: SubtitleCue[];
    last_change_type: "text" | "timing" | "speaker" | "structure";
    change_count: number;
    version: number;
  };
  last_modified: string;
  is_active: boolean;
  created_at: string;
}

export class SessionManager {
  private sessionId: string | null = null;
  private videoId: string;
  private userId: string;
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly SAVE_DELAY = 1500; // 1.5 seconds - faster than before
  private memorySession: SubtitleCue[] = []; // Fallback for when DB table doesn't exist
  private isMemoryOnly: boolean = false;

  constructor(videoId: string, userId: string) {
    this.videoId = videoId;
    this.userId = userId;
  }

  // Initialize or resume editing session
  async initializeSession(): Promise<EditingSession | null> {
    try {
      console.log("Initializing editing session...");

      // First try to find existing active session
      const { data: existingSession, error } = await supabase
        .from("editing_sessions")
        .select("*")
        .eq("video_id", this.videoId)
        .eq("user_id", this.userId)
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        // If table doesn't exist, we'll fallback to memory-only session
        if (
          error.message?.includes('relation "editing_sessions" does not exist')
        ) {
          console.log("Session table not found, using memory-only session");
          this.sessionId = "memory-session";
          this.isMemoryOnly = true;
          return {
            id: "memory-session",
            video_id: this.videoId,
            user_id: this.userId,
            session_data: {
              subtitles: [],
              last_change_type: "text",
              change_count: 0,
              version: 1,
            },
            last_modified: new Date().toISOString(),
            is_active: true,
            created_at: new Date().toISOString(),
          };
        }
        throw error;
      }

      if (existingSession) {
        console.log("Resuming existing session:", existingSession.id);
        this.sessionId = existingSession.id;
        return existingSession;
      }

      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from("editing_sessions")
        .insert({
          video_id: this.videoId,
          user_id: this.userId,
          session_data: {
            subtitles: [],
            last_change_type: "text",
            change_count: 0,
            version: 1,
          },
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      console.log("Created new session:", newSession.id);
      this.sessionId = newSession.id;
      return newSession;
    } catch (err) {
      console.error("Session initialization error:", err);
      return null;
    }
  }

  // Save subtitles to session (debounced)
  saveToSession(
    subtitles: SubtitleCue[],
    changeType: "text" | "timing" | "speaker" | "structure" = "text"
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Clear existing timeout
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }

      // For memory-only mode, just store in memory immediately
      if (this.isMemoryOnly) {
        this.memorySession = [...subtitles];
        console.log(
          `Memory session updated with ${subtitles.length} subtitles`
        );
        resolve();
        return;
      }

      // Set new timeout for database save
      this.saveTimeout = setTimeout(async () => {
        try {
          await this.saveToSessionImmediate(subtitles, changeType);
          resolve();
        } catch (err) {
          reject(err);
        }
      }, this.SAVE_DELAY);
    });
  }

  // Immediate save to session
  async saveToSessionImmediate(
    subtitles: SubtitleCue[],
    changeType: "text" | "timing" | "speaker" | "structure" = "text"
  ): Promise<void> {
    if (!this.sessionId) {
      throw new Error("No active session");
    }

    // Handle memory-only mode
    if (this.isMemoryOnly) {
      this.memorySession = [...subtitles];
      console.log(
        `Memory session updated immediately with ${subtitles.length} subtitles`
      );
      return;
    }

    try {
      console.log(
        `Saving ${subtitles.length} subtitles to session (${changeType} change)`
      );

      const { error } = await supabase
        .from("editing_sessions")
        .update({
          session_data: {
            subtitles,
            last_change_type: changeType,
            change_count: subtitles.length,
            version: Date.now(), // Use timestamp as version
          },
        })
        .eq("id", this.sessionId);

      if (error) {
        throw error;
      }

      console.log("Session save successful");
    } catch (err) {
      console.error("Session save error:", err);
      throw err;
    }
  }

  // Load subtitles from session
  async loadFromSession(): Promise<SubtitleCue[]> {
    if (!this.sessionId) {
      return [];
    }

    // Handle memory-only mode
    if (this.isMemoryOnly) {
      console.log(
        `Loading ${this.memorySession.length} subtitles from memory session`
      );
      return [...this.memorySession];
    }

    try {
      const { data, error } = await supabase
        .from("editing_sessions")
        .select("session_data")
        .eq("id", this.sessionId)
        .single();

      if (error) {
        throw error;
      }

      return data.session_data?.subtitles || [];
    } catch (err) {
      console.error("Session load error:", err);
      return [];
    }
  }

  // Persist session to main video table (final save)
  async persistToVideo(): Promise<void> {
    if (!this.sessionId) {
      throw new Error("No active session");
    }

    try {
      console.log("Persisting session to main video table...");

      let subtitles: SubtitleCue[] = [];

      if (this.isMemoryOnly) {
        subtitles = [...this.memorySession];
      } else {
        // Get session data from database
        const { data: session, error: sessionError } = await supabase
          .from("editing_sessions")
          .select("session_data")
          .eq("id", this.sessionId)
          .single();

        if (sessionError) {
          throw sessionError;
        }

        subtitles = session.session_data?.subtitles || [];
      }

      // Convert to SRT
      const srtContent = this.subtitlesToSrt(subtitles);

      // Save to main videos table
      const { error: updateError } = await supabase
        .from("videos")
        .update({ transcript: srtContent })
        .eq("id", this.videoId)
        .eq("user_id", this.userId);

      if (updateError) {
        throw updateError;
      }

      console.log("Session persisted to main video table successfully");
    } catch (err) {
      console.error("Session persist error:", err);
      throw err;
    }
  }

  // Close session
  async closeSession(): Promise<void> {
    if (!this.sessionId) {
      return;
    }

    try {
      // First persist the session
      await this.persistToVideo();

      // Mark session as inactive
      const { error } = await supabase
        .from("editing_sessions")
        .update({ is_active: false })
        .eq("id", this.sessionId);

      if (error) {
        console.error("Session close error:", error);
      } else {
        console.log("Session closed successfully");
      }

      this.sessionId = null;
    } catch (err) {
      console.error("Session close error:", err);
    }
  }

  // Convert subtitles to SRT format
  private subtitlesToSrt(subtitles: SubtitleCue[]): string {
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

    const sortedSubtitles = [...subtitles]
      .sort((a, b) => a.startTime - b.startTime)
      .map((subtitle, index) => ({
        ...subtitle,
        id: index + 1,
      }));

    return sortedSubtitles
      .map(
        (cue) =>
          `${cue.id}\n${formatTime(cue.startTime)} --> ${formatTime(
            cue.endTime
          )}\n${cue.text}\n`
      )
      .join("\n");
  }

  // Cleanup - call this when component unmounts
  cleanup(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }
}

// Export utility functions
export const createSessionManager = (videoId: string, userId: string) => {
  return new SessionManager(videoId, userId);
};
