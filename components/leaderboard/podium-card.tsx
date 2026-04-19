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
  const current =
    sorted.find((l) => score >= l.minScore && score <= l.maxScore) ??
    sorted.filter((l) => score > l.maxScore).at(-1) ??
    null;
  const next = current
    ? sorted.find((l) => l.minScore > current.maxScore) ?? null
    : sorted[0] ?? null;

  if (!current)
    return { progress: 0, color: null, nextName: next ? `${next.emoji} ${next.name}` : null };

  const rangeSize = current.maxScore - current.minScore;
  const progress =
    rangeSize > 0
      ? Math.min(100, Math.round(((score - current.minScore) / rangeSize) * 100))
      : 100;

  return {
    progress,
    color: current.color,
    nextName: next ? `${next.emoji} ${next.name}` : null,
  };
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
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-1500 ease-out"
          style={{ width: `${animated}%`, backgroundColor: color ?? "#a78bfa" }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-white/40">
        <span className="tabular-nums">{progress}%</span>
        {nextName && <span className="truncate max-w-20">→ {nextName}</span>}
      </div>
    </div>
  );
}

const rankConfig = {
  1: {
    ring: "#fbbf24",
    ringGlow: "0 0 0 3px #fbbf24, 0 0 18px #f59e0baa, 0 0 36px #f59e0b44",
    badge: { bg: "#eab308", text: "#000" },
    scoreColor: "#fbbf24",
    scoreGlow: "0 0 12px #fbbf2488",
    platform: "linear-gradient(135deg, #92400e, #fbbf24 50%, #92400e)",
    platformGlow: "0 4px 20px #f59e0bcc",
    platformH: 14,
    cardBorderColor: "#fbbf2450",
    cardGlow: "0 0 40px #fbbf2420, 0 8px 32px #0d052088",
    sparkle: "#fbbf24",
  },
  2: {
    ring: "#94a3b8",
    ringGlow: "0 0 0 3px #94a3b8, 0 0 14px #64748baa, 0 0 28px #64748b44",
    badge: { bg: "#64748b", text: "#fff" },
    scoreColor: "#cbd5e1",
    scoreGlow: "0 0 10px #94a3b866",
    platform: "linear-gradient(135deg, #334155, #94a3b8 50%, #334155)",
    platformGlow: "0 4px 15px #94a3b8aa",
    platformH: 10,
    cardBorderColor: "#94a3b840",
    cardGlow: "0 0 24px #94a3b815, 0 8px 24px #0d052088",
    sparkle: "#94a3b8",
  },
  3: {
    ring: "#fb923c",
    ringGlow: "0 0 0 3px #fb923c, 0 0 14px #ea580caa, 0 0 28px #ea580c44",
    badge: { bg: "#ea580c", text: "#fff" },
    scoreColor: "#fb923c",
    scoreGlow: "0 0 10px #fb923c88",
    platform: "linear-gradient(135deg, #7c2d12, #fb923c 50%, #7c2d12)",
    platformGlow: "0 4px 15px #fb923caa",
    platformH: 10,
    cardBorderColor: "#fb923c40",
    cardGlow: "0 0 24px #fb923c15, 0 8px 24px #0d052088",
    sparkle: "#fb923c",
  },
} as const;

const SPARKLE_POSITIONS: Record<1 | 2 | 3, { top: string; left?: string; right?: string; size: number; opacity: number }[]> = {
  1: [
    { top: "6%", right: "10%", size: 10, opacity: 0.6 },
    { top: "14%", right: "4%", size: 6, opacity: 0.3 },
    { top: "22%", left: "8%", size: 7, opacity: 0.4 },
    { top: "60%", left: "4%", size: 6, opacity: 0.25 },
  ],
  2: [
    { top: "8%", right: "8%", size: 8, opacity: 0.5 },
    { top: "20%", left: "6%", size: 5, opacity: 0.3 },
  ],
  3: [
    { top: "8%", right: "8%", size: 8, opacity: 0.5 },
    { top: "20%", left: "6%", size: 5, opacity: 0.3 },
  ],
};

