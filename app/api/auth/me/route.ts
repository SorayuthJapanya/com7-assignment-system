import { NextRequest, NextResponse } from "next/server";
import { isAuthorize } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authResult = await isAuthorize(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get authenticated user
    const user = authResult.user;

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}