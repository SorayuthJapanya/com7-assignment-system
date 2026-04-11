"use client";

import {
  ChartData,
  UserMonthlyTrend,
  UserStatusDistribution,
  UserScoreByMonth,
} from "@/types/dashboard";
import React, { useMemo } from "react";
import { UserMonthlyTrendChart } from "../chart/user-monthly-trend";
import { StatusDistributionChart } from "../chart/status-distribution";
import { UserScoreByMonthChart } from "../chart/user-score-by-month";

interface UserChartsSectionProps {
  charts?: {
    monthlyTrend?: ChartData<UserMonthlyTrend>;
    statusDistribution?: ChartData<UserStatusDistribution>;
    scoreByMonth?: ChartData<UserScoreByMonth>;
  };
}

export default function UserChartsSection({ charts }: UserChartsSectionProps) {
  const monthlyTrendData = useMemo(
    () => charts?.monthlyTrend?.data || [],
    [charts?.monthlyTrend?.data],
  );
  const statusDistributionData = useMemo(
    () => charts?.statusDistribution?.data || [],
    [charts?.statusDistribution?.data],
  );
  const scoreByMonthData = useMemo(
    () => charts?.scoreByMonth?.data || [],
    [charts?.scoreByMonth?.data],
  );
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <UserScoreByMonthChart dashboardData={scoreByMonthData || []} />
      <StatusDistributionChart
        data={statusDistributionData || []}
      />
    </div>
  );
}
