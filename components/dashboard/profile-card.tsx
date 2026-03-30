"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserDashboardKPIs } from "@/types/dashboard";
import { FileText, Shield, Star, TrendingUp } from "lucide-react";

interface ProfileCardProps {
  user: {
    id: string;
    username: string;
    nickname: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  kpis?: UserDashboardKPIs;
}

const roleConfig: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    color: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  ADMIN: {
    label: "Admin",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  STAFF: {
    label: "Staff",
    color: "bg-primary/15 text-primary border-primary/30",
  },
};

export default function ProfileCard({ user, kpis }: ProfileCardProps) {
  const initials = user.nickname
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const role = roleConfig[user.role] || roleConfig.STAFF;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-lg">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-primary/3 blur-2xl" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Avatar + User Info */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Avatar with gradient ring */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-primary/60 to-chart-1 opacity-75 blur-sm" />
            <Avatar className="relative size-16 sm:size-20 ring-2 ring-background">
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-xl sm:text-2xl font-bold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Level indicator */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-lg shadow-primary/30">
              {user.role === "SUPER_ADMIN" ? "SA" : user.role === "ADMIN" ? "ADM" : "STF"}
            </div>
          </div>

          {/* User details */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {user.nickname}
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${role.color}`}
              >
                <Shield className="size-3" />
                {role.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Right: Quick KPI Highlights */}
        <div className="flex items-center gap-3 sm:gap-4">
          <QuickStat
            icon={<TrendingUp className="size-4" />}
            value={kpis?.totalAssignments?.toString() || "0"}
            label="Assignments"
            colorClass="text-blue-400"
          />
          <div className="h-10 w-px bg-border/50" />
          <QuickStat
            icon={<Star className="size-4" />}
            value={kpis?.totalScore?.toString() || "0"}
            label="Score"
            colorClass="text-amber-400"
          />
          <div className="h-10 w-px bg-border/50" />
          <QuickStat
            icon={<FileText className="size-4" />}
            value={
              kpis && kpis.totalAssignments > 0
                ? `${Math.round((kpis.totalApproved / kpis.totalAssignments) * 100)}%`
                : "0%"
            }
            label="Approval"
            colorClass="text-primary"
          />
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  icon,
  value,
  label,
  colorClass,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  colorClass: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[60px]">
      <div className={`${colorClass} mb-0.5`}>{icon}</div>
      <span className="text-lg sm:text-xl font-bold tabular-nums">{value}</span>
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
