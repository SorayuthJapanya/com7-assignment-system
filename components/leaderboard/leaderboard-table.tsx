"use client";

import LevelBadge from "@/components/shared/level-badge";
import { LeaderboardEntry, ILevel } from "@/types/level";
import { cn } from "@/lib/utils";
import { Clock, Flame, Star, Trophy } from "lucide-react";
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
    <div className="flex flex-col gap-1 w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${animated}%`, backgroundColor: color ?? "#2563eb" }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-gray-400">
        <span className="tabular-nums font-medium">{progress}%</span>
        {nextName && <span className="truncate max-w-28">ถัดไป · {nextName}</span>}
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

// Rank chip — quiet numeral badges instead of loud gradients.
const TIER = {
  1: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-200" },
  2: { bg: "bg-gray-100", text: "text-gray-500", ring: "ring-gray-200" },
  3: { bg: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-200" },
} as const;

type TierKey = keyof typeof TIER;

const STAT_COLORS = {
  neutral: { icon: "#9ca3af", value: "#374151" },
  positive: { icon: "#16a34a", value: "#15803d" },
  attention: { icon: "#dc2626", value: "#b91c1c" },
} as const;

type StatTone = keyof typeof STAT_COLORS;

function StatChip({
  icon,
  value,
  label,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  tone?: StatTone;
}) {
  const c = STAT_COLORS[tone];
  return (
    <div
      title={label}
      className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums shrink-0"
      style={{ color: c.icon }}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
      <span className="font-semibold" style={{ color: c.value }}>
        {value}
      </span>
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
  const tier = isTop3 ? TIER[entry.rank as TierKey] : null;
  const delay = 30 + idx * 25;

  return (
    <div
      className="opacity-0"
      style={{ animation: "rowIn 0.3s ease-out forwards", animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "group flex items-center gap-4 py-3.5 pr-4 pl-4",
          "border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70 transition-colors",
          isMe && "bg-blue-50/50 hover:bg-blue-50/70",
        )}
      >
        {/* Rank */}
        <div className="w-9 sm:w-10 shrink-0 flex items-center justify-center">
          {tier ? (
            <span
              className={cn(
                "flex items-center justify-center size-8 rounded-full text-sm font-bold tabular-nums ring-1",
                tier.bg,
                tier.text,
                tier.ring,
              )}
            >
              {entry.rank}
            </span>
          ) : (
            <span className="text-sm font-semibold tabular-nums text-gray-400">
              {entry.rank}
            </span>
          )}
        </div>

        {/* Avatar */}
        <Avatar className="size-9 sm:size-10 shrink-0 border border-gray-200">
          <AvatarImage
            src={entry.profileImage ?? undefined}
            alt={entry.nickname || entry.username}
          />
          <AvatarFallback className="text-xs font-semibold bg-gray-100 text-gray-500">
            {(entry.nickname || entry.username).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold truncate text-[14px] sm:text-[15px] leading-tight text-gray-900">
              {entry.nickname || entry.username}
            </p>
            {isMe && (
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-white bg-blue-600 px-1.5 py-0.5 rounded">
                คุณ
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate">@{entry.username}</p>

          {/* Desktop: level + progress */}
          <div className="hidden sm:flex items-center gap-2 mt-1.5">
            {entry.level && <LevelBadge level={entry.level} size="sm" />}
            {levels.length > 0 && (
              <div className="max-w-56 flex-1">
                <LevelProgressBar score={entry.totalScore} levels={levels} />
              </div>
            )}
          </div>

          {/* Mobile: level only */}
          <div className="sm:hidden mt-1">
            {entry.level && <LevelBadge level={entry.level} size="sm" />}
          </div>
        </div>

        {/* Desktop stats */}
        <div className="hidden md:flex flex-col items-end gap-1 shrink-0 pr-2">
          <div className="flex items-center gap-3">
            <StatChip icon={<Trophy className="size-3" />} value={entry.assignmentCount} label="งาน" tone="positive" />
            <StatChip icon={<Flame className="size-3" />} value={`${entry.avgScore}%`} label="เฉลี่ย" tone="neutral" />
          </div>
          {(entry.lateCount > 0 || entry.overdueSeconds > 0) && (
            <div className="flex items-center gap-3">
              {entry.lateCount > 0 && (
                <StatChip icon={<Clock className="size-3" />} value={entry.lateCount} label="ล่าช้า" tone="attention" />
              )}
              {entry.overdueSeconds > 0 && (
                <StatChip
                  icon={<Clock className="size-3" />}
                  value={formatOverdue(entry.overdueSeconds)}
                  label="เกินกำหนด"
                  tone="attention"
                />
              )}
            </div>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center gap-1.5 shrink-0 min-w-[84px] justify-end">
          <Star className="size-3.5 fill-amber-400 text-amber-400 shrink-0" />
          <span className="font-bold tabular-nums text-base sm:text-lg text-gray-900">
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
    <div className="overflow-hidden">
      <style>{`
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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