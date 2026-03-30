import { isAuthorize } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type {
  UserDashboardResponse,
  UserMonthlyTrend,
  UserStatusDistribution,
  UserScoreByMonth,
} from "@/types/dashboard";

export async function GET(request: NextRequest) {
  try {
    // isAuthorize
    const authResult = await isAuthorize(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const authUser = authResult.user!;
    
    // Only allow users to access their own data
    if (authUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Super Admin should use /api/assignment/dashboard/admin route" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const userId = searchParams.get("userId") || authUser.id;
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    // Calculate date range for the specified year and month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Run queries sequentially to avoid exceeding connection pool limit
    // KPI 1: Total Assignment (filter by userId, year and month)
    const totalAssignments = await prisma.assignment.count({
      where: {
        userId: userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // KPI 2: Total Approve (filter by userId, status = "approved", year and month)
    const totalApproved = await prisma.assignment.count({
      where: {
        userId: userId,
        status: "Approved",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // KPI 3: Total Reject (filter by userId, status = "rejected", year and month)
    const totalRejected = await prisma.assignment.count({
      where: {
        userId: userId,
        status: "Rejected",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // KPI 4: Total Score (filter by userId, year and month)
    const totalScore = await prisma.assignment.aggregate({
      where: {
        userId: userId,
        finalScore: {
          gt: 0,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        finalScore: true,
      },
    });

    // Chart 1: Monthly Trend (User's assignment trend over months for selected year)
    const monthlyTrendData = await prisma.$queryRaw<UserMonthlyTrend[]>`
      WITH all_months AS (
        SELECT 
          generate_series(
            MAKE_DATE(${year}, 1, 1),
            MAKE_DATE(${year}, 12, 1),
            INTERVAL '1 month'
          ) as month_start
      ),
      monthly_data AS (
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM') as month,
          COUNT(*) as assigned
        FROM "Assignment" 
        WHERE "userId" = ${userId}
          AND EXTRACT(YEAR FROM "createdAt") = ${year}
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      )
      SELECT 
        TO_CHAR(am.month_start, 'YYYY-MM') as month,
        COALESCE(md.assigned, 0) as assigned
      FROM all_months am
      LEFT JOIN monthly_data md ON TO_CHAR(am.month_start, 'YYYY-MM') = md.month
      ORDER BY am.month_start
    `;

    // Chart 2: Status Distribution (User's assignment status distribution)
    const statusDistributionData = await prisma.$queryRaw<UserStatusDistribution[]>`
      WITH total_assignments AS (
        SELECT COUNT(*) as total
        FROM "Assignment" 
        WHERE "userId" = ${userId}
          AND "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
      )
      SELECT 
        'Pending' as name,
        COUNT(*) as value,
        ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
      FROM "Assignment" 
      WHERE "userId" = ${userId}
        AND status = 'Pending'
        AND "createdAt" >= ${startDate} 
        AND "createdAt" <= ${endDate}
      
      UNION ALL
      
      SELECT 
        'Approved' as name,
        COUNT(*) as value,
        ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
      FROM "Assignment" 
      WHERE "userId" = ${userId}
        AND status = 'Approved'
        AND "createdAt" >= ${startDate} 
        AND "createdAt" <= ${endDate}
      
      UNION ALL
      
      SELECT 
        'Rejected' as name,
        COUNT(*) as value,
        ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
      FROM "Assignment" 
      WHERE "userId" = ${userId}
        AND status = 'Rejected'
        AND "createdAt" >= ${startDate} 
        AND "createdAt" <= ${endDate}
    `;

    // Chart 3: Score By Month (User's total score per month for selected year)
    const scoreByMonthData = await prisma.$queryRaw<UserScoreByMonth[]>`
      WITH all_months AS (
        SELECT 
          generate_series(
            MAKE_DATE(${year}, 1, 1),
            MAKE_DATE(${year}, 12, 1),
            INTERVAL '1 month'
          ) as month_start
      ),
      monthly_scores AS (
        SELECT 
          TO_CHAR(a."createdAt", 'YYYY-MM') as month,
          COALESCE(SUM(a."finalScore"), 0) as score
        FROM "Assignment" a
        WHERE a."userId" = ${userId}
          AND EXTRACT(YEAR FROM a."createdAt") = ${year}
          AND a."finalScore" > 0
        GROUP BY TO_CHAR(a."createdAt", 'YYYY-MM')
      )
      SELECT 
        TO_CHAR(am.month_start, 'YYYY-MM') as month,
        COALESCE(CAST(ms.score AS NUMERIC), 0) as score
      FROM all_months am
      LEFT JOIN monthly_scores ms ON TO_CHAR(am.month_start, 'YYYY-MM') = ms.month
      ORDER BY am.month_start
    `;

    // Format response data
    const response: UserDashboardResponse = {
      role: "USER",
      period: { year, month, userId },
      kpis: {
        totalAssignments,
        totalApproved,
        totalRejected,
        totalScore: totalScore._sum.finalScore || 0,
      },
      charts: {
        // Chart 1: Monthly Trend
        monthlyTrend: {
          title: `Assignment Trend (${year})`,
          type: "line",
          data: monthlyTrendData.map((item) => ({
            month: item.month,
            assigned: Number(item.assigned || 0),
          })),
          colors: {
            assigned: "#3b82f6",
          },
        },

        // Chart 2: Status Distribution
        statusDistribution: {
          title: "Assignment Status Distribution",
          type: "pie",
          data: statusDistributionData.map((item) => ({
            name: item.name,
            value: Number(item.value || 0),
            percentage: Number(item.percentage || 0),
          })),
          colors: [
            "#6b7280", // Pending - Gray
            "#10b981", // Approved - Green
            "#ef4444", // Rejected - Red
          ],
        },

        // Chart 3: Score By Month
        scoreByMonth: {
          title: `Score By Month (${year})`,
          type: "line",
          data: scoreByMonthData.map((item) => ({
            month: item.month,
            score: Math.round(parseFloat(String(item.score)) || 0),
          })),
          colors: {
            score: "var(--chart-3)",
          },
        },
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("User dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
