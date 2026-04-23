"use client";

import Header from "@/components/header";
import { usePublicLeaderboard } from "@/hooks/use-leaderboard";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Trophy } from "lucide-react";
import LeaderboardFilters from "@/components/leaderboard/leaderboard-filters";
import LeaderboardTable from "@/components/leaderboard/leaderboard-table";
import LeaderboardSkeleton from "@/components/leaderboard/leaderboard-skeleton";

function sr(n: number) {
  return Math.abs((Math.sin(n * 9301 + 49297) * 233280) % 1);
}

const STARS = Array.from({ length: 108 }, (_, i) => {
  const layer =
    i < 50 ? "tiny" : i < 85 ? "small" : i < 100 ? "medium" : "bright";
  const colorRoll = sr(i * 17 + 3);
  const color =
    colorRoll > 0.82
      ? "#fde68a"
      : colorRoll > 0.66
        ? "#bfdbfe"
        : colorRoll > 0.52
          ? "#e9d5ff"
          : "#ffffff";
  return {
    top: `${sr(i * 3 + 1) * 100}%`,
    left: `${sr(i * 3 + 2) * 100}%`,
    size:
      layer === "tiny"
        ? sr(i * 5 + 4) * 0.8 + 0.5
        : layer === "small"
          ? sr(i * 5 + 4) * 0.8 + 1.2
          : layer === "medium"
            ? sr(i * 5 + 4) * 1.0 + 2.0
            : sr(i * 5 + 4) * 1.5 + 3.0,
    delay: `${sr(i * 7 + 9) * 8}s`,
    duration: `${sr(i * 11 + 13) * 3 + 2}s`,
    opacity:
      layer === "tiny"
        ? sr(i * 13 + 17) * 0.25 + 0.1
        : layer === "small"
          ? sr(i * 13 + 17) * 0.3 + 0.2
          : layer === "medium"
            ? sr(i * 13 + 17) * 0.25 + 0.5
            : 0.9,
    color,
    layer,
  };
});

