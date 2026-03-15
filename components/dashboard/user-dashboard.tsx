"use client";

import { useUserDashboard } from "@/hooks/user-dashboard";
import KpiCard from "../card/kpi-card";
import { CheckCircle, FileText, Star, XCircle } from "lucide-react";
import { useGetAssignments } from "@/hooks/use-assignment";
import UserChartsSection from "./user-charts-section";

interface UserDashboardProps {
  year: number;
  month: number;
}

export default function UserDashboard({ year, month }: UserDashboardProps) {
  const { data: dashboardData, isLoading: isDashboardLoading } =
    useUserDashboard({ year, month });
  const { data: assignments, isLoading: isAssignmentsLoading } =
    useGetAssignments({
      search: "",
      status: "not-submit",
      type: "all",
      page: 1,
      limit: 5,
      myAssignments: true,
    });

  if (isDashboardLoading || isAssignmentsLoading) {
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
          title="Total Approved"
          value={dashboardData?.kpis?.totalApproved?.toString() || "0"}
          icon={<CheckCircle className="size-5" />}
          suffix="Approve"
        />
        <KpiCard
          title="Total Rejected"
          value={dashboardData?.kpis?.totalRejected?.toString() || "0"}
          icon={<XCircle className="size-5" />}
          suffix="Reject"
        />
        <KpiCard
          title="Total Score"
          value={dashboardData?.kpis?.totalScore?.toString() || "0"}
          icon={<Star className="size-5" />}
          suffix="Score"
        />
      </div>

      {/* Charts Section */}
      <UserChartsSection charts={dashboardData?.charts} />
    </div>
  );
}
