import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { StorageClient } from "@/types/supabase";
import { CreditManager } from "@/lib/creditManager";
import crypto from "crypto";

// Generate UUID v4
const generateUUID = () => {
  return crypto.randomUUID();
};

// Calculate video duration in minutes (rough estimate based on file size)
const estimateVideoDuration = (fileSize: number, fileName: string): number => {
  // Get file extension
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  // Different compression ratios for different formats (MB per minute)
  const compressionRatios: Record<string, number> = {
    // Video formats - more realistic estimates
    mp4: 8, // ~8MB per minute for typical 1080p
    mov: 12, // ~12MB per minute (less compressed)
    avi: 15, // ~15MB per minute (often uncompressed)
    wmv: 6, // ~6MB per minute
    flv: 5, // ~5MB per minute
    mkv: 10, // ~10MB per minute
    webm: 4, // ~4MB per minute (highly compressed)

    // Audio formats
    mp3: 1, // ~1MB per minute
    m4a: 1, // ~1MB per minute
    wav: 10, // ~10MB per minute (uncompressed)
    aac: 0.8, // ~0.8MB per minute
  };

  const mbPerMinute = compressionRatios[extension] || 8; // Default to 8MB/min
  const fileSizeMB = fileSize / (1024 * 1024);
  const estimatedMinutes = Math.ceil(fileSizeMB / mbPerMinute);
  const finalCredits = Math.max(1, Math.min(estimatedMinutes, 60));

  // Debug logging (remove in production)
  console.log(`Server Credit Estimation for ${fileName}:`, {
    fileSize: `${fileSizeMB.toFixed(2)} MB`,
    extension,
    mbPerMinute,
    estimatedMinutes,
    finalCredits,
  });

  // Minimum 1 credit per file, maximum based on size
  return finalCredits; // Cap at 60 credits per file
};

