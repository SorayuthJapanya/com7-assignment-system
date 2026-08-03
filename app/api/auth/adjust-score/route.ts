import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (authResult.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();
    const { targetUserId, points, reason } = body;

    if (!targetUserId || points === undefined || points === null) {
      return NextResponse.json({ error: "targetUserId and points are required." }, { status: 400 });
    }

    const diffPoints = Number(points);
    if (isNaN(diffPoints) || diffPoints === 0) {
      return NextResponse.json({ message: "No score change needed." });
    }

    //  สร้าง Transaction บันทึกส่วนต่างคะแนนลงตาราง score
    const newScore = await prisma.score.create({
      data: {
        recipient_id: targetUserId,
        reviewer: `Admin (${authResult.user.nickname || authResult.user.username})`,
        assignment_title: reason || "Admin Score Adjustment",
        score: diffPoints,
      },
    });

    return NextResponse.json({ message: "Adjust score successfully", newScore });
  } catch (error) {
    console.error("Adjust score error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}