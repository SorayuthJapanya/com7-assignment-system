"use client";

import LevelBadge from "@/components/shared/level-badge";
import { LeaderboardEntry, ILevel } from "@/types/level";
import { cn } from "@/lib/utils";
import { Clock, Flame, Star, Trophy, Crown } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useGetLevels } from "@/hooks/use-level";
import { useEffect, useState } from "react";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

function resolveProgress(score: number, levels: ILevel[]) {
  const sorted = [...levels].sort((a, b) => a.minScore - b.minScore);
  const current =
    sorted.find((l) => score >= l.minScore && score <= l.maxScore) ??
    sorted.filter((l) => score > l.maxScore).at(-1) ??
    null;
  const next = current
    ? sorted.find((l) => l.minScore > current.maxScore) ?? null
    : sorted[0] ?? null;

  if (!current) return { progress: 0, color: null, nextName: next?.name ?? null };

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
    <div className="flex flex-col gap-0.5 w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-950/15">
        <div
          className="h-full rounded-full transition-[width] duration-1500 ease-out"
          style={{ width: `${animated}%`, backgroundColor: color ?? "#8b5cf6" }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-amber-900/60">
        <span className="tabular-nums font-semibold">{progress}%</span>
        {nextName && <span className="truncate max-w-24">→ {nextName}</span>}
      </div>
    </div>
  );
}

