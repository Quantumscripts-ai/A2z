import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const batchId = url.searchParams.get("batchId");
    const userId = url.searchParams.get("userId");

    if (!batchId && !userId) {
      return NextResponse.json(
        { error: "Missing batchId or userId" },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("videos")
      .select("*")
      .order("queue_position", { ascending: true });

    if (batchId) {
      query = query.eq("batch_id", batchId);
    } else if (userId) {
      query = query.eq("user_id", userId).not("batch_id", "is", null);
    }

    const { data: videos, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch queue status" },
        { status: 500 }
      );
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No videos found in queue",
        batches: [],
      });
    }

    // Group videos by batch
    interface BatchAccumulator {
      [key: string]: {
        batch_id: string;
        user_id: string;
        batch_status: string;
        created_at: string;
        videos: Array<{
          id: string;
          filename: string;
          status: string;
          queue_position: number;
          language: string;
          created_at: string;
        }>;
        total_videos: number;
        completed_videos: number;
        processing_videos: number;
        failed_videos: number;
        pending_videos: number;
      };
    }

    const batches = videos.reduce((acc: BatchAccumulator, video) => {
      const batchId = video.batch_id;
      if (!acc[batchId]) {
        acc[batchId] = {
          batch_id: batchId,
          user_id: video.user_id,
          batch_status: video.batch_status,
          created_at: video.added_to_queue_at || video.created_at,
          videos: [],
          total_videos: 0,
          completed_videos: 0,
          processing_videos: 0,
          failed_videos: 0,
          pending_videos: 0,
        };
      }

      acc[batchId].videos.push({
        id: video.id,
        filename: video.filename,
        status: video.status,
        queue_position: video.queue_position,
        language: video.language,
        created_at: video.created_at,
      });

      acc[batchId].total_videos++;

      switch (video.status) {
        case "completed":
          acc[batchId].completed_videos++;
          break;
        case "processing":
          acc[batchId].processing_videos++;
          break;
        case "error":
          acc[batchId].failed_videos++;
          break;
        case "uploaded":
          acc[batchId].pending_videos++;
          break;
      }

      return acc;
    }, {});

    // Convert to array and calculate progress
    const batchArray = Object.values(batches).map((batch) => ({
      ...batch,
      progress: Math.round((batch.completed_videos / batch.total_videos) * 100),
      isComplete:
        batch.completed_videos + batch.failed_videos === batch.total_videos,
      currentlyProcessing:
        batch.videos.find((v) => v.status === "processing")?.filename || null,
    }));

    return NextResponse.json({
      success: true,
      batches: batchArray,
      totalBatches: batchArray.length,
    });
  } catch (error: unknown) {
    console.error("Queue status error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST endpoint to trigger batch processing
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batchId, action } = body;

    if (!batchId) {
      return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
    }

    if (action === "start") {
      // Start processing the batch by calling process endpoint
      const processResponse = await fetch(
        `${req.nextUrl.origin}/api/queue/process`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ batchId }),
        }
      );

      const processResult = await processResponse.json();

      if (!processResponse.ok) {
        return NextResponse.json(processResult, {
          status: processResponse.status,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Batch processing started",
        ...processResult,
      });
    }

    if (action === "cancel") {
      // Cancel pending videos in the batch
      const { error } = await supabaseAdmin
        .from("videos")
        .update({
          status: "error",
          batch_status: "error",
          transcript: JSON.stringify({ error: "Cancelled by user" }),
        })
        .eq("batch_id", batchId)
        .eq("status", "uploaded");

      if (error) {
        return NextResponse.json(
          { error: "Failed to cancel batch" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Batch cancelled successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'start' or 'cancel'" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Queue action error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
