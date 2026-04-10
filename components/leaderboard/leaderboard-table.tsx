import LevelBadge from "@/components/shared/level-badge";
import { LeaderboardEntry } from "@/types/level";
import { cn } from "@/lib/utils";
import { Flame, Star, Trophy } from "lucide-react";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export default function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-[3rem_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-2.5 border-b bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="text-center">Rank</span>
        <span>Player</span>
        <span className="text-center">Level</span>
        <span className="text-center">
          <span className="inline-flex items-center gap-1">
            <Trophy className="size-3" /> Tasks
          </span>
        </span>
        <span className="text-center">
          <Flame className="size-3 text-orange-500" />
        </span>
        <span className="text-right">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3 text-violet-500" /> Score
          </span>
        </span>
      </div>

      <ol>
        {entries.map((entry, idx) => {
          const isMe = currentUserId === entry.userId;
          return (
            <li
              key={entry.userId}
              className={cn(
                "grid grid-cols-[3rem_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3 transition-colors",
                idx !== entries.length - 1 && "border-b",
                isMe
                  ? "bg-primary/5 border-l-2 border-l-primary"
                  : "hover:bg-muted/30",
              )}
            >
              {/* Rank */}
              <span className="text-center text-sm font-bold text-muted-foreground">
                #{entry.rank}
              </span>

              {/* Player */}
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
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
                </div>
              </div>

              {/* Level */}
              <div>
                {entry.level ? (
                  <LevelBadge level={entry.level} size="sm" />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>

              {/* Assignment count */}
              <span className="text-center text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {entry.assignmentCount}
              </span>

              {/* Streak placeholder */}
              <span className="text-center text-sm font-semibold tabular-nums text-orange-500">
                —
              </span>

              {/* Score */}
              <span className="text-right font-bold tabular-nums text-sm text-violet-600 dark:text-violet-400">
                {entry.totalScore.toLocaleString()}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
