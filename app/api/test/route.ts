import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { 
      message: "API is working", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV 
    },
    {
      headers: {
        "Content-Type": "application/json",
      }
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    // Test form data parsing
    const formData = await req.formData();
    const testParam = formData.get("test");
    
    return NextResponse.json(
      { 
        message: "POST test successful",
        receivedParam: testParam,
        timestamp: new Date().toISOString() 
      },
      {
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        error: "POST test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString() 
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