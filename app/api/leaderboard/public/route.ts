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
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    let period: { year: number; month: number } | null = null;
    let startDate: string | null = null;
    let endDate: string | null = null;

    if (yearParam && monthParam) {
      const year = parseInt(yearParam);
      const month = parseInt(monthParam);
      period = { year, month };
      startDate = new Date(year, month - 1, 1).toISOString();
      endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
    }

    const scoreDateFilter = startDate && endDate
      ? `AND s."createdAt" >= '${startDate}' AND s."createdAt" <= '${endDate}'`
      : "";

    const assignmentDateFilter = startDate && endDate
      ? `WHERE a."createdAt" >= '${startDate}' AND a."createdAt" <= '${endDate}'`
      : "";

    const lateDateFilter = startDate && endDate
      ? `AND a."createdAt" >= '${startDate}' AND a."createdAt" <= '${endDate}'`
      : "";

    const rawScores = await prisma.$queryRawUnsafe<
      { userId: string; username: string; nickname: string; profileImage: string | null; totalScore: bigint; assignmentCount: bigint; lateCount: bigint; overdueSeconds: number }[]
    >(`
      SELECT
        u.id as "userId",
        u.username,
        u.nickname,
        u."profileImage",
        COALESCE(sc."totalScore", 0) as "totalScore",
        COALESCE(ac."assignmentCount", 0) as "assignmentCount",
        COALESCE(late."lateCount", 0) as "lateCount",
        COALESCE(late."overdueSeconds", 0) as "overdueSeconds"
      FROM "User" u
      LEFT JOIN (
        SELECT
          s."recipient_id",
          SUM(s.score) as "totalScore"
        FROM "Score" s
        JOIN "User" ur ON ur.id = s."recipient_id"
        WHERE (ur."resetAt" IS NULL OR s."createdAt" > ur."resetAt")
        ${scoreDateFilter}
        GROUP BY s."recipient_id"
      ) sc ON u.id = sc."recipient_id"
      LEFT JOIN (
        SELECT
          a."userId",
          COUNT(*) as "assignmentCount"
        FROM "Assignment" a
        JOIN "User" ur ON ur.id = a."userId"
        WHERE (ur."resetAt" IS NULL OR a."createdAt" > ur."resetAt")
        ${assignmentDateFilter ? assignmentDateFilter.replace("WHERE", "AND") : ""}
        GROUP BY a."userId"
      ) ac ON u.id = ac."userId"
      LEFT JOIN (
        SELECT
          a."userId",
          COUNT(*) as "lateCount",
          SUM(EXTRACT(EPOCH FROM (a."submitAt" - a."deadline"))) as "overdueSeconds"
        FROM "Assignment" a
        JOIN "User" ur ON ur.id = a."userId"
        WHERE a."submitAt" > a."deadline" AND a."submitAt" > a."createdAt"
          AND (ur."resetAt" IS NULL OR a."createdAt" > ur."resetAt")
        ${lateDateFilter}
        GROUP BY a."userId"
      ) late ON u.id = late."userId"
      WHERE u.role != 'SUPER_ADMIN'
      ORDER BY "totalScore" DESC
    `);

    const levels = await prisma.level.findMany({ orderBy: { minScore: "asc" } });

    const leaderboard = rawScores.map((row, index) => {
      const totalScore = Number(row.totalScore);
      const assignmentCount = Number(row.assignmentCount);
      const lateCount = Number(row.lateCount);
      const overdueSeconds = Number(row.overdueSeconds);
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
        lateCount,
        overdueSeconds,
        level,
      };
    });

    return NextResponse.json({ leaderboard, period });
  } catch (error) {
    console.error("Public leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
