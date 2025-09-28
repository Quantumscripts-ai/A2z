import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    // Get all batches that have pending videos to process
    const { data: pendingBatches, error: batchError } = await supabaseAdmin
      .from("videos")
      .select("batch_id, batch_status")
      .eq("status", "uploaded")
      .not("batch_id", "is", null)
      .order("added_to_queue_at", { ascending: true });

    if (batchError) {
      return NextResponse.json(
        { error: "Failed to fetch pending batches" },
        { status: 500 }
      );
    }

    if (!pendingBatches || pendingBatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending videos to process",
        processed: 0,
      });
    }

    // Get unique batch IDs
    const uniqueBatchIds = [...new Set(pendingBatches.map((b) => b.batch_id))];
    let processedCount = 0;
    const results = [];

    for (const batchId of uniqueBatchIds) {
      try {
        // Process one video from this batch
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

        if (processResponse.ok) {
          processedCount++;
          results.push({
            batchId,
            success: true,
            message: processResult.message || "Processed successfully",
          });
        } else {
          results.push({
            batchId,
            success: false,
            error: processResult.error || "Processing failed",
          });
        }
      } catch (error: unknown) {
        results.push({
          batchId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Add a small delay between processing videos to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} videos from ${uniqueBatchIds.length} batches`,
      processed: processedCount,
      results,
    });
  } catch (error: unknown) {
    console.error("Auto-process error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Health check endpoint
    const { data: queueStats, error } = await supabaseAdmin
      .from("videos")
      .select("status, batch_status")
      .not("batch_id", "is", null);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch queue statistics" },
        { status: 500 }
      );
    }

    const stats =
      queueStats?.reduce((acc: Record<string, number>, video) => {
        acc[video.status] = (acc[video.status] || 0) + 1;
        return acc;
      }, {}) || {};

    return NextResponse.json({
      success: true,
      queue_stats: stats,
      total_queued_videos: queueStats?.length || 0,
    });
  } catch (error: unknown) {
    console.error("Queue stats error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