const METEORS = [
  { top: "-5%", left: "15%", h: 110, delay: "1s", dur: "5s" },
  { top: "-5%", left: "55%", h: 80, delay: "3.5s", dur: "4.5s" },
  { top: "-5%", left: "78%", h: 70, delay: "6.5s", dur: "6s" },
];

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

  const entries = data?.leaderboard ?? [];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
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
      ) : !entries.length ? (
        <div className="py-24 text-center">
          <Trophy className="size-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No data available for this period.</p>
        </div>
      ) : (
        <div
          className="relative rounded-3xl overflow-hidden p-5 sm:p-12"
          style={{
            background:
              "linear-gradient(165deg, #1e0a4a 0%, #120530 55%, #0a0318 100%)",
            boxShadow:
              "0 0 60px rgba(109,40,217,0.18), inset 0 0 80px rgba(109,40,217,0.04)",
          }}
        >
          <style>{`
            @keyframes twinkle {
              0%, 100% { opacity: var(--op); transform: scale(1); }
              50%       { opacity: calc(var(--op) * 0.08); transform: scale(0.35); }
            }
            @keyframes twinkle-scale {
              0%, 100% { opacity: var(--op); transform: scale(1); }
              40%       { opacity: calc(var(--op) * 0.12); transform: scale(0.5); }
              70%       { opacity: calc(var(--op) * 1.8); transform: scale(1.25); }
            }
            @keyframes pulse-glow {
              0%, 100% {
                opacity: var(--op);
                box-shadow: 0 0 3px 1px var(--c);
                transform: scale(1);
              }
              50% {
                opacity: 1;
                box-shadow: 0 0 10px 4px var(--c), 0 0 22px 8px rgba(255,255,255,0.12);
                transform: scale(1.6);
              }
            }
            @keyframes cross-sparkle {
              0%, 100% {
                opacity: var(--op);
                box-shadow:
                  0 0 5px 2px var(--c),
                  0 -11px 4px 0 var(--c),
                  0  11px 4px 0 var(--c),
                  -11px 0 4px 0 var(--c),
                   11px 0 4px 0 var(--c);
              }
              50% {
                opacity: 1;
                box-shadow:
                  0 0 12px 5px var(--c),
                  0 -26px 7px 1px var(--c),
                  0  26px 7px 1px var(--c),
                  -26px 0 7px 1px var(--c),
                   26px 0 7px 1px var(--c);
              }
            }
            @keyframes meteor {
              0%   { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 1; }
              70%  { opacity: 1; }
              100% { transform: translateX(600px) translateY(600px) rotate(-45deg); opacity: 0; }
            }
            @keyframes nebula-drift {
              0%, 100% { transform: translate(0,    0)   scale(1);    }
              33%       { transform: translate(30px, -18px) scale(1.07); }
              66%       { transform: translate(-14px, 10px) scale(0.95); }
            }
            @keyframes banner-float {
              0%, 100% { transform: translateY(0); }
              50%       { transform: translateY(-3px); }
            }
            @keyframes slideInRow {
              from { opacity: 0; transform: translateX(-80px); }
              to   { opacity: 1; transform: translateX(0); }
            }
            @keyframes sparkle {
              0%, 100% { opacity: 0.3; transform: scale(0.9); }
              50%      { opacity: 1;   transform: scale(1.1); }
            }
            .banner-float { animation: banner-float 3.5s ease-in-out infinite; }
            .sparkle      { animation: sparkle 2.5s ease-in-out infinite; }
          `}</style>

          {/* Nebula layers */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute w-[520px] h-[320px] rounded-full -top-24 -left-24"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(109,40,217,0.22) 0%, transparent 70%)",
                filter: "blur(45px)",
                animation: "nebula-drift 22s ease-in-out infinite",
              }}
            />
            <div
              className="absolute w-[420px] h-[360px] rounded-full -bottom-20 -right-16"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(236,72,153,0.18) 0%, transparent 70%)",
                filter: "blur(55px)",
                animation: "nebula-drift 28s ease-in-out infinite reverse",
              }}
            />
            <div
              className="absolute w-[360px] h-[310px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(59,130,246,0.11) 0%, transparent 70%)",
                filter: "blur(65px)",
                animation: "nebula-drift 35s ease-in-out infinite 9s",
              }}
            />
          </div>

          {/* Star field */}
          {STARS.map((star, i) => {
            const anim =
              star.layer === "tiny"
                ? "twinkle"
                : star.layer === "small"
                  ? "twinkle-scale"
                  : star.layer === "medium"
                    ? "pulse-glow"
                    : "cross-sparkle";
            return (
              <span
                key={i}
                style={
                  {
                    position: "absolute",
                    top: star.top,
                    left: star.left,
                    width: star.size,
                    height: star.size,
                    borderRadius: "50%",
                    backgroundColor: star.color,
                    pointerEvents: "none",
                    animation: `${anim} ${star.duration} ease-in-out ${star.delay} infinite`,
                    "--op": star.opacity,
                    "--c": star.color,
                  } as React.CSSProperties
                }
              />
            );
          })}

          {/* Meteors */}
          {METEORS.map((m, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                top: m.top,
                left: m.left,
                width: 2,
                height: m.h,
                borderRadius: 9999,
                background: "linear-gradient(to bottom right, white, transparent)",
                animation: `meteor ${m.dur} linear ${m.delay} infinite`,
                opacity: 0.45,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Ambient top glow */}
          <div
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-36 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse, rgba(236,72,153,0.35) 0%, transparent 70%)",
            }}
          />

          {/* LEADERBOARD banner */}
          <div className="relative flex justify-center mb-6 sm:mb-12">
            <div className="banner-float relative inline-flex items-center gap-3">
              <span
                aria-hidden
                className="hidden sm:block text-3xl"
                style={{
                  filter: "drop-shadow(0 0 8px rgba(251,191,36,0.6))",
                  transform: "scaleX(-1)",
                }}
              >
                🌿
              </span>

              <div
                className="relative px-6 sm:px-10 py-2.5 sm:py-3 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg, #ec4899 0%, #be185d 50%, #831843 100%)",
                  border: "3px solid #fbbf24",
                  boxShadow:
                    "0 0 30px rgba(236,72,153,0.5), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -3px 6px rgba(0,0,0,0.35)",
                }}
              >
                <h2
                  className="text-lg sm:text-2xl font-extrabold tracking-[0.2em] text-white"
                  style={{
                    textShadow:
                      "0 2px 0 rgba(0,0,0,0.4), 0 0 14px rgba(251,191,36,0.4)",
                  }}
                >
                  LEADERBOARD
                </h2>
                <span
                  className="sparkle absolute -top-2 -left-2 text-yellow-300 text-sm"
                  style={{ filter: "drop-shadow(0 0 4px #fbbf24)" }}
                >
                  ✦
                </span>
                <span
                  className="sparkle absolute -top-1 right-2 text-yellow-300 text-xs"
                  style={{
                    animationDelay: "0.8s",
                    filter: "drop-shadow(0 0 4px #fbbf24)",
                  }}
                >
                  ✦
                </span>
                <span
                  className="sparkle absolute -bottom-2 left-4 text-yellow-300 text-xs"
                  style={{
                    animationDelay: "1.4s",
                    filter: "drop-shadow(0 0 4px #fbbf24)",
                  }}
                >
                  ✦
                </span>
              </div>

              <span
                aria-hidden
                className="hidden sm:block text-3xl"
                style={{ filter: "drop-shadow(0 0 8px rgba(251,191,36,0.6))" }}
              >
                🌿
              </span>
            </div>
          </div>

          <div className="relative">
            <LeaderboardTable entries={entries} currentUserId={user?.id} />
          </div>
        </div>
      )}
    </div>
  );
}
