"use client";

import LevelBadge from "@/components/shared/level-badge";
import { LeaderboardEntry, ILevel } from "@/types/level";
import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useGetLevels } from "@/hooks/use-level";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

function resolveProgress(score: number, levels: ILevel[]) {
  const sorted = [...levels].sort((a, b) => a.minScore - b.minScore);
  const current = sorted.find((l) => score >= l.minScore && score <= l.maxScore)
    ?? sorted.filter((l) => score > l.maxScore).at(-1)
    ?? null;
  const next = current
    ? sorted.find((l) => l.minScore > current.maxScore) ?? null
    : sorted[0] ?? null;

  if (!current) return { progress: 0, color: null, nextName: next ? `${next.emoji} ${next.name}` : null };

  const rangeSize = current.maxScore - current.minScore;
  const progress = rangeSize > 0
    ? Math.min(100, Math.round(((score - current.minScore) / rangeSize) * 100))
    : 100;

  return { progress, color: current.color, nextName: next ? `${next.emoji} ${next.name}` : null };
}

function LevelProgressBar({ score, levels }: { score: number; levels: ILevel[] }) {
  const { progress, color, nextName } = resolveProgress(score, levels);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setAnimated(progress), 300);
    return () => clearTimeout(id);
  }, [progress]);

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-1500 ease-out"
          style={{
            width: `${animated}%`,
            backgroundColor: color ?? "hsl(var(--primary))",
          }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="tabular-nums">{progress}%</span>
        {nextName && <span className="truncate max-w-20">→ {nextName}</span>}
      </div>
    </div>
  );
}

const rankConfig = {
  1: {
    border: "border-yellow-400/60",
    bg: "bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-950/30 dark:to-card",
    ring: "ring-2 ring-yellow-400/40",
    numBg: "bg-yellow-500 text-white",
    scoreColor: "text-yellow-600 dark:text-yellow-400",
    scale: "scale-105 z-1",
  },
  2: {
    border: "border-slate-300/60",
    bg: "bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/30 dark:to-card",
    ring: "ring-1 ring-slate-300/40",
    numBg: "bg-slate-400 text-white",
    scoreColor: "text-slate-600 dark:text-slate-300",
    scale: "",
  },
  3: {
    border: "border-orange-300/60",
    bg: "bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/20 dark:to-card",
    ring: "ring-1 ring-orange-300/40",
    numBg: "bg-orange-500 text-white",
    scoreColor: "text-orange-600 dark:text-orange-400",
    scale: "",
  },
} as const;

const fallbackConfig = {
  border: "border-border",
  bg: "bg-card",
  ring: "",
  numBg: "bg-muted text-muted-foreground",
  scoreColor: "text-foreground",
  scale: "",
};

interface PodiumCardProps {
  entry: LeaderboardEntry;
  isMe: boolean;
}

// Delay per rank slot in podium order (2nd=0, 1st=150ms, 3rd=300ms)
const slideDelayByRank: Record<number, number> = { 1: 400, 2: 200, 3: 0 };

export default function PodiumCard({ entry, isMe }: PodiumCardProps) {
  const rank = entry.rank as 1 | 2 | 3;
  const isFirst = rank === 1;
  const cfg = rankConfig[rank] ?? fallbackConfig;

  const { data: levels = [] } = useGetLevels();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const delay = slideDelayByRank[rank] ?? 0;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={cn(
        "relative flex flex-col items-center gap-2 sm:gap-3 rounded-2xl border p-3 sm:p-5 mb-6",
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
        cfg.border,
        cfg.bg,
        cfg.ring,
        cfg.scale,
        isMe && "ring-2 ring-primary/50",
        isFirst ? "w-full sm:w-52" : "w-full sm:w-44",
      )}
    >
      {isFirst && (
        <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 size-7 text-yellow-500 fill-yellow-400" />
      )}

      {/* Rank badge */}
      <span
        className={cn(
          "absolute top-3 left-3 size-7 rounded-full flex items-center justify-center text-xs font-bold",
          cfg.numBg,
        )}
      >
        {rank}
      </span>

      {/* Avatar */}
      <Avatar
        className={cn(
          "border-4 shrink-0",
          cfg.border,
          isFirst ? "size-12 sm:size-20" : "size-10 sm:size-16",
        )}
      >
        <AvatarImage src={entry.profileImage ?? undefined} alt={entry.nickname || entry.username} />
        <AvatarFallback
          className={cn(
            "font-bold text-primary bg-primary/15",
            isFirst ? "text-lg sm:text-2xl" : "text-base sm:text-xl",
          )}
        >
          {(entry.nickname || entry.username).slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <div className="text-center">
        <p className={cn("font-bold truncate max-w-24 sm:max-w-36", isFirst ? "text-sm sm:text-base" : "text-xs sm:text-sm")}>
          {entry.nickname || entry.username}
          {isMe && <span className="ml-1 text-xs text-primary font-normal">(You)</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate">@{entry.username}</p>
      </div>

      {/* Level */}
      {entry.level && <LevelBadge level={entry.level} size="sm" />}

      {/* Progress Bar */}
      {levels.length > 0 && (
        <LevelProgressBar score={entry.totalScore} levels={levels} />
      )}

      {/* Score */}
      <p className={cn("font-bold tabular-nums", isFirst ? "text-lg sm:text-2xl" : "text-base sm:text-xl", cfg.scoreColor)}>
        {entry.totalScore.toLocaleString()}
        <span className="text-xs font-normal text-muted-foreground ml-1">pts</span>
      </p>
    </div>
  );
}
