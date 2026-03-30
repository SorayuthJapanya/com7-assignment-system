"use client";

import { useAdminDashboard } from "@/hooks/user-dashboard";
import KpiCard from "../card/kpi-card";
import { TrendingUp, Users, AlertCircle, ClipboardCheck } from "lucide-react";
import ChartsSection from "./charts-section";

interface SuperAdminDashboardProps {
  year: number;
  month: number;
}

export default function SuperAdminDashboard({
  year,
  month,
}: SuperAdminDashboardProps) {
  const { data: dashboardData, isLoading } = useAdminDashboard({ year, month });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Section - TA Team Performance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="All Assignments" 
          value={dashboardData?.kpis?.totalAssignments?.toString() || "0"} 
          icon={<ClipboardCheck className="size-5" />} 
          suffix="Tasks"
        />
        <KpiCard 
          title="Completion Rate" 
          value={dashboardData?.kpis?.totalSubmitted && dashboardData?.kpis?.totalAssignments 
            ? Math.round((dashboardData.kpis.totalSubmitted / dashboardData.kpis.totalAssignments) * 100).toString()
            : "0"} 
          icon={<TrendingUp className="size-5" />} 
          suffix="%"
        />
        <KpiCard 
          title="Avg Score" 
          value={dashboardData?.kpis?.averageScore?.toString() || "0"} 
          icon={<AlertCircle className="size-5" />} 
          suffix="Points"
        />
        <KpiCard 
          title="Late Submissions" 
          value={dashboardData?.kpis?.lateSubmissions?.toString() || "0"} 
          icon={<Users className="size-5" />} 
          suffix="Tasks"
        />
      </div>

      {/* Charts Section */}
      <ChartsSection charts={dashboardData?.charts} />
    </div>
  );
}