const slideDelayByRank: Record<number, number> = { 1: 400, 2: 200, 3: 0 };

interface PodiumCardProps {
  entry: LeaderboardEntry;
  isMe: boolean;
}

export default function PodiumCard({ entry, isMe }: PodiumCardProps) {
  const rank = entry.rank as 1 | 2 | 3;
  const isFirst = rank === 1;
  const cfg = rankConfig[rank];

  const { data: levels = [] } = useGetLevels();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
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
        "relative flex flex-col items-center",
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
      )}
    >
      {/* Crown for rank 1 */}
      {isFirst && (
        <Crown
          className="relative z-10 mb-1 fill-yellow-400 text-yellow-400"
          style={{ width: 30, height: 30, filter: "drop-shadow(0 0 8px #fbbf24)" }}
        />
      )}

      {/* Card */}
      <div
        className="relative flex flex-col items-center gap-2 sm:gap-3 rounded-2xl p-4 sm:p-5 w-full"
        style={{
          background: "linear-gradient(160deg, #2d1060 0%, #1a0845 60%, #0d0520 100%)",
          border: `1px solid ${cfg.cardBorderColor}`,
          boxShadow: cfg.cardGlow,
        }}
      >
        {/* Sparkle decorations */}
        {SPARKLE_POSITIONS[rank].map((s, i) => (
          <span
            key={i}
            className="absolute pointer-events-none select-none"
            style={{
              top: s.top,
              left: s.left,
              right: s.right,
              fontSize: s.size,
              opacity: s.opacity,
              color: cfg.sparkle,
              lineHeight: 1,
            }}
          >
            ✦
          </span>
        ))}

        {/* Rank badge */}
        <span
          className="absolute top-3 left-3 size-7 rounded-full flex items-center justify-center text-xs font-bold z-10"
          style={{ background: cfg.badge.bg, color: cfg.badge.text }}
        >
          {rank}
        </span>

        {/* Avatar with glow ring */}
        <div className="rounded-full shrink-0 mt-1" style={{ boxShadow: cfg.ringGlow }}>
          <Avatar
            className={cn("shrink-0", isFirst ? "size-16 sm:size-20" : "size-12 sm:size-16")}
            style={{ border: `3px solid ${cfg.ring}` }}
          >
            <AvatarImage
              src={entry.profileImage ?? undefined}
              alt={entry.nickname || entry.username}
            />
            <AvatarFallback
              className="font-bold"
              style={{
                background: `${cfg.ring}25`,
                color: cfg.ring,
                fontSize: isFirst ? "1.25rem" : "1rem",
              }}
            >
              {(entry.nickname || entry.username).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Name */}
        <div className="text-center">
          <p
            className={cn(
              "font-bold text-white truncate",
              isFirst ? "text-sm sm:text-base max-w-36" : "text-xs sm:text-sm max-w-28",
            )}
          >
            {entry.nickname || entry.username}
            {isMe && (
              <span className="ml-1 text-[10px] text-violet-300 font-normal">(You)</span>
            )}
          </p>
          <p className="text-[11px] text-white/40 truncate">@{entry.username}</p>
        </div>

        {/* Level badge */}
        {entry.level && <LevelBadge level={entry.level} size="sm" />}

        {/* Progress bar */}
        {levels.length > 0 && (
          <LevelProgressBar score={entry.totalScore} levels={levels} />
        )}

        {/* Score */}
        <p
          className={cn(
            "font-bold tabular-nums",
            isFirst ? "text-xl sm:text-2xl" : "text-base sm:text-xl",
          )}
          style={{ color: cfg.scoreColor, textShadow: cfg.scoreGlow }}
        >
          {entry.totalScore.toLocaleString()}
          <span className="text-xs font-normal text-white/40 ml-1">pts</span>
        </p>
      </div>

      {/* Platform pedestal */}
      <div
        className="w-4/5 rounded-b-lg"
        style={{
          height: cfg.platformH,
          background: cfg.platform,
          boxShadow: cfg.platformGlow,
        }}
      />
    </div>
  );
}