function formatOverdue(seconds: number): string {
  if (seconds <= 0) return "—";
  const total = Math.floor(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}`;
  return `${pad(hours)}:${pad(minutes)}`;
}

const RANK_STYLES = {
  1: {
    rankBg: "linear-gradient(135deg, #fde047 0%, #f59e0b 50%, #b45309 100%)",
    rankText: "#78350f",
    rankBorder: "#fff7d6",
    rankShadow: "0 0 22px rgba(251,191,36,0.7), inset 0 2px 4px rgba(255,255,255,0.6)",
    ribbon: "#dc2626",
    ribbonDark: "#991b1b",
    rowBorder: "#f59e0b",
    rowGlow: "0 0 22px rgba(251,191,36,0.25), 0 4px 14px rgba(0,0,0,0.35)",
    crown: true,
  },
  2: {
    rankBg: "linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 50%, #64748b 100%)",
    rankText: "#1e293b",
    rankBorder: "#f8fafc",
    rankShadow: "0 0 18px rgba(148,163,184,0.6), inset 0 2px 4px rgba(255,255,255,0.6)",
    ribbon: "#2563eb",
    ribbonDark: "#1e3a8a",
    rowBorder: "#94a3b8",
    rowGlow: "0 0 18px rgba(148,163,184,0.22), 0 4px 14px rgba(0,0,0,0.35)",
    crown: false,
  },
  3: {
    rankBg: "linear-gradient(135deg, #fdba74 0%, #ea580c 50%, #7c2d12 100%)",
    rankText: "#431407",
    rankBorder: "#fed7aa",
    rankShadow: "0 0 18px rgba(251,146,60,0.6), inset 0 2px 4px rgba(255,255,255,0.4)",
    ribbon: "#78350f",
    ribbonDark: "#451a03",
    rowBorder: "#ea580c",
    rowGlow: "0 0 18px rgba(251,146,60,0.22), 0 4px 14px rgba(0,0,0,0.35)",
    crown: false,
  },
} as const;

type RankKey = keyof typeof RANK_STYLES;

function StatChip({
  icon,
  value,
  color,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  color: "emerald" | "red" | "orange" | "rose";
  label: string;
}) {
  const palette = {
    emerald: { bg: "rgba(16,185,129,0.15)", text: "#047857", border: "rgba(16,185,129,0.35)" },
    red: { bg: "rgba(239,68,68,0.15)", text: "#b91c1c", border: "rgba(239,68,68,0.35)" },
    orange: { bg: "rgba(249,115,22,0.15)", text: "#c2410c", border: "rgba(249,115,22,0.35)" },
    rose: { bg: "rgba(244,63,94,0.15)", text: "#be123c", border: "rgba(244,63,94,0.35)" },
  }[color];

  return (
    <div
      title={label}
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums border shrink-0"
      style={{ background: palette.bg, color: palette.text, borderColor: palette.border }}
    >
      {icon}
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function RankMedal({ rank }: { rank: number }) {
  const isTop3 = rank >= 1 && rank <= 3;
  const s = isTop3 ? RANK_STYLES[rank as RankKey] : null;

  if (!isTop3) {
    return (
      <div
        className="flex items-center justify-center size-11 rounded-full font-extrabold text-base shrink-0 transition-transform group-hover:scale-105"
        style={{
          background: "linear-gradient(135deg, #fde68a 0%, #f59e0b 60%, #b45309 100%)",
          color: "#78350f",
          border: "3px solid #fffbeb",
          boxShadow:
            "0 0 0 1px rgba(180,83,9,0.4), inset 0 2px 3px rgba(255,255,255,0.5), 0 2px 6px rgba(0,0,0,0.25)",
        }}
      >
        {rank}
      </div>
    );
  }

  return (
    <div className="relative shrink-0 transition-transform group-hover:scale-105">
      {/* Ribbon tails (behind medal) */}
      <span
        aria-hidden
        className="absolute left-1 -top-1 w-2.5 h-7 z-0"
        style={{
          background: `linear-gradient(180deg, ${s!.ribbonDark} 0%, ${s!.ribbon} 100%)`,
          clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
          transform: "rotate(-22deg)",
          transformOrigin: "top",
        }}
      />
      <span
        aria-hidden
        className="absolute right-1 -top-1 w-2.5 h-7 z-0"
        style={{
          background: `linear-gradient(180deg, ${s!.ribbonDark} 0%, ${s!.ribbon} 100%)`,
          clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
          transform: "rotate(22deg)",
          transformOrigin: "top",
        }}
      />
      {/* Medal disc */}
      <div
        className="relative z-10 flex items-center justify-center size-11 rounded-full font-extrabold text-base"
        style={{
          background: s!.rankBg,
          color: s!.rankText,
          border: `3px solid ${s!.rankBorder}`,
          boxShadow: s!.rankShadow,
        }}
      >
        {rank}
      </div>
      {/* Crown for #1 */}
      {s!.crown && (
        <Crown
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 size-4 text-yellow-300 fill-yellow-300"
          style={{ filter: "drop-shadow(0 0 4px rgba(253,224,71,0.9))" }}
        />
      )}
    </div>
  );
}

function LeaderboardRow({
  entry,
  isMe,
  levels,
  idx,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
  levels: ILevel[];
  idx: number;
}) {
  const isTop3 = entry.rank >= 1 && entry.rank <= 3;
  const s = isTop3 ? RANK_STYLES[entry.rank as RankKey] : null;
  const delay = 150 + idx * 200;

  return (
    <div
      className="group relative"
      style={{
        animation: `slideInRow 1s ease-out both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className={cn(
          "relative flex items-center gap-2.5 sm:gap-3 rounded-full py-2 pl-2 pr-2 sm:pr-3",
          "transition-all duration-300 ease-out",
          "hover:-translate-y-2 hover:brightness-105",
        )}
        style={{
          background: isMe
            ? "linear-gradient(95deg, #fef3c7 0%, #fde68a 40%, #fcd34d 60%, #fef3c7 100%)"
            : "linear-gradient(95deg, #fef3c7 0%, #fcd9a0 50%, #f3c474 100%)",
          border: `2px solid ${isMe ? "#a78bfa" : s?.rowBorder ?? "#c89a4d"}`,
          boxShadow: isMe
            ? "0 0 0 2px rgba(167,139,250,0.45), 0 6px 18px rgba(109,40,217,0.4), inset 0 1px 1px rgba(255,255,255,0.6)"
            : s?.rowGlow ??
              "0 3px 10px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.5)",
        }}
      >
        {/* Rank Medal */}
        <RankMedal rank={entry.rank} />

        {/* Avatar */}
        <Avatar
          className="size-10 sm:size-11 shrink-0"
          style={{
            border: "2px solid rgba(120,53,15,0.35)",
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.4)",
          }}
        >
          <AvatarImage
            src={entry.profileImage ?? undefined}
            alt={entry.nickname || entry.username}
          />
          <AvatarFallback
            className="text-xs font-bold"
            style={{ background: "#fcd9a0", color: "#78350f" }}
          >
            {(entry.nickname || entry.username).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-extrabold text-amber-950 truncate text-sm sm:text-[15px] leading-tight">
              {entry.nickname || entry.username}
            </p>
            {isMe && (
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-white bg-violet-600 px-1.5 py-0.5 rounded-full shadow-sm">
                You
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-900/70 truncate font-medium">
            @{entry.username}
          </p>

          {/* Desktop: level + progress */}
          <div className="hidden sm:flex items-center gap-2 mt-1">
            {entry.level && <LevelBadge level={entry.level} size="sm" />}
            {levels.length > 0 && (
              <div className="max-w-72 flex-1">
                <LevelProgressBar score={entry.totalScore} levels={levels} />
              </div>
            )}
          </div>

          {/* Mobile: level only */}
          <div className="sm:hidden mt-0.5">
            {entry.level && <LevelBadge level={entry.level} size="sm" />}
          </div>
        </div>

        {/* Desktop stats */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <StatChip
            icon={<Trophy className="size-3" />}
            value={entry.assignmentCount}
            color="emerald"
            label="Tasks"
          />
          {entry.lateCount > 0 && (
            <StatChip
              icon={<Clock className="size-3" />}
              value={entry.lateCount}
              color="red"
              label="Delayed"
            />
          )}
          <StatChip
            icon={<Flame className="size-3" />}
            value={entry.avgScore.toLocaleString()}
            color="orange"
            label="Avg"
          />
          {entry.overdueSeconds > 0 && (
            <StatChip
              icon={<Clock className="size-3" />}
              value={formatOverdue(entry.overdueSeconds)}
              color="rose"
              label="Overdue"
            />
          )}
        </div>

        {/* Score badge */}
        <div
          className="flex items-center gap-1.5 rounded-full pl-2 pr-3 py-1.5 shrink-0"
          style={{
            background: "linear-gradient(135deg, #fffbea 0%, #fde68a 100%)",
            border: "2px solid rgba(120,53,15,0.35)",
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.7), 0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          <Star
            className="size-4 fill-amber-400 text-amber-500 shrink-0"
            style={{ filter: "drop-shadow(0 0 3px rgba(251,191,36,0.8))" }}
          />
          <span
            className="font-extrabold tabular-nums text-sm sm:text-[15px]"
            style={{ color: "#78350f" }}
          >
            {entry.totalScore.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardTable({
  entries,
  currentUserId,
}: LeaderboardTableProps) {
  const { data: levels = [] } = useGetLevels();

  return (
    <div className="relative flex flex-col gap-4 sm:gap-6">
      {entries.map((entry, idx) => (
        <LeaderboardRow
          key={entry.userId}
          entry={entry}
          isMe={currentUserId === entry.userId}
          levels={levels}
          idx={idx}
        />
      ))}
    </div>
  );
}
