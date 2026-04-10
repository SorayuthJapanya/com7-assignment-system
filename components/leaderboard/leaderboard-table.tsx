import LevelBadge from "@/components/shared/level-badge";
import { LeaderboardEntry } from "@/types/level";
import { cn } from "@/lib/utils";
import { Flame, Star, Trophy } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export default function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-center w-12">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-center hidden sm:table-cell">Level</TableHead>
            <TableHead className="text-center hidden sm:table-cell">
              <span className="inline-flex items-center gap-1">
                <Trophy className="size-3" /> Tasks
              </span>
            </TableHead>
            <TableHead className="text-center hidden sm:table-cell">
              <Flame className="size-3 text-orange-500 mx-auto" />
            </TableHead>
            <TableHead className="text-right">
              <span className="inline-flex items-center gap-1 justify-end">
                <Star className="size-3 text-violet-500" /> Score
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
                    <div className="size-8 sm:size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {(entry.nickname || entry.username).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-sm">
                        {entry.nickname || entry.username}
                        {isMe && (
                          <span className="ml-1.5 text-xs font-normal text-primary">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">@{entry.username}</p>
                      {/* Level + Tasks + Streak — mobile only */}
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

                {/* Streak — desktop */}
                <TableCell className="text-center text-sm font-semibold tabular-nums text-orange-500 hidden sm:table-cell">
                  —
                </TableCell>

                {/* Score */}
                <TableCell className="text-right font-bold tabular-nums text-sm text-violet-600 dark:text-violet-400">
                  {entry.totalScore.toLocaleString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
