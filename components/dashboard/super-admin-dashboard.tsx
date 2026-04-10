"use client";

import { useAdminDashboard } from "@/hooks/user-dashboard";
import KpiCard from "../card/kpi-card";
import { TrendingUp, AlertTriangle, Star, ClipboardCheck } from "lucide-react";
import ChartsSection from "./charts-section";

interface SuperAdminDashboardProps {
  year: number | null;
  month: number | null;
}

export default function SuperAdminDashboard({
  year,
  month,
}: SuperAdminDashboardProps) {
  const { data: dashboardData, isLoading } = useAdminDashboard({ year, month });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const completionRate =
    dashboardData?.kpis?.totalSubmitted && dashboardData?.kpis?.totalAssignments
      ? Math.round(
          (dashboardData.kpis.totalSubmitted / dashboardData.kpis.totalAssignments) * 100,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="All Assignments"
          value={dashboardData?.kpis?.totalAssignments?.toString() || "0"}
          icon={<ClipboardCheck className="size-5" />}
          suffix="Tasks"
          color="blue"
        />
        <KpiCard
          title="Completion Rate"
          value={completionRate.toString()}
          icon={<TrendingUp className="size-5" />}
          suffix="%"
          color="green"
        />
        <KpiCard
          title="Avg Score"
          value={dashboardData?.kpis?.averageScore?.toString() || "0"}
          icon={<Star className="size-5" />}
          suffix="Points"
          color="purple"
        />
        <KpiCard
          title="Late Submissions"
          value={dashboardData?.kpis?.lateSubmissions?.toString() || "0"}
          icon={<AlertTriangle className="size-5" />}
          suffix="Tasks"
          color="orange"
        />
      </div>

      <ChartsSection charts={dashboardData?.charts} />
    </div>
  );
}
