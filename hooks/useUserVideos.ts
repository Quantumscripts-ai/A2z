"use client";

import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export interface VideoRow {
  id: string;
  user_id: string;
  filename: string;
  storage_path: string | null;
  file_url: string | null;
  language: string;
  transcript: string | null;
  status: "uploaded" | "processing" | "completed" | "error";
  created_at: string;
  subtitles_json: any | null;
  batch_id: string | null;
  queue_position: number | null;
  batch_status: "pending" | "processing" | "completed" | "error";
  added_to_queue_at: string | null;
}

export const useUserVideos = (userId: string) => {
  const fetchVideos = async (): Promise<VideoRow[]> => {
    const { data, error } = await supabase
      .from("videos")
      .select(
        `
        id,
        user_id,
        filename,
        storage_path,
        file_url,
        language,
        transcript,
        status,
        created_at,
        subtitles_json,
        batch_id,
        queue_position,
        batch_status,
        added_to_queue_at
      `
      )
      .eq("user_id", userId)
      // Fetch videos that are either completed or in progress
      .in("status", ["uploaded", "processing", "completed"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
      throw new Error(error.message);
    }

    return data as VideoRow[];
  };
  return useQuery({
    queryKey: ["userVideos", userId],
    queryFn: fetchVideos,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
