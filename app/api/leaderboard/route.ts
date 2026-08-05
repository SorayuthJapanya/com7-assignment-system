import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { REDEEM_REVIEWER_LIST, getNegativePointsCycleStart } from "@/lib/score-constants";

interface AdminLeaderboardRow {
  userId: string;
  username: string;
  nickname: string;
  totalScore: bigint;
  assignmentCount: bigint;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authUser = authResult.user!;
    if (authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");

    const rawScores = await prisma.$queryRaw<AdminLeaderboardRow[]>`
      SELECT
        u.id as "userId",
        u.username,
        u.nickname,
        COALESCE(SUM(s.score), 0) as "totalScore",
        COUNT(s.id) as "assignmentCount"
      FROM "User" u
      LEFT JOIN "Score" s ON u.id = s."recipient_id"
      WHERE u."isHidden" = false
        AND u.role NOT IN ('SUPER_ADMIN', 'INTERN')
      GROUP BY u.id, u.username, u.nickname
      ORDER BY "totalScore" DESC
      LIMIT ${limit}
    `;

    // ===== negativePoints: นับเฉพาะ penalty ที่เกิดตั้งแต่ cycle start เป็นต้นไป =====
    const negativeCycleStart = await getNegativePointsCycleStart();

    const penaltyRows = await prisma.score.groupBy({
      by: ["recipient_id"],
      where: {
        score: { lt: 0 },
        reviewer: { notIn: REDEEM_REVIEWER_LIST },
        createdAt: { gte: negativeCycleStart },
      },
      _sum: { score: true },
    });

    const penaltyMap = new Map<string, number>();
    for (const row of penaltyRows) {
      penaltyMap.set(row.recipient_id, row._sum.score ?? 0);
    }

    const levels = await prisma.level.findMany({ orderBy: { minScore: "asc" } });

    const leaderboard = rawScores.map((row: AdminLeaderboardRow, index: number) => {
      const totalScore = Number(row.totalScore);

      const penaltyScore = penaltyMap.get(row.userId) ?? 0;
      const negativePoints = Math.abs(penaltyScore);

      const level = levels.find(
        (l) => totalScore >= l.minScore && totalScore <= l.maxScore
      ) || null;

      return {
        rank: index + 1,
        userId: row.userId,
        username: row.username,
        nickname: row.nickname,
        totalScore,
        negativePoints,
        assignmentCount: Number(row.assignmentCount),
        level,
      };
    });

    return NextResponse.json({ leaderboard, period: null });
  } catch (error) {
    console.error("Admin leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}