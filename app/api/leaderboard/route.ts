import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

    // Aggregate total score per user (all-time)
    const rawScores = await prisma.$queryRaw<
      { userId: string; username: string; nickname: string; totalScore: bigint; assignmentCount: bigint }[]
    >`
      SELECT
        u.id as "userId",
        u.username,
        u.nickname,
        COALESCE(SUM(s.score), 0) as "totalScore",
        COUNT(s.id) as "assignmentCount"
      FROM "User" u
      LEFT JOIN "Score" s ON u.id = s."recipient_id"
      GROUP BY u.id, u.username, u.nickname
      ORDER BY "totalScore" DESC
      LIMIT ${limit}
    `;

    // Get all levels for badge resolution
    const levels = await prisma.level.findMany({ orderBy: { minScore: "asc" } });

    const leaderboard = rawScores.map((row, index) => {
      const totalScore = Number(row.totalScore);
      const level = levels.find(
        (l) => totalScore >= l.minScore && totalScore <= l.maxScore
      ) || null;

      return {
        rank: index + 1,
        userId: row.userId,
        username: row.username,
        nickname: row.nickname,
        totalScore,
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
