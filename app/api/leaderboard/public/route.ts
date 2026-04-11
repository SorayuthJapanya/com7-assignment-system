import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    let period: { year: number; month: number } | null = null;
    let scoreFilter = "";

    if (yearParam && monthParam) {
      const year = parseInt(yearParam);
      const month = parseInt(monthParam);
      period = { year, month };
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
      scoreFilter = `AND s."createdAt" >= '${startDate}' AND s."createdAt" <= '${endDate}'`;
    }

    const rawScores = await prisma.$queryRawUnsafe<
      { userId: string; username: string; nickname: string; profileImage: string | null; totalScore: bigint; assignmentCount: bigint }[]
    >(`
      SELECT
        u.id as "userId",
        u.username,
        u.nickname,
        u."profileImage",
        COALESCE(SUM(s.score), 0) as "totalScore",
        COUNT(s.id) as "assignmentCount"
      FROM "User" u
      LEFT JOIN "Score" s ON u.id = s."recipient_id" ${scoreFilter}
      WHERE u.role != 'SUPER_ADMIN'
      GROUP BY u.id, u.username, u.nickname, u."profileImage"
      ORDER BY "totalScore" DESC
      LIMIT ${limit}
    `);

    const levels = await prisma.level.findMany({ orderBy: { minScore: "asc" } });

    const leaderboard = rawScores.map((row, index) => {
      const totalScore = Number(row.totalScore);
      const assignmentCount = Number(row.assignmentCount);
      const level = levels.find(
        (l) => totalScore >= l.minScore && totalScore <= l.maxScore
      ) || null;

      return {
        rank: index + 1,
        userId: row.userId,
        username: row.username,
        nickname: row.nickname,
        profileImage: row.profileImage,
        totalScore,
        avgScore: assignmentCount > 0 ? Math.round((totalScore / assignmentCount) * 10) / 10 : 0,
        assignmentCount,
        level,
      };
    });

    return NextResponse.json({ leaderboard, period });
  } catch (error) {
    console.error("Public leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
