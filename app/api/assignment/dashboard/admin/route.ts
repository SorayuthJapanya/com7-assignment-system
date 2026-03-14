import { isAuthorize } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type {
  AdminDashboardResponse,
  UserAssignmentStatus,
  StatusDistribution,
  MonthlyTrend,
  UserScoreSummary,
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

    // Only allow Super Admin to access this route
    if (authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only Super Admin can access this route" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    // Get query parameters
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString(),
    );
    const month = parseInt(
      searchParams.get("month") || (new Date().getMonth() + 1).toString(),
    );

    // Calculate date range for the specified year and month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get KPIs and Charts data in parallel
    const [
      totalAssignments,
      totalSubmittedRaw,
      totalApproved,
      averageScore,
      userAssignmentData,
      statusDistributionData,
      monthlyTrendData,
      userScoreSummaryData,
    ] = await Promise.all([
      // KPIs
      prisma.assignment.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM "Assignment" 
        WHERE "submitAt" > "createdAt" 
        AND "createdAt" >= ${startDate} 
        AND "createdAt" <= ${endDate}
      `,

      prisma.assignment.count({
        where: {
          status: "Approved",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      prisma.assignment.aggregate({
        where: {
          finalScore: {
            gt: 0,
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _avg: {
          finalScore: true,
        },
      }),

      // Chart 1: User Assignment Status Overview
      prisma.$queryRaw`
        SELECT 
          u.username,
          u.nickname,
          COUNT(CASE WHEN a."submitAt" > a."createdAt" THEN 1 END) as submitted,
          COUNT(CASE WHEN a.status = 'Approved' THEN 1 END) as approved,
          COUNT(CASE WHEN a.status = 'Rejected' THEN 1 END) as rejected,
          COUNT(CASE WHEN a.status = 'Pending' THEN 1 END) as pending
        FROM "User" u
        LEFT JOIN "Assignment" a ON u.id = a."userId" 
          AND a."createdAt" >= ${startDate} 
          AND a."createdAt" <= ${endDate}
        WHERE u.role != 'SUPER_ADMIN'
        GROUP BY u.id, u.username, u.nickname
        ORDER BY u.username
      ` as Promise<UserAssignmentStatus[]>,

      // Chart 2: Status Distribution
      prisma.$queryRaw`
        WITH total_assignments AS (
          SELECT COUNT(*) as total
          FROM "Assignment" 
          WHERE "createdAt" >= ${startDate} 
            AND "createdAt" <= ${endDate}
        )
        SELECT 
          'Submitted' as name,
          COUNT(*) as value,
          ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
        FROM "Assignment" 
        WHERE "submitAt" > "createdAt" 
          AND "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
        
        UNION ALL
        
        SELECT 
          'Approved' as name,
          COUNT(*) as value,
          ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
        FROM "Assignment" 
        WHERE status = 'Approved'
          AND "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
        
        UNION ALL
        
        SELECT 
          'Rejected' as name,
          COUNT(*) as value,
          ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
        FROM "Assignment" 
        WHERE status = 'Rejected'
          AND "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
        
        UNION ALL
        
        SELECT 
          'Late Submit' as name,
          COUNT(*) as value,
          ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
        FROM "Assignment" 
        WHERE "submitAt" > "deadline"
          AND "submitAt" > "createdAt"
          AND "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
        
        UNION ALL
        
        SELECT 
          'Pending' as name,
          COUNT(*) as value,
          ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_assignments), 0), 2) as percentage
        FROM "Assignment" 
        WHERE status = 'Pending'
          AND "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
      ` as Promise<StatusDistribution[]>,

      // Chart 3: Monthly Trend
      prisma.$queryRaw`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM') as month,
          COUNT(*) as total,
          COUNT("submissionUrl" != '') as submitted,
          COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected,
          COUNT(CASE WHEN "submitAt" > "deadline" THEN 1 END) as lateSubmit
        FROM "Assignment" 
        WHERE "createdAt" >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
          AND "createdAt" <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month
      ` as Promise<MonthlyTrend[]>,

      // Chart 4: User Score Summary
      prisma.$queryRaw`
       SELECT 
          u.username,
          u.nickname,
          COALESCE(SUM(s.score), 0) as "totalScore",
          COUNT(s.id) as "assignmentCount"
        FROM "User" u
        LEFT JOIN "Score" s ON u.id = s."recipient_id"
        GROUP BY u.id, u.username, u.nickname
        ORDER BY "totalScore" DESC
      ` as Promise<UserScoreSummary[]>,
    ]);

    console.log(
      "Raw userScoreSummaryData length:",
      userScoreSummaryData.length,
    );
    if (userScoreSummaryData.length > 0) {
      console.log("First raw item:", userScoreSummaryData[0]);
    }

    const totalSubmitted = Array.isArray(totalSubmittedRaw)
      ? Number((totalSubmittedRaw[0] as { count: bigint })?.count || 0)
      : 0;

    // Format response data
    const response: AdminDashboardResponse = {
      role: "SUPER_ADMIN",
      period: { year, month },
      kpis: {
        totalAssignments,
        totalSubmitted,
        totalApproved,
        averageScore: Math.round(averageScore._avg.finalScore || 0),
      },
      charts: {
        // Chart 1: User Assignment Status Overview
        userAssignmentStatus: {
          title: "User Assignment Overview",
          type: "bar",
          data: userAssignmentData.map((item) => ({
            username: item.username,
            nickname: item.nickname || item.username,
            submitted: Number(item.submitted || 0),
            approved: Number(item.approved || 0),
            rejected: Number(item.rejected || 0),
            pending: Number(item.pending || 0),
          })),
          colors: {
            submitted: "#3b82f6",
            approved: "#10b981",
            rejected: "#ef4444",
            pending: "#f59e0b",
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
            "#3b82f6", // Submitted - Blue
            "#10b981", // Approved - Green
            "#ef4444", // Rejected - Red
            "#f59e0b", // Late Submit - Orange
            "#6b7280", // Pending - Gray
          ],
        },

        // Chart 3: Monthly Trend
        monthlyTrend: {
          title: "Monthly Assignment Trend",
          type: "line",
          data: monthlyTrendData.map((item) => ({
            month: item.month,
            total: Number(item.total || 0),
            submitted: Number(item.submitted || 0),
            approved: Number(item.approved || 0),
            rejected: Number(item.rejected || 0),
            lateSubmit: Number(item.lateSubmit || 0),
          })),
          colors: {
            total: "#6b7280",
            submitted: "#3b82f6",
            approved: "#10b981",
            rejected: "#ef4444",
            lateSubmit: "#f59e0b",
          },
        },

        // Chart 4: User Score Summary
        userScoreSummary: {
          title: "User Score Summary",
          type: "bar",
          data: userScoreSummaryData.map((item) => {
            const mappedItem = {
              username: item.username,
              nickname: item.nickname || item.username,
              totalScore: Number(item.totalScore),
              assignmentCount: Number(item.assignmentCount),
            };
            console.log("Mapped item:", mappedItem);
            return mappedItem;
          }),
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
