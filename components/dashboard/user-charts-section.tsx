"use client";

import {
  ChartData,
  UserMonthlyTrend,
  UserStatusDistribution,
} from "@/types/dashboard";
import React, { useMemo } from "react";
import { UserMonthlyTrendChart } from "../chart/user-monthly-trend";
import { StatusDistributionChart } from "../chart/status-distribution";

interface UserChartsSectionProps {
  charts?: {
    monthlyTrend?: ChartData<UserMonthlyTrend>;
    statusDistribution?: ChartData<UserStatusDistribution>;
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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <UserMonthlyTrendChart dashboardData={monthlyTrendData || []} />
      <StatusDistributionChart
        data={statusDistributionData || []}
        colors={charts?.statusDistribution?.colors}
      />
    </div>
  );
}
