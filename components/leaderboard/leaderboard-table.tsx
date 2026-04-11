"use client";

import LevelBadge from "@/components/shared/level-badge";
import { LeaderboardEntry, ILevel } from "@/types/level";
import { cn } from "@/lib/utils";
import { Flame, Star, Trophy } from "lucide-react";
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
  const current = sorted.find((l) => score >= l.minScore && score <= l.maxScore)
    ?? sorted.filter((l) => score > l.maxScore).at(-1)
    ?? null;
  const next = current
    ? sorted.find((l) => l.minScore > current.maxScore) ?? null
    : sorted[0] ?? null;

  if (!current) return { progress: 0, color: null, nextName: next?.name ?? null };

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
    const id = setTimeout(() => setAnimated(progress), 150);
    return () => clearTimeout(id);
  }, [progress]);

  return (
    <div className="flex flex-col gap-1 min-w-32">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-[1500ms] ease-out"
          style={{
            width: `${animated}%`,
            backgroundColor: color ?? "hsl(var(--primary))",
          }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="tabular-nums">{progress}%</span>
        {nextName && <span className="truncate max-w-24">→ {nextName}</span>}
      </div>
    </div>
  );
}

export default function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  const { data: levels = [] } = useGetLevels();

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-center w-12">Rank</TableHead>
            <TableHead className="w-26">Player</TableHead>
            <TableHead className="w-[40%] text-left hidden sm:table-cell">Progress</TableHead>
            <TableHead className="text-center hidden sm:table-cell">Level</TableHead>
            <TableHead className="text-center hidden sm:table-cell">
              <span className="inline-flex items-center gap-1">
                <Trophy className="size-3" /> Tasks
              </span>
            </TableHead>
            <TableHead className="text-right">
              <span className="inline-flex items-center gap-1 justify-end">
                <Star className="size-3 text-violet-500" /> Score
              </span>
            </TableHead>
            <TableHead className="text-right hidden sm:table-cell">
              <span className="inline-flex items-center gap-1 justify-end">
                <Flame className="size-3 text-orange-400" /> Avg
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const isMe = currentUserId === entry.userId;
            return (
              <TableRow
                key={entry.userId}
                className={cn(
                  "transition-colors",
                  isMe
                    ? "bg-primary/5 border-l-2 border-l-primary hover:bg-primary/10"
                    : "hover:bg-muted/30",
                )}
              >
                {/* Rank */}
                <TableCell className="text-center font-bold text-sm text-muted-foreground">
                  #{entry.rank}
                </TableCell>

                {/* Player */}
                <TableCell>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="size-8 sm:size-9 border border-primary/20 shrink-0">
                      <AvatarImage src={entry.profileImage ?? undefined} alt={entry.nickname || entry.username} />
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                        {(entry.nickname || entry.username).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-sm">
                        {entry.nickname || entry.username}
                        {isMe && (
                          <span className="ml-1.5 text-xs font-normal text-primary">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">@{entry.username}</p>
                      {/* Level + Tasks — mobile only */}
                      <div className="flex items-center gap-2 mt-1 sm:hidden">
                        {entry.level ? (
                          <LevelBadge level={entry.level} size="sm" />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <Trophy className="size-3 inline mr-0.5" />{entry.assignmentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Progress Bar — desktop */}
                <TableCell className="hidden sm:table-cell">
                  {levels.length > 0 ? (
                    <LevelProgressBar score={entry.totalScore} levels={levels} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Level — desktop */}
                <TableCell className="text-center hidden sm:table-cell">
                  {entry.level ? (
                    <LevelBadge level={entry.level} size="sm" />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Tasks — desktop */}
                <TableCell className="text-center text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 hidden sm:table-cell">
                  {entry.assignmentCount}
                </TableCell>

                {/* Score */}
                <TableCell className="text-right font-bold tabular-nums text-sm text-violet-600 dark:text-violet-400">
                  {entry.totalScore.toLocaleString()}
                </TableCell>

                {/* Avg Score — desktop */}
                <TableCell className="text-right text-sm font-semibold tabular-nums text-orange-500 hidden sm:table-cell">
                  {entry.avgScore.toLocaleString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
