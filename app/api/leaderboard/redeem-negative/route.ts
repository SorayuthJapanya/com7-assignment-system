import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  REDEEM_REVIEWERS,
  REDEEM_REVIEWER_LIST,
  getNegativePointsCycleStart,
} from "@/lib/score-constants";

export async function POST(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authUser = authResult.user!;
    const body = await request.json();
    const pointsToDeduct = Number(body.pointsToDeduct ?? 0);

    if (!Number.isInteger(pointsToDeduct) || pointsToDeduct <= 0) {
      return NextResponse.json(
        { error: "pointsToDeduct must be a positive integer" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { resetAt: true },
    });

    const resetFilter = user?.resetAt ? { createdAt: { gt: user.resetAt } } : {};

    // totalScore: net ทั้งหมด เหมือนเดิมทุกประการ
    const totalScoreRaw = await prisma.score.aggregate({
      _sum: { score: true },
      where: {
        recipient_id: authUser.id,
        ...resetFilter,
      },
    });
    const totalScore = Math.max(0, totalScoreRaw._sum.score ?? 0);

    // negativePoints: penalty ดิบ ลบด้วยจำนวนที่เคยแลกไปแล้ว (ตั้งแต่ cycle start)
    const negativeCycleStart = await getNegativePointsCycleStart();

    const penaltyRaw = await prisma.score.aggregate({
      _sum: { score: true },
      where: {
        recipient_id: authUser.id,
        score: { lt: 0 },
        reviewer: { notIn: REDEEM_REVIEWER_LIST },
        createdAt: { gte: negativeCycleStart },
      },
    });
    const rawPenalty = Math.abs(penaltyRaw._sum.score ?? 0);

    const redeemedNegRaw = await prisma.score.aggregate({
      _sum: { score: true },
      where: {
        recipient_id: authUser.id,
        score: { lt: 0 },
        reviewer: REDEEM_REVIEWERS.NEGATIVE_DEDUCTION,
        assignment_title: "Redeem negative points",
        createdAt: { gte: negativeCycleStart },
      },
    });
    const redeemedNegPoints = Math.abs(redeemedNegRaw._sum.score ?? 0);

    const negativePoints = Math.max(0, rawPenalty - redeemedNegPoints);

    if (pointsToDeduct > totalScore) {
      return NextResponse.json(
        { error: "คะแนนสะสมของคุณไม่เพียงพอ" },
        { status: 400 },
      );
    }

    if (pointsToDeduct > negativePoints) {
      return NextResponse.json(
        { error: "จำนวนคะแนนเกินกว่า Negative Points ที่มีอยู่" },
        { status: 400 },
      );
    }

    const deduction = await prisma.score.create({
      data: {
        recipient_id: authUser.id,
        reviewer: REDEEM_REVIEWERS.NEGATIVE_DEDUCTION,
        assignment_title: "Redeem negative points",
        score: -pointsToDeduct,
      },
    });

    return NextResponse.json({
      success: true,
      pointsDeducted: pointsToDeduct,
      remainingScore: totalScore - pointsToDeduct,
      remainingNegativePoints: Math.max(0, negativePoints - pointsToDeduct),
      deductionId: deduction.id,
    });
  } catch (error) {
    console.error("Redeem negative points error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}