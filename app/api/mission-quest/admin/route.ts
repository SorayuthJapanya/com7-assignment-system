import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);

    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: 401 });
    }

    if (authResult.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get("missionId") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const skip = (page - 1) * limit;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter Where Objects
    const claimWhere: any = {};
    if (missionId) claimWhere.missionId = missionId;
    if (userId) claimWhere.userId = userId;

    const overdueWhere: any = {
      reviewer: "Overdue Deduction",
      assignment_title: "Redeem overdue minutes",
    };
    if (userId) overdueWhere.recipient_id = userId;

    const [
      claims,
      totalClaims,
      overdueRows,
      missionSummary,
    ] = await Promise.all([
      prisma.missionClaim.findMany({
        where: claimWhere,
        orderBy: { claimedAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, nickname: true, username: true } },
        },
      }),

      prisma.missionClaim.count({ where: claimWhere }),

      // 🎯 แก้ไขจาก recipient -> user ให้ตรงกับ Prisma Schema
      prisma.score.findMany({
        where: overdueWhere,
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          score: true,
          recipient_id: true,
          createdAt: true,
          user: {
            select: { id: true, nickname: true, username: true },
          },
        },
      }),

      prisma.missionClaim.groupBy({
        by: ["missionId"],
        where: { claimedAt: { gte: monthStart } },
        _count: { missionId: true },
        _sum: { points: true },
      }),
    ]);

    return NextResponse.json({
      claims: claims.map((c) => ({
        id: c.id,
        userId: c.userId,
        nickname: c.user?.nickname ?? "-",
        username: c.user?.username ?? "-",
        missionId: c.missionId,
        points: c.points,
        month: c.month,
        year: c.year,
        claimedAt: c.claimedAt.toISOString(),
      })),
      overdue: overdueRows.map((r) => {
        const pointsUsed = Math.abs(r.score);
        return {
          id: r.id,
          userId: r.recipient_id,
          nickname: r.user?.nickname ?? "-",
          username: r.user?.username ?? "-",
          points: r.score,
          pointsUsed,
          minutes: pointsUsed * 5,
          createdAt: r.createdAt.toISOString(),
        };
      }),
      pagination: {
        page,
        limit,
        total: totalClaims,
        totalPages: Math.ceil(totalClaims / limit),
      },
      missionSummary: missionSummary.map((m) => ({
        missionId: m.missionId,
        claimCount: m._count.missionId,
        totalPoints: m._sum.points ?? 0,
      })),
    });
  } catch (error) {
    console.error("Admin mission-quest error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as { code?: string }).code,
    });
    return NextResponse.json(
      { error: "Mission Quest admin is temporarily unavailable" },
      { status: 503 },
    );
  }
}