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
        <div
          className="relative rounded-3xl overflow-hidden p-5 sm:p-8"
          style={{
            background: "linear-gradient(165deg, #1e0a4a 0%, #120530 55%, #0a0318 100%)",
            boxShadow: "0 0 60px rgba(109,40,217,0.18), inset 0 0 80px rgba(109,40,217,0.04)",
          }}
        >
          {/* Meteor animations */}
          <style>{`
            @keyframes meteor {
              0%   { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 1; }
              70%  { opacity: 1; }
              100% { transform: translateX(600px) translateY(600px) rotate(-45deg); opacity: 0; }
            }
            .meteor {
              position: absolute;
              width: 2px;
              border-radius: 9999px;
              background: linear-gradient(to bottom right, white, transparent);
              animation: meteor linear infinite;
              pointer-events: none;
            }
            .meteor::after {
              content: '';
              position: absolute;
              top: 0; left: 0;
              width: 4px; height: 4px;
              border-radius: 50%;
              background: white;
              transform: translate(-50%, -50%);
            }
          `}</style>
          {([
            { top: "-5%",  left: "10%", h: 120, delay: "0s",    dur: "4s"   },
            { top: "-5%",  left: "35%", h: 80,  delay: "1.5s",  dur: "5s"   },
            { top: "-5%",  left: "60%", h: 100, delay: "3s",    dur: "4.5s" },
            { top: "-5%",  left: "80%", h: 60,  delay: "0.8s",  dur: "6s"   },
            { top: "10%",  left: "92%", h: 90,  delay: "2.2s",  dur: "5.5s" },
            { top: "-5%",  left: "50%", h: 70,  delay: "4s",    dur: "4s"   },
            { top: "-5%",  left: "20%", h: 110, delay: "5.5s",  dur: "5s"   },
          ]).map((m, i) => (
            <span
              key={i}
              className="meteor"
              style={{
                top: m.top,
                left: m.left,
                height: m.h,
                animationDelay: m.delay,
                animationDuration: m.dur,
                opacity: 0.6,
              }}
            />
          ))}

          {/* Decorative star dots */}
          {([
            { top: "4%",  left: "6%",  s: 2,   o: 0.35 },
            { top: "10%", left: "20%", s: 1.5, o: 0.2  },
            { top: "3%",  left: "50%", s: 2.5, o: 0.3  },
            { top: "7%",  left: "75%", s: 1.5, o: 0.25 },
            { top: "2%",  left: "90%", s: 2,   o: 0.35 },
            { top: "30%", left: "2%",  s: 1.5, o: 0.2  },
            { top: "55%", left: "96%", s: 2,   o: 0.25 },
            { top: "70%", left: "8%",  s: 1.5, o: 0.2  },
            { top: "80%", left: "85%", s: 2,   o: 0.3  },
            { top: "90%", left: "40%", s: 1.5, o: 0.15 },
            { top: "95%", left: "15%", s: 2,   o: 0.2  },
            { top: "92%", left: "68%", s: 1.5, o: 0.2  },
          ] as const).map((star, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white pointer-events-none"
              style={{
                top: star.top,
                left: star.left,
                width: star.s,
                height: star.s,
                opacity: star.o,
              }}
            />
          ))}

          {/* Ambient glow blobs */}
          <div
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-32 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.25) 0%, transparent 70%)" }}
          />

          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="relative w-full flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:items-end sm:gap-4 pt-6 pb-4">
              {podiumOrder.map((entry) => (
                <div
                  key={entry.userId}
                  className={
                    entry.rank === 1 ? "w-full sm:w-52 order-1 sm:order-2" :
                    entry.rank === 2 ? "w-full sm:w-44 order-2 sm:order-1" :
                    "w-full sm:w-44 order-3 sm:order-3"
                  }
                >
                  <PodiumCard entry={entry} isMe={user?.id === entry.userId} />
                </div>
              ))}
            </div>
          )}

          {/* Rest of the list */}
          {rest.length > 0 && (
            <div className="relative mt-6">
              <LeaderboardTable entries={rest} currentUserId={user?.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
