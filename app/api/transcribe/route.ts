import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CreditManager } from "@/lib/creditManager";

export const runtime = "nodejs";
export const preferredRegion = ["iad1"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const language = (formData.get("language") as string) || "en";
    const userId = (formData.get("userId") as string) || null;
    const videoId = (formData.get("videoId") as string) || null;
    const duration = parseFloat((formData.get("duration") as string) || "0");

    if (!file)
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    if (!userId)
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    if (!videoId)
      return NextResponse.json({ error: "Missing videoId" }, { status: 400 });

    // Calculate credits needed (1 credit per minute, rounded up)
    const durationMinutes = duration / 60;
    const creditsNeeded = CreditManager.calculateVideoCredits(durationMinutes);

    // Debug logging (remove in production)
    console.log(`Transcribe API Credit Calculation:`, {
      fileName: file.name,
      durationSeconds: duration,
      durationMinutes: durationMinutes.toFixed(2),
      creditsNeeded,
      userId,
    });

    // Check if user has sufficient credits
    const userCredits = await CreditManager.getUserCredits(userId);
    if (userCredits < creditsNeeded) {
      // Update video status to failed due to insufficient credits
      await supabaseAdmin
        .from("videos")
        .update({
          status: "error",
          transcript: `Insufficient credits. Need ${creditsNeeded} credits but only have ${userCredits}.`,
        })
        .eq("id", videoId)
        .eq("user_id", userId);

      return NextResponse.json(
        {
          error: `Insufficient credits. You have ${userCredits} credits but need ${creditsNeeded} for this ${(duration / 60).toFixed(1)}-minute video.`,
          credits_available: userCredits,
          credits_needed: creditsNeeded,
        },
        { status: 402 } // Payment required
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Convert File to Blob readable stream for OpenAI SDK
    const fileArrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileArrayBuffer);

    // Define a more precise type for the transcription result
    interface WhisperTranscriptionResult {
      text: string;
      [key: string]: unknown;
    }

    // OpenAI transcription using whisper-1
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: new File([buffer], file.name, { type: file.type || "audio/mpeg" }),
      language,
      response_format: "verbose_json",
      temperature: 0,
    });

    // Cast the transcription result to our interface
    const transcriptionResult =
      transcription as unknown as WhisperTranscriptionResult;
    const text: string = transcriptionResult.text || "";

    // Deduct credits after successful transcription
    const creditResult = await CreditManager.deductCredits(
      userId,
      creditsNeeded,
      "video_generation",
      {
        video_id: videoId,
        filename: file.name,
        duration_minutes: duration / 60,
        language: language,
      }
    );

    if (!creditResult.success) {
      console.error("Failed to deduct credits:", creditResult.message);
      // Continue with the operation but log the error
    }

    // Update Supabase videos row with transcript
    const { error: updateError } = await supabaseAdmin
      .from("videos")
      .update({ transcript: text, status: "completed", language })
      .eq("id", videoId)
      .eq("user_id", userId);

    if (updateError) {
      console.error(updateError);
      // If video update fails but credits were deducted, we should refund
      if (creditResult.success) {
        try {
          await CreditManager.addCredits(userId, creditsNeeded, "refund", {
            reason: "video_update_failed",
            video_id: videoId,
            original_amount: creditsNeeded,
          });
        } catch (refundError) {
          console.error("Failed to refund credits:", refundError);
        }
      }
      return NextResponse.json(
        { error: "Failed to update transcript" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transcript: text,
      credits_deducted: creditsNeeded,
      credits_remaining: creditResult.newBalance,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Server error";
    console.error("Transcription error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
