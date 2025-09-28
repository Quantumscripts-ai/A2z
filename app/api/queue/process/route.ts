import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CreditManager } from "@/lib/creditManager";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batchId } = body;

    if (!batchId) {
      return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
    }

    // Get the next video to process from the batch
    const { data: nextVideo, error: fetchError } = await supabaseAdmin
      .from("videos")
      .select("*")
      .eq("batch_id", batchId)
      .eq("status", "uploaded")
      .order("queue_position", { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !nextVideo) {
      // Check if all videos in batch are completed
      const { data: batchVideos, error: batchError } = await supabaseAdmin
        .from("videos")
        .select("status")
        .eq("batch_id", batchId);

      if (!batchError && batchVideos) {
        const allCompleted = batchVideos.every(
          (v) => v.status === "completed" || v.status === "error"
        );

        if (allCompleted) {
          // Update batch status to completed
          await supabaseAdmin
            .from("videos")
            .update({ batch_status: "completed" })
            .eq("batch_id", batchId);

          return NextResponse.json({
            success: true,
            message: "All videos in batch processed",
            batchComplete: true,
          });
        }
      }

      return NextResponse.json(
        { error: "No videos to process in queue" },
        { status: 404 }
      );
    }

    // Mark video as processing
    const { error: updateError } = await supabaseAdmin
      .from("videos")
      .update({
        status: "processing",
        batch_status: "processing",
      })
      .eq("id", nextVideo.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update video status" },
        { status: 500 }
      );
    }

    try {
      // Calculate credits needed based on video duration
      const videoDurationMinutes = nextVideo.duration
        ? nextVideo.duration / 60
        : 5; // Default to 5 minutes if duration not available
      const creditsNeeded =
        CreditManager.calculateVideoCredits(videoDurationMinutes);

      // Check if user has sufficient credits
      const userCredits = await CreditManager.getUserCredits(nextVideo.user_id);
      if (userCredits < creditsNeeded) {
        // Mark video as error due to insufficient credits
        await supabaseAdmin
          .from("videos")
          .update({
            status: "error",
            transcript: JSON.stringify({
              error: `Insufficient credits. Need ${creditsNeeded} credits but only have ${userCredits}.`,
              credits_needed: creditsNeeded,
              credits_available: userCredits,
            }),
          })
          .eq("id", nextVideo.id);

        return NextResponse.json(
          {
            error: `Insufficient credits for video ${nextVideo.filename}`,
            credits_available: userCredits,
            credits_needed: creditsNeeded,
            videoId: nextVideo.id,
          },
          { status: 402 }
        );
      }

      // Download the file from storage for transcription
      const { data: fileData, error: downloadError } =
        await supabaseAdmin.storage
          .from("videos")
          .download(nextVideo.storage_path);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download file: ${downloadError?.message}`);
      }

      // Initialize OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Convert blob to buffer for OpenAI
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create a File-like object for OpenAI
      const file = new File([buffer], nextVideo.filename, {
        type: "video/mp4", // Default type, could be improved
      });

      // Transcribe the video
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        language: nextVideo.language || "en",
        response_format: "verbose_json",
        timestamp_granularities: ["segment"],
      });

      // Deduct credits after successful transcription
      const creditResult = await CreditManager.deductCredits(
        nextVideo.user_id,
        creditsNeeded,
        "video_generation",
        {
          video_id: nextVideo.id,
          filename: nextVideo.filename,
          duration_minutes: videoDurationMinutes,
          language: nextVideo.language || "en",
          batch_id: batchId,
        }
      );

      if (!creditResult.success) {
        console.error("Failed to deduct credits:", creditResult.message);
        // Continue with the operation but log the error
      }

      // Update video with transcription results
      const { error: transcriptionUpdateError } = await supabaseAdmin
        .from("videos")
        .update({
          status: "completed",
          transcript: JSON.stringify(transcription),
        })
        .eq("id", nextVideo.id);

      if (transcriptionUpdateError) {
        console.error(
          "Failed to save transcription:",
          transcriptionUpdateError
        );

        // If video update fails but credits were deducted, refund the credits
        if (creditResult.success) {
          try {
            await CreditManager.addCredits(
              nextVideo.user_id,
              creditsNeeded,
              "refund",
              {
                reason: "video_update_failed",
                video_id: nextVideo.id,
                original_amount: creditsNeeded,
              }
            );
          } catch (refundError) {
            console.error("Failed to refund credits:", refundError);
          }
        }

        throw new Error("Failed to save transcription");
      }

      return NextResponse.json({
        success: true,
        message: `Successfully processed ${nextVideo.filename}`,
        videoId: nextVideo.id,
        queuePosition: nextVideo.queue_position,
        credits_deducted: creditsNeeded,
        credits_remaining: creditResult.newBalance,
      });
    } catch (transcriptionError: unknown) {
      console.error("Transcription failed:", transcriptionError);

      // Mark video as error
      await supabaseAdmin
        .from("videos")
        .update({
          status: "error",
          transcript: JSON.stringify({
            error:
              transcriptionError instanceof Error
                ? transcriptionError.message
                : "Transcription failed",
          }),
        })
        .eq("id", nextVideo.id);

      return NextResponse.json(
        {
          error: "Failed to process video",
          details:
            transcriptionError instanceof Error
              ? transcriptionError.message
              : "Unknown transcription error",
          videoId: nextVideo.id,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Queue process error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
