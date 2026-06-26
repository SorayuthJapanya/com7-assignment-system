import { NextResponse } from "next/server";

export async function GET() {
  try {
  
    const mockBadges = {
      success: true,
      badges: []
    };
    return NextResponse.json(mockBadges);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}