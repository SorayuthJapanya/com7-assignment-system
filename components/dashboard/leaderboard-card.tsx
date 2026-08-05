"use client";

import { useAdminLeaderboard } from "@/hooks/use-leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import LevelBadge from "../shared/level-badge";
import { Trophy, TrendingDown } from "lucide-react";

const RANK_STYLES = [
  { bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-600", medal: "🥇" },
  { bg: "bg-slate-50 dark:bg-slate-800/30", text: "text-slate-500", medal: "🥈" },
  { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-600", medal: "🥉" },
];

export default function LeaderboardCard() {
  const { data, isLoading } = useAdminLeaderboard({ limit: 5 });

  return (
    <Card className="h-full rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Trophy className="size-5 text-yellow-500" />
          Top 5 Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : !data?.leaderboard?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">No score data yet.</p>
        ) : (
          <ol className="space-y-2">
            {data.leaderboard.map((entry, idx) => {
              const style = RANK_STYLES[entry.rank - 1];
              // 🆕 negativePoints: magnitude of the deficit when the raw
              // total (approvals - penalties) is below 0. `totalScore`
              // itself is already floored at 0 by the API, so this is the
              // only place the deficit is visible.
              const negativePoints = (entry as any).negativePoints ?? 0;

              return (
                <li
                  key={entry.userId}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${style?.bg || ""} hover:scale-110 transition-transform duration-200 ${idx === 0 ? "border border-yellow-400 scale-105" : "scale-100"}`}
                >
                  {/* Rank */}
                  <span className="w-7 text-center text-lg leading-none">
                    {style ? style.medal : <span className={`font-bold text-sm text-muted-foreground`}>#{entry.rank}</span>}
                  </span>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{entry.nickname || entry.username}</p>
                    <p className="text-xs text-muted-foreground truncate">@{entry.username}</p>
                    {/* 🆕 Negative Points — only rendered when in deficit */}
                    {negativePoints > 0 && (
                      <p className="flex items-center gap-1 text-[11px] font-medium text-red-600 mt-0.5">
                        <TrendingDown className="size-3" />
                        Negative Points: {negativePoints.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Level badge */}
                  <LevelBadge level={entry.level} size="sm" />

                  {/* Score */}
                  <span className="font-bold text-sm tabular-nums whitespace-nowrap">
                    {entry.totalScore.toLocaleString()} pts
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}