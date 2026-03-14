"use client";

import { useMemo } from "react";
import { UserAssignmentStatusChart } from "../chart/user-assign-status";
import { StatusDistributionChart } from "../chart/status-distribution";
import { MonthlyTrendChart } from "../chart/monthly-trend";
import {
  UserAssignmentStatus,
  StatusDistribution,
  ChartData,
  MonthlyTrend,
  UserScoreSummary,
} from "@/types/dashboard";
import { UserSummaryScoreChart } from "../chart/user-summary-score";

interface ChartsSectionProps {
  charts?: {
    userAssignmentStatus?: ChartData<UserAssignmentStatus>;
    statusDistribution?: ChartData<StatusDistribution>;
    monthlyTrend?: ChartData<MonthlyTrend>;
    userScoreSummary?: ChartData<UserScoreSummary>;
  };
}

export default function ChartsSection({ charts }: ChartsSectionProps) {
  // Memoize chart data to prevent unnecessary re-renders
  const userAssignmentData = useMemo(
    () => charts?.userAssignmentStatus?.data || [],
    [charts?.userAssignmentStatus?.data],
  );

  const statusDistributionData = useMemo(
    () => ({
      data: charts?.statusDistribution?.data || [],
      colors: charts?.statusDistribution?.colors as string[] | undefined,
    }),
    [charts?.statusDistribution?.data, charts?.statusDistribution?.colors],
  );

  const monthlyTrendData = useMemo(
    () => charts?.monthlyTrend?.data || [],
    [charts?.monthlyTrend?.data],
  );

  const userSummaryScoreData = useMemo(
    () => charts?.userScoreSummary?.data || [],
    [charts?.userScoreSummary?.data],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Assignment Status Chart */}
        {charts?.userAssignmentStatus && (
          <UserAssignmentStatusChart dashboardData={userAssignmentData} />
        )}

        {/* Status Distribution Chart */}
        <StatusDistributionChart
          data={statusDistributionData.data}
          colors={statusDistributionData.colors}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend Chart */}
        {charts?.monthlyTrend && (
          <MonthlyTrendChart dashboardData={monthlyTrendData} />
        )}

        {/* User Summary Score Chart */}
        {charts?.userScoreSummary && (
          <UserSummaryScoreChart dashboardData={userSummaryScoreData} />
        )}
      </div>
    </div>
  );
}
