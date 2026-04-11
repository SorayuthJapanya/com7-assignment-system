"use client";

import { useUserDashboard } from "@/hooks/user-dashboard";
import { Loader2 } from "lucide-react";
import { useGetAssignments } from "@/hooks/use-assignment";
import UserChartsSection from "./user-charts-section";
import ProfileCard from "./profile-card";
import UserInfoGrid from "./user-info-grid";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "../ui/skeleton";

interface UserDashboardProps {
  year: number | null;
  month: number | null;
}

export default function UserDashboard({ year, month }: UserDashboardProps) {
  const { user } = useAuth();
  const { data: dashboardData, isLoading: isDashboardLoading } =
    useUserDashboard({ year, month });

  if (isDashboardLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Profile Hero Card */}
      {user && (
        <ProfileCard
          user={{
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }}
          kpis={dashboardData?.kpis}
        />
      )}

      {/* User Info Grid */}
      {user && (
        <UserInfoGrid
          user={{
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }}
        />
      )}

      {/* Charts Section */}
      <UserChartsSection charts={dashboardData?.charts} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile skeleton */}
      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <Skeleton className="size-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex gap-6">
            <Skeleton className="h-16 w-20" />
            <Skeleton className="h-16 w-20" />
            <Skeleton className="h-16 w-20" />
          </div>
        </div>
      </div>

      {/* KPI skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Info grid skeleton */}
      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <Skeleton className="h-5 w-48 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center gap-2 text-muted-foreground py-2">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Loading dashboard data...</span>
      </div>
    </div>
  );
}
