"use client";

import { useMemo } from "react";
import { UserAssignmentStatusChart } from "../chart/user-assign-status";
import { StatusDistributionChart } from "../chart/status-distribution";
import { MonthlyTrendChart } from "../chart/monthly-trend";
import LeaderboardCard from "./leaderboard-card";
import {
  UserAssignmentStatus,
  StatusDistribution,
  ChartData,
  MonthlyTrend,
} from "@/types/dashboard";

interface ChartsSectionProps {
  charts?: {
    userAssignmentStatus?: ChartData<UserAssignmentStatus>;
    statusDistribution?: ChartData<StatusDistribution>;
    monthlyTrend?: ChartData<MonthlyTrend>;
  };
}

export default function ChartsSection({ charts }: ChartsSectionProps) {
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

  return (
    <div className="space-y-4">
      {/* Row 1: User Assignment Status (1/2) | Assignment Status Distribution (1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UserAssignmentStatusChart dashboardData={userAssignmentData} />
        <StatusDistributionChart
          data={statusDistributionData.data}
        />
      </div>

      {/* Row 2: Monthly Trend Line (2/3) | Top 5 Leaderboard (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MonthlyTrendChart dashboardData={monthlyTrendData} />
        </div>
        <div className="lg:col-span-1">
          <LeaderboardCard />
        </div>
      </div>
    </div>
  );
}