export async function POST(req: NextRequest) {
  try {
    // Validate Content-Type for FormData
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    let formData;
    try {
      formData = await req.formData();
    } catch (error) {
      console.error("Error parsing form data:", error);
      return NextResponse.json(
        { error: "Invalid form data" },
        { status: 400 }
      );
    }

    const files = formData.getAll("files") as File[];
    const language = (formData.get("language") as string) || "en";
    const userId = formData.get("userId") as string;

    // Add file validation
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 files allowed per batch" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Validate file sizes (max 100MB per file)
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    for (const file of files) {
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 100MB.` },
          { status: 400 }
        );
      }
      if (file.size === 0) {
        return NextResponse.json(
          { error: `File ${file.name} is empty.` },
          { status: 400 }
        );
      }
    }

    // Get video metadata from client (if provided)
    const videoMetadataJson = formData.get("videoMetadata") as string;
    let videoMetadata: Array<{
      duration?: number;
      creditsNeeded?: number;
      durationMinutes?: number;
    }> = [];

    try {
      if (videoMetadataJson) {
        videoMetadata = JSON.parse(videoMetadataJson);
      }
    } catch (error) {
      console.error("Error parsing video metadata:", error);
      return NextResponse.json(
        { error: "Invalid video metadata format" },
        { status: 400 }
      );
    }

    // Calculate total credits needed
    let totalCreditsNeeded = 0;
    const filesInfo: Array<{
      name: string;
      size: number;
      estimatedCredits: number;
      actualDuration?: number | null;
      hasMetadata: boolean;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file || file.size === 0) {
        return NextResponse.json(
          { error: "Invalid file in batch" },
          { status: 400 }
        );
      }

      // Use client-provided metadata if available, otherwise fall back to estimation
      let creditsNeeded = 1;
      let actualDuration: number | null = null;

      if (videoMetadata[i] && videoMetadata[i].duration) {
        actualDuration = videoMetadata[i].duration!;
        creditsNeeded =
          videoMetadata[i].creditsNeeded || Math.ceil(actualDuration / 60);
        console.log(`Using client-provided duration for ${file.name}:`, {
          duration: actualDuration,
          durationMinutes: actualDuration / 60,
          creditsNeeded,
        });
      } else {
        creditsNeeded = estimateVideoDuration(file.size, file.name);
        console.log(`Falling back to estimation for ${file.name}:`, {
          fileSize: file.size,
          creditsNeeded,
        });
      }

      totalCreditsNeeded += creditsNeeded;
      filesInfo.push({
        name: file.name,
        size: Math.round((file.size / (1024 * 1024)) * 100) / 100, // Size in MB
        estimatedCredits: creditsNeeded,
        actualDuration: actualDuration,
        hasMetadata: !!videoMetadata[i],
      });
    }

    // Check if user has enough credits
    let userCredits = 0;
    try {
      // Ensure user credits record exists and get current balance
      await CreditManager.ensureUserCreditsExist(userId);
      userCredits = await CreditManager.getUserCredits(userId);
    } catch (creditError) {
      console.error("Error checking credits:", creditError);
      // Try to get credits again without initialization
      try {
        userCredits = await CreditManager.getUserCredits(userId);
      } catch (getError) {
        console.error("Error getting credits:", getError);
        return NextResponse.json(
          { error: "Failed to verify credits. Please try again." },
          { status: 500 }
        );
      }
    }

    if (userCredits < totalCreditsNeeded) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message: `You need ${totalCreditsNeeded} credits but only have ${userCredits} credits. Please purchase more credits or remove some videos to continue.`,
          required: totalCreditsNeeded,
          available: userCredits,
          filesInfo: filesInfo,
        },
        { status: 402 } // Payment Required
      );
    }

    // Generate a unique batch ID
    const batchId = generateUUID();

    const uploadPromises = files.map(async (file, index) => {
      // Get duration from metadata if available
      const fileDuration = videoMetadata[index]?.duration || null;

      // Create video record first
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("videos")
        .insert({
          user_id: userId,
          filename: file.name,
          language,
          status: "uploaded",
          batch_id: batchId,
          queue_position: index,
          batch_status: "pending",
          added_to_queue_at: new Date().toISOString(),
          file_size: file.size, // File size in bytes
          duration: fileDuration, // Duration in seconds
        })
        .select("id")
        .single();

      if (insertError || !inserted?.id) {
        throw new Error(
          `Failed to create video record for ${file.name}: ${insertError?.message}`
        );
      }

      const videoId = inserted.id;

      // Upload file to storage
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const storagePath = `${userId}/${videoId}/${file.name}`;

      const { error: storageError } = await (
        supabaseAdmin.storage as StorageClient
      )
        .from("videos")
        .upload(storagePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });

      if (storageError) {
        // Clean up the database record if storage upload fails
        await supabaseAdmin.from("videos").delete().eq("id", videoId);
        throw new Error(
          `Failed to upload ${file.name} to storage: ${storageError.message}`
        );
      }

      // Get public URL
      const { data: publicUrlData } = (supabaseAdmin.storage as StorageClient)
        .from("videos")
        .getPublicUrl(storagePath);

      // Update video record with storage info
      const { error: updateError } = await supabaseAdmin
        .from("videos")
        .update({
          file_url: publicUrlData.publicUrl,
          storage_path: storagePath,
        })
        .eq("id", videoId);

      if (updateError) {
        console.warn(
          `Failed to update storage info for video ${videoId}:`,
          updateError
        );
      }

      return {
        videoId,
        filename: file.name,
        queuePosition: index,
      };
    });

    try {
      const results = await Promise.all(uploadPromises);

      return NextResponse.json({
        success: true,
        batchId,
        message: `Successfully added ${results.length} videos to processing queue`,
        videos: results,
      }, {
        headers: {
          "Content-Type": "application/json",
        }
      });
    } catch (error: unknown) {
      // If any upload fails, we should clean up any successful uploads
      console.error("Batch upload failed:", error);

      // Clean up any videos that were created for this batch
      await supabaseAdmin.from("videos").delete().eq("batch_id", batchId);

      return NextResponse.json(
        {
          error: "Failed to add videos to queue",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
    }
  } catch (error: unknown) {
    console.error("Queue add error:", error);
    
    // Ensure we always return a JSON response
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    
    return NextResponse.json(
      {
        error: "Internal server error",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
  }
}
