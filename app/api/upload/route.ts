import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { StorageClient } from "@/types/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const language = (formData.get("language") as string) || "en";
    const userId = (formData.get("userId") as string) || null;

    if (!file)
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    if (!userId)
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // Create a videos row first (status: uploaded)
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("videos")
      .insert({
        user_id: userId,
        filename: file.name,
        language,
        status: "uploaded",
        file_size: file.size, // Add file size in bytes
      })
      .select("id")
      .single();

    if (insertError || !inserted?.id) {
      console.error(insertError);
      return NextResponse.json(
        { error: "Failed to create video record" },
        { status: 500 }
      );
    }

    const videoId: string = inserted.id;

    // Upload file to storage bucket "videos" at path userId/videoId/filename
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
      console.error(storageError);
      return NextResponse.json(
        { error: "Failed to upload to storage" },
        { status: 500 }
      );
    }

    // Get public URL (if bucket is public) or signed URL for access
    const { data: publicUrlData } = (supabaseAdmin.storage as StorageClient)
      .from("videos")
      .getPublicUrl(storagePath);

    const file_url = publicUrlData?.publicUrl || storagePath;

    // Save storage path & url to DB
    const { error: updateError } = await supabaseAdmin
      .from("videos")
      .update({ storage_path: storagePath, file_url, status: "processing" })
      .eq("id", videoId)
      .eq("user_id", userId);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json(
        { error: "Failed to update video record" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, videoId, file_url });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Server error";
    console.error("Upload error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
