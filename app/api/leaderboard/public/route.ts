import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { REDEEM_REVIEWERS, REDEEM_REVIEWER_LIST, getNegativePointsCycleStart } from "@/lib/score-constants";
interface LeaderboardRow {
  userId: string;
  username: string;
  nickname: string;
  profileImage: string | null;
  totalScore: bigint;
  assignmentCount: bigint;
  lateCount: bigint;
  overdueSeconds: number;
}

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

    // ===== Query หลัก: totalScore คำนวณแบบเดิมทุกประการ ไม่เปลี่ยน =====
    const rawScores = await prisma.$queryRawUnsafe<LeaderboardRow[]>(`
      SELECT
        u.id as "userId",
        u.username,
        u.nickname,
        u."profileImage",
        COALESCE(sc."totalScore", 0) as "totalScore",
        COALESCE(ac."assignmentCount", 0) as "assignmentCount",
        COALESCE(late."lateCount", 0) as "lateCount",
        GREATEST(COALESCE(late."overdueSeconds", 0) - COALESCE(deduction."redeemedMinutes", 0) * 5 * 60, 0) as "overdueSeconds"
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
      LEFT JOIN (
        SELECT
          s."recipient_id",
          ABS(SUM(s.score)) as "redeemedMinutes"
        FROM "Score" s
        JOIN "User" ur ON ur.id = s."recipient_id"
        WHERE s.score < 0
          AND s."reviewer" = 'Overdue Deduction'
          AND s."assignment_title" = 'Redeem overdue minutes'
          AND (ur."resetAt" IS NULL OR s."createdAt" > ur."resetAt")
        GROUP BY s."recipient_id"
      ) deduction ON u.id = deduction."recipient_id"
      WHERE u.role != 'SUPER_ADMIN' AND u.role != 'INTERN' AND u."isHidden" = false
      ORDER BY "totalScore" DESC
    `);

    // ===== negativePoints: penalty ดิบ (ตั้งแต่ cycle start) ลบด้วยที่เคยแลกไปแล้ว =====
    const negativeCycleStart = await getNegativePointsCycleStart();

    const negativeCreatedAtFilter: { gte: Date; lte?: Date } = { gte: negativeCycleStart };
    if (startDate && endDate) {
      const selectedStart = new Date(startDate);
      negativeCreatedAtFilter.gte =
        selectedStart > negativeCycleStart ? selectedStart : negativeCycleStart;
      negativeCreatedAtFilter.lte = new Date(endDate);
    }

    const penaltyRows = await prisma.score.groupBy({
      by: ["recipient_id"],
      where: {
        score: { lt: 0 },
        reviewer: { notIn: REDEEM_REVIEWER_LIST },
        createdAt: negativeCreatedAtFilter,
      },
      _sum: { score: true },
    });

    const redeemedNegRows = await prisma.score.groupBy({
      by: ["recipient_id"],
      where: {
        score: { lt: 0 },
        reviewer: REDEEM_REVIEWERS.NEGATIVE_DEDUCTION,
        assignment_title: "Redeem negative points",
        createdAt: negativeCreatedAtFilter,
      },
      _sum: { score: true },
    });

    const penaltyMap = new Map<string, number>();
    for (const row of penaltyRows) {
      penaltyMap.set(row.recipient_id, Math.abs(row._sum.score ?? 0));
    }

    const redeemedNegMap = new Map<string, number>();
    for (const row of redeemedNegRows) {
      redeemedNegMap.set(row.recipient_id, Math.abs(row._sum.score ?? 0));
    }
    const levels = await prisma.level.findMany({ orderBy: { minScore: "asc" } });

    const leaderboard = rawScores.map((row: LeaderboardRow, index: number) => {
      const rawTotalScore = Number(row.totalScore);
      const totalScore = Math.max(0, rawTotalScore);

      const rawPenalty = penaltyMap.get(row.userId) ?? 0;
      const redeemedNeg = redeemedNegMap.get(row.userId) ?? 0;
      const negativePoints = Math.max(0, rawPenalty - redeemedNeg);

      const assignmentCount = Number(row.assignmentCount);
      const lateCount = Number(row.lateCount);
      const overdueSeconds = Math.max(0, Number(row.overdueSeconds));

      const level =
        levels.find((l) => totalScore >= l.minScore && totalScore <= l.maxScore) || null;

      return {
        rank: index + 1,
        userId: row.userId,
        username: row.username,
        nickname: row.nickname,
        profileImage: row.profileImage,
        totalScore,
        negativePoints,
        avgScore:
          assignmentCount > 0
            ? Math.round(((assignmentCount - lateCount) / assignmentCount) * 100)
            : 0,
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