"use client";

import type { MissionQuestSummary } from "@/types/mission-quest";

interface RewardBannerProps {
  summary: MissionQuestSummary;
}

export default function RewardBanner({ summary }: RewardBannerProps) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
      <div>
        <h3 className="text-sm font-semibold text-violet-100">🎁 Potential Bonus</h3>
        <div className="text-3xl font-extrabold mt-1">
          +{summary.potentialBonusPoints.toLocaleString()} Points
        </div>
        <p className="text-xs text-violet-200 mt-1">
          ถ้าทำ Mission ครบทุกอัน ({summary.totalMissions} missions + Legend bonus)
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {summary.breakdown.map((item) => (
          <div
            key={item.label}
            className="rounded-lg bg-white/10 px-3 py-2 text-center min-w-[80px]"
          >
            <div className="text-lg font-bold">{item.value.toLocaleString()}</div>
            <div className="text-[11px] text-violet-100 whitespace-nowrap">
              {item.emoji} {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}