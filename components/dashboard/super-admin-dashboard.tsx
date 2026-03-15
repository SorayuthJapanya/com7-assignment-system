"use client";

import { useAdminDashboard } from "@/hooks/user-dashboard";
import KpiCard from "../card/kpi-card";
import { CheckCircle, FileText, Inbox, Star } from "lucide-react";
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
      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Total Assignments" 
          value={dashboardData?.kpis?.totalAssignments?.toString() || "0"} 
          icon={<FileText className="size-5" />} 
          suffix="Assign"
        />
        <KpiCard 
          title="Total Submitted" 
          value={dashboardData?.kpis?.totalSubmitted?.toString() || "0"} 
          icon={<Inbox className="size-5" />} 
          suffix="Submit"
        />
        <KpiCard 
          title="Total Approved" 
          value={dashboardData?.kpis?.totalApproved?.toString() || "0"} 
          icon={<CheckCircle className="size-5" />} 
          suffix="Approve"
        />
        <KpiCard 
          title="Average Score" 
          value={dashboardData?.kpis?.averageScore?.toString() || "0"} 
          icon={<Star className="size-5" />} 
          suffix="Score"
        />
      </div>

      {/* Charts Section */}
      <ChartsSection charts={dashboardData?.charts} />
    </div>
  );
}
