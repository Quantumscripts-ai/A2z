import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { storagePath, expiresIn = 3600 } = await req.json();

    if (!storagePath) {
      return NextResponse.json(
        { error: "Missing storagePath" },
        { status: 400 }
      );
    }

    // Create signed URL using admin client
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from("videos")
      .createSignedUrl(storagePath, expiresIn);

    if (signedError) {
      console.error("❌ Error creating signed URL:", signedError);
      return NextResponse.json({ error: signedError.message }, { status: 500 });
    }

    if (!signedData?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate signed URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: signedData.signedUrl,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Server error";
    console.error("❌ Signed URL generation error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
