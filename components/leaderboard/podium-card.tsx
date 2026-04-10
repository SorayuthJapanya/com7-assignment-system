"use client";

import LevelBadge from "@/components/shared/level-badge";
import { LeaderboardEntry } from "@/types/level";
import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
        "relative flex flex-col items-center gap-3 rounded-2xl border p-5 mb-6",
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
        cfg.border,
        cfg.bg,
        cfg.ring,
        cfg.scale,
        isMe && "ring-2 ring-primary/50",
        isFirst ? "w-52" : "w-44",
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
      <div
        className={cn(
          "rounded-full border-4 flex items-center justify-center font-bold text-primary bg-primary/15 shrink-0",
          cfg.border,
          isFirst ? "size-20 text-2xl" : "size-16 text-xl",
        )}
      >
        {(entry.nickname || entry.username).slice(0, 2).toUpperCase()}
      </div>

      {/* Name */}
      <div className="text-center">
        <p className={cn("font-bold truncate max-w-36", isFirst ? "text-base" : "text-sm")}>
          {entry.nickname || entry.username}
          {isMe && <span className="ml-1 text-xs text-primary font-normal">(You)</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate">@{entry.username}</p>
      </div>

      {/* Level */}
      {entry.level && <LevelBadge level={entry.level} size="sm" />}

      {/* Score */}
      <p className={cn("font-bold tabular-nums", isFirst ? "text-2xl" : "text-xl", cfg.scoreColor)}>
        {entry.totalScore.toLocaleString()}
        <span className="text-xs font-normal text-muted-foreground ml-1">pts</span>
      </p>
    </div>
  );
}
