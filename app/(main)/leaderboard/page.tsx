"use client";

import Header from "@/components/header";
import { usePublicLeaderboard } from "@/hooks/use-leaderboard";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Trophy } from "lucide-react";
import LeaderboardFilters from "@/components/leaderboard/leaderboard-filters";
import PodiumCard from "@/components/leaderboard/podium-card";
import LeaderboardTable from "@/components/leaderboard/leaderboard-table";
import LeaderboardSkeleton from "@/components/leaderboard/leaderboard-skeleton";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  const params =
    yearFilter !== "all" && monthFilter !== "all"
      ? { year: parseInt(yearFilter), month: parseInt(monthFilter), limit: 50 }
      : { limit: 50 };

  const { data, isLoading } = usePublicLeaderboard(params);

  const handleReset = () => {
    setYearFilter("all");
    setMonthFilter("all");
  };

  const top3 = data?.leaderboard?.slice(0, 3) ?? [];
  const rest = data?.leaderboard?.slice(3) ?? [];
  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="w-full max-w-7xl xl:max-w-[1440px] mx-auto space-y-8">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Header
          title="Leaderboard"
          subTitle="Rankings based on total score earned from approved assignments"
        />
        {user?.role === "SUPER_ADMIN" && (
          <LeaderboardFilters
            yearFilter={yearFilter}
            monthFilter={monthFilter}
            onYearChange={setYearFilter}
            onMonthChange={setMonthFilter}
            onReset={handleReset}
          />
        )}
      </div>

      {isLoading ? (
        <LeaderboardSkeleton />
      ) : !data?.leaderboard?.length ? (
        <div className="py-24 text-center">
          <Trophy className="size-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No data available for this period.</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="w-full flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:items-end sm:gap-4 pt-6">
              {podiumOrder.map((entry) => (
                <div
                  key={entry.userId}
                  className={
                    entry.rank === 1 ? "w-full sm:w-52 order-1 sm:order-2" :
                    entry.rank === 2 ? "w-full sm:w-44 order-2 sm:order-1" :
                    "w-full sm:w-44 order-3 sm:order-3"
                  }
                >
                  <PodiumCard
                    entry={entry}
                    isMe={user?.id === entry.userId}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Rest of the list */}
          {rest.length > 0 && (
            <div className="mt-8">
              <LeaderboardTable entries={rest} currentUserId={user?.id} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
