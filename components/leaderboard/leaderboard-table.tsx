"use client";

import LevelBadge from "@/components/shared/level-badge";
import { LeaderboardEntry, ILevel } from "@/types/level";
import { cn } from "@/lib/utils";
import { Clock, Flame, Star, Trophy } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  return { progress, color: current.color, nextName: next ? `${next.emoji} ${next.name}` : null };
}

function LevelProgressBar({ score, levels }: { score: number; levels: ILevel[] }) {
  const { progress, color, nextName } = resolveProgress(score, levels);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setAnimated(progress), 150);
    return () => clearTimeout(id);
  }, [progress]);

  return (
    <div className="flex flex-col gap-0.5 w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-1500 ease-out"
          style={{ width: `${animated}%`, backgroundColor: color ?? "#a78bfa" }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-white/35">
        <span className="tabular-nums">{progress}%</span>
        {nextName && <span className="truncate max-w-20">→ {nextName}</span>}
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

  if (days > 0) return `${days}days ${pad(hours)}:${pad(minutes)}`;
  return `${pad(hours)}:${pad(minutes)}`;
}

export default function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  const { data: levels = [] } = useGetLevels();

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1e0a4a 0%, #0d0520 100%)" }}
    >
      <Table>
        <TableHeader>
          <TableRow
            className="border-b hover:bg-transparent"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <TableHead className="w-12 text-center text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              Rank
            </TableHead>
            <TableHead className="w-40 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              Player
            </TableHead>
            <TableHead className="w-160 hidden sm:table-cell text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              Progress
            </TableHead>
            <TableHead className="w-40 hidden sm:table-cell text-center text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              <span className="inline-flex items-center justify-center gap-1">
                <Trophy className="size-3 text-emerald-400" /> Tasks
              </span>
            </TableHead>
            <TableHead className="w-40 hidden sm:table-cell text-center text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              <span className="inline-flex items-center justify-center gap-1">
                <Clock className="size-3 text-red-400" /> Delayed (Tasks)
              </span>
            </TableHead>
            <TableHead className="w-40 text-center text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              <span className="inline-flex items-center justify-end gap-1">
                <Star className="size-3 text-violet-400" /> Score
              </span>
            </TableHead>
            <TableHead className="w-40 hidden sm:table-cell text-center text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              <span className="inline-flex items-center justify-end gap-1">
                <Flame className="size-3 text-orange-400" /> Avg
              </span>
            </TableHead>
            <TableHead className="hidden sm:table-cell text-center text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              <span className="inline-flex items-center justify-center gap-1">
                <Clock className="size-3 text-rose-400" /> Overdue
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {entries.map((entry, idx) => {
            const isMe = currentUserId === entry.userId;
            return (
              <TableRow
                key={entry.userId}
                className={cn(
                  "border-b transition-colors",
                  isMe ? "border-l-2 border-l-violet-400" : "",
                )}
                style={{
                  borderBottomColor: "rgba(255,255,255,0.05)",
                  background: isMe
                    ? "rgba(139,92,246,0.12)"
                    : idx % 2 === 0
                    ? "rgba(255,255,255,0.015)"
                    : "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = isMe
                    ? "rgba(139,92,246,0.2)"
                    : "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = isMe
                    ? "rgba(139,92,246,0.12)"
                    : idx % 2 === 0
                    ? "rgba(255,255,255,0.015)"
                    : "transparent";
                }}
              >
                {/* Rank */}
                <TableCell className="text-center font-bold tabular-nums text-sm text-white/30">
                  #{entry.rank}
                </TableCell>

                {/* Player */}
                <TableCell>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      className="size-8 sm:size-9 shrink-0"
                      style={{ border: "1px solid rgba(167,139,250,0.3)" }}
                    >
                      <AvatarImage
                        src={entry.profileImage ?? undefined}
                        alt={entry.nickname || entry.username}
                      />
                      <AvatarFallback
                        className="text-xs font-bold"
                        style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}
                      >
                        {(entry.nickname || entry.username).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate text-sm leading-tight">
                        {entry.nickname || entry.username}
                        {isMe && (
                          <span className="ml-1.5 text-xs font-normal text-violet-300">(You)</span>
                        )}
                      </p>
                      <p className="text-[11px] text-white/35 truncate">@{entry.username}</p>
                      {/* Mobile: level + tasks */}
                      <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                        {entry.level && <LevelBadge level={entry.level} size="sm" />}
                        <span className="text-xs font-semibold text-emerald-400 inline-flex items-center gap-0.5">
                          <Trophy className="size-3" />
                          {entry.assignmentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Progress + Level — desktop */}
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-3">
                    {entry.level && <LevelBadge level={entry.level} size="sm" />}
                    {levels.length > 0 ? (
                      <LevelProgressBar score={entry.totalScore} levels={levels} />
                    ) : (
                      <span className="text-xs text-white/30">—</span>
                    )}
                  </div>
                </TableCell>

                {/* Tasks — desktop */}
                <TableCell className="hidden sm:table-cell text-center font-semibold tabular-nums text-sm text-emerald-400">
                  {entry.assignmentCount}
                </TableCell>

                {/* Delayed — desktop */}
                <TableCell className="hidden sm:table-cell text-center font-semibold tabular-nums text-sm text-red-400">
                  {entry.lateCount > 0 ? entry.lateCount : <span className="text-white/20">—</span>}
                </TableCell>

                {/* Score */}
                <TableCell className="text-center font-bold tabular-nums text-sm"
                  style={{ color: "#a78bfa", textShadow: "0 0 10px #a78bfa66" }}
                >
                  {entry.totalScore.toLocaleString()}
                </TableCell>

                {/* Avg — desktop */}
                <TableCell className="hidden sm:table-cell text-center font-semibold tabular-nums text-sm text-orange-400">
                  {entry.avgScore.toLocaleString()}
                </TableCell>

                {/* Overdue — desktop */}
                <TableCell className="hidden sm:table-cell text-center font-semibold tabular-nums text-sm text-rose-400">
                  {entry.overdueSeconds > 0 ? formatOverdue(entry.overdueSeconds) : <span className="text-white/20">—</span>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
