"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserDashboardKPIs } from "@/types/dashboard";
import { useGetLevels } from "@/hooks/use-level";
import { usePublicLeaderboard } from "@/hooks/use-leaderboard";
import { ILevel } from "@/types/level";
import { FileText, Medal, Shield, Star, TrendingUp, BarChart2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ProfileCardProps {
  user: {
    id: string;
    username: string;
    nickname: string;
    email: string;
    role: string;
    profileImage?: string;
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
  INTERN: {
    label: "Intern",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
};

function resolveLevel(score: number, levels: ILevel[]) {
  const sorted = [...levels].sort((a, b) => a.minScore - b.minScore);
  const current = sorted.filter((l) => score >= l.minScore && score <= l.maxScore)[0]
    ?? sorted.filter((l) => score > l.maxScore).at(-1)
    ?? null;
  const next = current
    ? sorted.find((l) => l.minScore > current.maxScore) ?? null
    : sorted[0] ?? null;

  let progress = 0;
  let scoreInRange = 0;
  let rangeSize = 0;

  if (current) {
    rangeSize = current.maxScore - current.minScore;
    scoreInRange = score - current.minScore;
    progress = rangeSize > 0 ? Math.min(100, Math.round((scoreInRange / rangeSize) * 100)) : 100;
  } else if (next) {
    rangeSize = next.maxScore - next.minScore;
    scoreInRange = score;
    progress = rangeSize > 0 ? Math.min(100, Math.round((score / next.maxScore) * 100)) : 0;
  }

  return { current, next, progress, scoreInRange: current ? scoreInRange : score, rangeSize };
}

export default function ProfileCard({ user, kpis }: ProfileCardProps) {
  const { data: levels = [] } = useGetLevels();
  const { data: leaderboardData } = usePublicLeaderboard({ limit: 200 });

  const myEntry = leaderboardData?.leaderboard?.find((e) => e.userId === user.id);
  const myRank = myEntry?.rank ?? null;

  const initials = user.nickname
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const role = roleConfig[user.role] || roleConfig.STAFF;
  const totalScore = myEntry?.totalScore ?? kpis?.totalScore ?? 0;
  const { current: currentLevel, next: nextLevel, progress } = resolveLevel(totalScore, levels);

  const [animatedProgress, setAnimatedProgress] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(id);
  }, [progress]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-102">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-primary/3 blur-2xl" />

      <div className="relative flex flex-col gap-5">
        {/* Top row: Avatar + User Info  ↔  Quick KPIs */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Avatar + User Info */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar with gradient ring */}
            <div className="relative shrink-0">
              <div
                className="absolute -inset-1 rounded-full opacity-75 blur-sm"
                style={
                  currentLevel
                    ? { background: `linear-gradient(135deg, ${currentLevel.color}, ${currentLevel.color}80)` }
                    : { background: "linear-gradient(135deg, var(--primary), var(--chart-1))" }
                }
              />
              <Avatar className="relative size-16 sm:size-20 ring-2 ring-background">
                <AvatarImage src={user.profileImage} alt={user.nickname} />
                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-xl sm:text-2xl font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Level badge on avatar */}
              {currentLevel ? (
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[11px] font-bold shadow-md whitespace-nowrap"
                  style={{ backgroundColor: currentLevel.color, color: "#fff" }}
                >
                  {currentLevel.emoji}
                </div>
              ) : (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground shadow-md">
                  {user.role === "SUPER_ADMIN" ? "SA" : user.role === "ADMIN" ? "ADM" : "STF"}
                </div>
              )}
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
                {/* Level chip */}
                {currentLevel && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: `${currentLevel.color}20`,
                      color: currentLevel.color,
                      borderColor: `${currentLevel.color}40`,
                    }}
                  >
                    {currentLevel.emoji} {currentLevel.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Right: Quick KPI Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 sm:flex-nowrap sm:justify-end sm:gap-x-4">
            <QuickStat
              icon={<Medal className="size-4" />}
              value={myRank ? `#${myRank}` : "—"}
              label="Rank"
              colorClass="text-rose-400"
            />
            <div className="hidden h-10 w-px bg-border/50 sm:block" />
            <QuickStat
              icon={<TrendingUp className="size-4" />}
              value={kpis?.totalAssignments?.toString() || "0"}
              label="Assignments"
              colorClass="text-blue-400"
            />
            <div className="hidden h-10 w-px bg-border/50 sm:block" />
            <QuickStat
              icon={<FileText className="size-4" />}
              value={
                kpis && kpis.totalAssignments > 0
                  ? `${kpis.totalApproved}`
                  : "0"
              }
              label="Approval"
              colorClass="text-primary"
            />
            <div className="hidden h-10 w-px bg-border/50 sm:block" />
            <QuickStat
              icon={<Star className="size-4" />}
              value={kpis?.totalScore?.toString() || "0"}
              label="Score"
              colorClass="text-amber-400"
            />
            <div className="hidden h-10 w-px bg-border/50 sm:block" />
            <QuickStat
              icon={<BarChart2 className="size-4" />}
              value={kpis?.avgScore?.toString() || "0"}
              label="Avg Score"
              colorClass="text-emerald-400"
            />
          </div>
        </div>

        {/* Level Progress Bar */}
        {levels.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">
                {currentLevel
                  ? `${currentLevel.emoji} ${currentLevel.name} — ${totalScore - currentLevel.minScore} / ${currentLevel.maxScore - currentLevel.minScore} pts`
                  : "No level yet"}
              </span>
              <span className="font-medium text-muted-foreground">
                {nextLevel
                  ? `Next: ${nextLevel.emoji} ${nextLevel.name} (${nextLevel.minScore} pts)`
                  : currentLevel
                  ? "Max level reached"
                  : ""}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-[2000ms] ease-out"
                style={{
                  width: `${animatedProgress}%`,
                  backgroundColor: currentLevel?.color ?? "hsl(var(--primary))",
                }}
              />
            </div>
            <p className="text-right text-[11px] text-muted-foreground">
              {nextLevel ? `${progress}% to next level` : currentLevel ? "Max level reached 🎉" : ""}
            </p>
          </div>
        )}
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
