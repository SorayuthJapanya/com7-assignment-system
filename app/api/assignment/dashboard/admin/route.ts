import { isAuthorize } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type {
  AdminDashboardResponse,
  UserAssignmentStatus,
  StatusDistribution,
  MonthlyTrend,
  UserScoreSummary,
  AverageScoreByMonth,
} from "@/types/dashboard";

export async function GET(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const authUser = authResult.user!;

    if (authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only Super Admin can access this route" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const filterParam = searchParams.get("filter") || "all"; // 'all' | 'monthly' | 'weekly'

    const year = yearParam ? parseInt(yearParam) : null;
    const month = monthParam ? parseInt(monthParam) : null;

    const chartYear = year || new Date().getFullYear();

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    // 📌 ปรับปรุงการคำนวณช่วงเวลาให้รองรับทั้ง filterParam และ Header Year/Month
    if (filterParam === "weekly") {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      endDate = new Date();
    } else if (filterParam === "monthly") {
      const targetYear = year || new Date().getFullYear();
      const targetMonth = month || new Date().getMonth() + 1;
      startDate = new Date(targetYear, targetMonth - 1, 1);
      endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    } else if (filterParam === "all") {
      // ถ้าสั่ง filter=all ให้ดึง All Time ชัดเจน (ไม่ล็อกตาม year/month)
      startDate = null;
      endDate = null;
    } else if (year && month) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else if (year) {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    const dateWhere: any = {
      ...(startDate && endDate ? { createdAt: { gte: startDate, lte: endDate } } : {}),
      user: {
        is: {
          role: { notIn: ["SUPER_ADMIN", "INTERN"] },
          isHidden: false,
        },
      },
    };

    const totalAssignments = await prisma.assignment.count({
      where: dateWhere,
    });

    const totalSubmittedRaw = startDate && endDate
      ? await prisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM "Assignment" a
          JOIN "User" u ON u.id = a."userId"
          WHERE a."submitAt" > a."createdAt"
            AND u.role NOT IN ('SUPER_ADMIN', 'INTERN')
            AND u."isHidden" = false
            AND a."createdAt" >= ${startDate}
            AND a."createdAt" <= ${endDate}
        `
      : await prisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM "Assignment" a
          JOIN "User" u ON u.id = a."userId"
          WHERE a."submitAt" > a."createdAt"
            AND u.role NOT IN ('SUPER_ADMIN', 'INTERN')
            AND u."isHidden" = false
        `;

    const totalApproved = await prisma.assignment.count({
      where: { ...dateWhere, status: "Approved" },
    });

    const averageScore = await prisma.assignment.aggregate({
      where: { ...dateWhere, finalScore: { gt: 0 } },
      _avg: { finalScore: true },
    });

    const lateSubmissions = await prisma.assignment.count({
      where: {
        ...dateWhere,
        submitAt: { gt: prisma.assignment.fields.deadline },
      },
    });

    /* 📌 lateCount นับเฉพาะงานที่ยังไม่ส่ง (Pending) และเลย Deadline แล้ว ณ เวลาปัจจุบัน */
    const userAssignmentData = startDate && endDate
      ? await prisma.$queryRaw<(UserAssignmentStatus & { role?: string; lateCount?: number })[]>`
          SELECT
            u.username,
            u.nickname,
            u.role,
            COUNT(CASE WHEN a."submitAt" > a."createdAt" THEN 1 END) as submitted,
            COUNT(CASE WHEN a.status = 'Approved' THEN 1 END) as approved,
            COUNT(CASE WHEN a.status = 'Rejected' THEN 1 END) as rejected,
            COUNT(CASE WHEN a.status = 'Pending' THEN 1 END) as pending,
            COUNT(CASE WHEN a.status = 'Pending' AND a."deadline" < NOW() THEN 1 END) as "lateCount"
          FROM "User" u
          LEFT JOIN "Assignment" a ON u.id = a."userId"
            AND a."createdAt" >= ${startDate}
            AND a."createdAt" <= ${endDate}
          WHERE u.username IS NOT NULL
            AND u.role NOT IN ('SUPER_ADMIN', 'INTERN')
            AND u."isHidden" = false
          GROUP BY u.id, u.username, u.nickname, u.role
          ORDER BY u.username
        `
      : await prisma.$queryRaw<(UserAssignmentStatus & { role?: string; lateCount?: number })[]>`
          SELECT
            u.username,
            u.nickname,
            u.role,
            COUNT(CASE WHEN a."submitAt" > a."createdAt" THEN 1 END) as submitted,
            COUNT(CASE WHEN a.status = 'Approved' THEN 1 END) as approved,
            COUNT(CASE WHEN a.status = 'Rejected' THEN 1 END) as rejected,
            COUNT(CASE WHEN a.status = 'Pending' THEN 1 END) as pending,
            COUNT(CASE WHEN a.status = 'Pending' AND a."deadline" < NOW() THEN 1 END) as "lateCount"
          FROM "User" u
          LEFT JOIN "Assignment" a ON u.id = a."userId"
          WHERE u.username IS NOT NULL
            AND u.role NOT IN ('SUPER_ADMIN', 'INTERN')
            AND u."isHidden" = false
          GROUP BY u.id, u.username, u.nickname, u.role
          ORDER BY u.username
        `;

    const statusDistributionData = startDate && endDate
      ? await prisma.$queryRaw<StatusDistribution[]>`
          WITH total_assignments AS (
            SELECT COUNT(*) as total FROM "Assignment" a
            JOIN "User" u ON u.id = a."userId"
            WHERE a."createdAt" >= ${startDate} AND a."createdAt" <= ${endDate}
              AND u.role NOT IN ('SUPER_ADMIN', 'INTERN')
              AND u."isHidden" = false
          )
          SELECT 'Approved' as name, COUNT(*) as value,
            ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
          FROM "Assignment" a JOIN "User" u ON u.id = a."userId"
          WHERE a.status = 'Approved' AND u.role NOT IN ('SUPER_ADMIN', 'INTERN') AND u."isHidden" = false
            AND a."createdAt" >= ${startDate} AND a."createdAt" <= ${endDate}
          UNION ALL
          SELECT 'Rejected' as name, COUNT(*) as value,
            ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
          FROM "Assignment" a JOIN "User" u ON u.id = a."userId"
          WHERE a.status = 'Rejected' AND u.role NOT IN ('SUPER_ADMIN', 'INTERN') AND u."isHidden" = false
            AND a."createdAt" >= ${startDate} AND a."createdAt" <= ${endDate}
          UNION ALL
          SELECT 'Late Submit' as name, COUNT(*) as value,
            ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
          FROM "Assignment" a JOIN "User" u ON u.id = a."userId"
          WHERE a."submitAt" > a."deadline" AND a."submitAt" > a."createdAt" AND u.role NOT IN ('SUPER_ADMIN', 'INTERN') AND u."isHidden" = false
            AND a."createdAt" >= ${startDate} AND a."createdAt" <= ${endDate}
          UNION ALL
          SELECT 'Pending' as name, COUNT(*) as value,
            ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
          FROM "Assignment" a JOIN "User" u ON u.id = a."userId"
          WHERE a.status = 'Pending' AND u.role NOT IN ('SUPER_ADMIN', 'INTERN') AND u."isHidden" = false
            AND a."createdAt" >= ${startDate} AND a."createdAt" <= ${endDate}
        `
      : await prisma.$queryRaw<StatusDistribution[]>`
          WITH total_assignments AS (
            SELECT COUNT(*) as total FROM "Assignment" a
            JOIN "User" u ON u.id = a."userId"
            WHERE u.role NOT IN ('SUPER_ADMIN', 'INTERN') AND u."isHidden" = false
          )
          SELECT 'Approved' as name, COUNT(*) as value,
            ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
          FROM "Assignment" a JOIN "User" u ON u.id = a."userId"
          WHERE a.status = 'Approved' AND u.role NOT IN ('SUPER_ADMIN', 'INTERN') AND u."isHidden" = false
          UNION ALL
          SELECT 'Rejected' as name, COUNT(*) as value,
            ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
          FROM "Assignment" a JOIN "User" u ON u.id = a."userId"
          WHERE a.status = 'Rejected' AND u.role NOT IN ('SUPER_ADMIN', 'INTERN') AND u."isHidden" = false
          UNION ALL
          SELECT 'Late Submit' as name, COUNT(*) as value,
            ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
          FROM "Assignment" a JOIN "User" u ON u.id = a."userId"
          WHERE a."submitAt" > a."deadline" AND a."submitAt" > a."createdAt" AND u.role NOT IN ('SUPER_ADMIN', 'INTERN') AND u."isHidden" = false
          UNION ALL
          SELECT 'Pending' as name, COUNT(*) as value,
            ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
          FROM "Assignment" a JOIN "User" u ON u.id = a."userId"
          WHERE a.status = 'Pending' AND u.role NOT IN ('SUPER_ADMIN', 'INTERN') AND u."isHidden" = false
        `;

    const monthlyTrendData = await prisma.$queryRaw<MonthlyTrend[]>`
      WITH all_months AS (
        SELECT
          generate_series(
            MAKE_DATE(${chartYear}, 1, 1),
            MAKE_DATE(${chartYear}, 12, 1),
            INTERVAL '1 month'
          ) as month_start
      ),
      monthly_data AS (
        SELECT
          TO_CHAR(a."createdAt", 'YYYY-MM') as month,
          COUNT(CASE WHEN a.status = 'Approved' THEN 1 END) as approved
        FROM "Assignment" a
        JOIN "User" u ON u.id = a."userId"
        WHERE EXTRACT(YEAR FROM a."createdAt") = ${chartYear}
          AND u.role NOT IN ('SUPER_ADMIN', 'INTERN')
          AND u."isHidden" = false
        GROUP BY TO_CHAR(a."createdAt", 'YYYY-MM')
      )
      SELECT
        TO_CHAR(am.month_start, 'YYYY-MM') as month,
        COALESCE(md.approved, 0) as approved
      FROM all_months am
      LEFT JOIN monthly_data md ON TO_CHAR(am.month_start, 'YYYY-MM') = md.month
      ORDER BY am.month_start
    `;

    const averageScoreByMonthData = await prisma.$queryRaw<AverageScoreByMonth[]>`
      WITH all_months AS (
        SELECT
          generate_series(
            MAKE_DATE(${chartYear}, 1, 1),
            MAKE_DATE(${chartYear}, 12, 1),
            INTERVAL '1 month'
          ) as month_start
      ),
      monthly_scores AS (
        SELECT
          TO_CHAR(a."createdAt", 'YYYY-MM') as month,
          AVG(a."finalScore") as averageScore
        FROM "Assignment" a
        JOIN "User" u ON u.id = a."userId"
        WHERE EXTRACT(YEAR FROM a."createdAt") = ${chartYear}
          AND a."finalScore" > 0
          AND a.status = 'Approved'
          AND u.role NOT IN ('SUPER_ADMIN', 'INTERN')
          AND u."isHidden" = false
        GROUP BY TO_CHAR(a."createdAt", 'YYYY-MM')
      )
      SELECT
        TO_CHAR(am.month_start, 'YYYY-MM') as month,
        COALESCE(CAST(ms.averageScore AS NUMERIC), 0) as "averageScore"
      FROM all_months am
      LEFT JOIN monthly_scores ms ON TO_CHAR(am.month_start, 'YYYY-MM') = ms.month
      ORDER BY am.month_start
    `;

    /* 📌 คำนวณ userScoreSummaryData ปลอดภัยด้วย Parameterized query */
    const userScoreSummaryData = startDate && endDate
      ? await prisma.$queryRaw<(UserScoreSummary & { role?: string })[]>`
          SELECT 
            u.username,
            u.nickname,
            u.role,
            COALESCE(SUM(s.score), 0) as "totalScore",
            COUNT(s.id) as "assignmentCount"
          FROM "User" u
          LEFT JOIN "Score" s ON u.id = s."recipient_id"
            AND s."createdAt" >= ${startDate}
            AND s."createdAt" <= ${endDate}
          WHERE u.role NOT IN ('SUPER_ADMIN', 'INTERN')
            AND u."isHidden" = false
          GROUP BY u.id, u.username, u.nickname, u.role
          ORDER BY "totalScore" DESC
        `
      : await prisma.$queryRaw<(UserScoreSummary & { role?: string })[]>`
          SELECT 
            u.username,
            u.nickname,
            u.role,
            COALESCE(SUM(s.score), 0) as "totalScore",
            COUNT(s.id) as "assignmentCount"
          FROM "User" u
          LEFT JOIN "Score" s ON u.id = s."recipient_id"
          WHERE u.role NOT IN ('SUPER_ADMIN', 'INTERN')
            AND u."isHidden" = false
          GROUP BY u.id, u.username, u.nickname, u.role
          ORDER BY "totalScore" DESC
        `;

    const totalSubmitted = Array.isArray(totalSubmittedRaw)
      ? Number((totalSubmittedRaw[0] as { count: bigint })?.count || 0)
      : 0;

    const response: AdminDashboardResponse = {
      role: "SUPER_ADMIN",
      period: { year, month },
      kpis: {
        totalAssignments,
        totalSubmitted,
        totalApproved,
        averageScore: Math.round(averageScore?._avg?.finalScore || 0),
        lateSubmissions,
      },
      charts: {
        userAssignmentStatus: {
          title: "User Assignment Overview",
          type: "bar",
          data: userAssignmentData.map((item) => ({
            username: item.username,
            nickname: item.nickname || item.username,
            role: item.role,
            submitted: Number(item.submitted || 0),
            approved: Number(item.approved || 0),
            rejected: Number(item.rejected || 0),
            pending: Number(item.pending || 0),
            lateCount: Number(item.lateCount || 0),
          })),
          colors: {
            submitted: "#3b82f6",
            approved: "#10b981",
            rejected: "#ef4444",
            pending: "#f59e0b",
          },
        },
        statusDistribution: {
          title: "Assignment Status Distribution",
          type: "pie",
          data: statusDistributionData.map((item) => ({
            name: item.name,
            value: Number(item.value || 0),
            percentage: Number(item.percentage || 0),
          })),
          colors: [
            "#10b981",
            "#ef4444",
            "#f59e0b",
            "#6b7280",
          ],
        },
        monthlyTrend: {
          title: `Tasks Completed By Month (${chartYear})`,
          type: "bar",
          data: monthlyTrendData.map((item) => ({
            month: item.month,
            approved: Number(item.approved || 0),
          })),
          colors: {
            approved: "var(--chart-3)",
          },
        },
        averageScoreByMonth: {
          title: "Average Score By Month",
          type: "line",
          data: averageScoreByMonthData.map((item) => ({
            month: item.month,
            averageScore: Math.round(parseFloat(String(item.averageScore)) || 0),
          })),
          colors: {
            averageScore: "var(--primary)",
          },
        },
        userScoreSummary: {
          title: "User Score Summary",
          type: "bar",
          data: userScoreSummaryData.map((item) => ({
            username: item.username,
            nickname: item.nickname || item.username,
            role: item.role,
            totalScore: Number(item.totalScore),
            assignmentCount: Number(item.assignmentCount),
          })),
          colors: {
            totalScore: "#8b5cf6",
            assignmentCount: "#06b6d4",
          },
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}