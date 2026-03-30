"use client";

import { useMemo } from "react";
import { UserAssignmentStatusChart } from "../chart/user-assign-status";
import { StatusDistributionChart } from "../chart/status-distribution";
import { MonthlyTrendChart } from "../chart/monthly-trend";
import { AverageScoreByMonthChart } from "../chart/average-score-by-month";
import {
  UserAssignmentStatus,
  StatusDistribution,
  ChartData,
  MonthlyTrend,
  UserScoreSummary,
  AverageScoreByMonth,
} from "@/types/dashboard";

interface ChartsSectionProps {
  charts?: {
    userAssignmentStatus?: ChartData<UserAssignmentStatus>;
    statusDistribution?: ChartData<StatusDistribution>;
    monthlyTrend?: ChartData<MonthlyTrend>;
    averageScoreByMonth?: ChartData<AverageScoreByMonth>;
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

  const averageScoreByMonthData = useMemo(
    () => charts?.averageScoreByMonth?.data || [],
    [charts?.averageScoreByMonth?.data],
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
        {/* Average Score By Month Chart */}
        {charts?.averageScoreByMonth && (
          <AverageScoreByMonthChart dashboardData={averageScoreByMonthData} />
        )}
        
        {/* Monthly Trend Chart */}
        {charts?.monthlyTrend && (
          <MonthlyTrendChart dashboardData={monthlyTrendData} />
        )}

      </div>
    </div>
  );
}
