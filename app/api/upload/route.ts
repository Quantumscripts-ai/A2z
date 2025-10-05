import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export async function POST(req: NextRequest) {
  console.log("Upload request received");
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
        file_size: file.size,
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

    // Upload file to S3
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storagePath = `${userId}/${videoId}/${file.name}`;

    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storagePath,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    });

    try {
      await s3Client.send(uploadCommand);
    } catch (storageError) {
      console.error("S3 upload error:", storageError);
      return NextResponse.json(
        { error: "Failed to upload to S3" },
        { status: 500 }
      );
    }

    // Generate S3 public URL
    const file_url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${storagePath}`;

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