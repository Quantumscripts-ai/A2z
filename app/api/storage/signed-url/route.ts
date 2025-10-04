import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
  try {
    const { storagePath, expiresIn = 3600 } = await req.json();

    if (!storagePath) {
      return NextResponse.json(
        { error: "Missing storagePath" },
        { status: 400 }
      );
    }

    // Create S3 presigned URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storagePath, // S3 object key (file path)
    });

    const signedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: expiresIn 
    });

    return NextResponse.json({
      success: true,
      signedUrl: signedUrl,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Server error";
    console.error("❌ S3 signed URL generation error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}