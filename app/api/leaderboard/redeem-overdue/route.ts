import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function computeRedeemData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { resetAt: true }, // 🎯 เอา totalScore ออกจากตรงนี้เพราะไม่มีใน Model User
  });

  const scoreFilter = user?.resetAt
    ? { recipient_id: userId, createdAt: { gt: user.resetAt } }
    : { recipient_id: userId };

  // คำนวณผลรวมคะแนนสุทธิปัจจุบัน (รวมยอดบวกและยอดหักลบที่เคยบันทึกไว้ทั้งหมด)
  const totalScoreRaw = await prisma.score.aggregate({
    _sum: { score: true },
    where: scoreFilter,
  });
  
  const totalScore = totalScoreRaw._sum.score ?? 0;

  const redeemedRaw = await prisma.score.aggregate({
    _sum: { score: true },
    where: {
      recipient_id: userId,
      score: { lt: 0 },
      reviewer: "Overdue Deduction",
      assignment_title: "Redeem overdue minutes",
      ...(user?.resetAt ? { createdAt: { gt: user.resetAt } } : {}),
    },
  });

  const redeemedPoints = Math.abs(redeemedRaw._sum.score ?? 0);
  const redeemedMinutes = redeemedPoints * 5; 

  const resetAtParam = user?.resetAt ?? null;

  const rawOverdue = await prisma.$queryRaw<{ overdueSeconds: number }[]>`
    SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (a."submitAt" - a."deadline"))), 0) AS "overdueSeconds"
    FROM "Assignment" a
    WHERE a."userId" = ${userId}
      AND a."submitAt" > a."deadline"
      AND a."submitAt" > a."createdAt"
      AND (${resetAtParam}::timestamp IS NULL OR a."createdAt" > ${resetAtParam}::timestamp)
  `;

  const overdueSeconds = Number(rawOverdue[0]?.overdueSeconds ?? 0);
  const remainingOverdueSeconds = Math.max(0, overdueSeconds - redeemedMinutes * 60);
  
  const remainingOverdueMinutes = Math.floor(remainingOverdueSeconds / 60);
  const maxMinutesFromScore = totalScore * 5;
  const maxRedeemableMinutes = Math.min(maxMinutesFromScore, remainingOverdueMinutes);

  return {
    totalScore,
    overdueSeconds: remainingOverdueSeconds,
    maxRedeemableMinutes,
    secondsPerMinute: 60,
    remainingOverdueSeconds,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authUser = authResult.user!;
    const data = await computeRedeemData(authUser.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Redeem overdue status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authUser = authResult.user!;
    const body = await request.json();
    const minutesToRedeem = Number(body.minutesToRedeem ?? 0);

    if (!Number.isInteger(minutesToRedeem) || minutesToRedeem <= 0) {
      return NextResponse.json(
        { error: "minutesToRedeem must be a positive integer" },
        { status: 400 },
      );
    }

    if (minutesToRedeem % 5 !== 0) {
      return NextResponse.json(
        { error: "minutesToRedeem must be a multiple of 5" },
        { status: 400 },
      );
    }

    const data = await computeRedeemData(authUser.id);

    if (minutesToRedeem > data.maxRedeemableMinutes) {
      return NextResponse.json(
        {
          error: "Exceeded maximum redeemable minutes.",
          maxRedeemableMinutes: data.maxRedeemableMinutes,
        },
        { status: 400 },
      );
    }

    const pointsToDeduct = minutesToRedeem / 5;

    // 🎯 แก้ไขจุดบกพร่อง: สร้างแถวหักคะแนนติดลบลงตาราง Score ตรงๆ เพื่อให้อันดับ Leaderboard ปรับยอดสุทธิลงตามธรรมชาติ
    const deduction = await prisma.score.create({
      data: {
        recipient_id: authUser.id,
        reviewer: "Overdue Deduction",
        assignment_title: "Redeem overdue minutes",
        score: -pointsToDeduct, 
      },
    });

    return NextResponse.json({
      success: true,
      minutesUsed: minutesToRedeem,
      secondsReduced: minutesToRedeem * 60,
      remainingScore: data.totalScore - pointsToDeduct, // คำนวณค่าล่วงหน้าส่งกลับไปแสดงผลชั่วคราวบนหน้าบ้าน
      remainingOverdueSeconds: Math.max(0, data.overdueSeconds - minutesToRedeem * 60),
      deductionId: deduction.id,
    });
  } catch (error) {
    console.error("Redeem overdue error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}