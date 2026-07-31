"use client";

import { LeaderboardEntry } from "@/types/level";
import LevelBadge from "@/components/shared/level-badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const TIER = {
  1: { ring: "#eab308", base: "#fde68a", baseText: "#92400e", order: "order-2", height: 96 },
  2: { ring: "#9ca3af", base: "#e5e7eb", baseText: "#4b5563", order: "order-1", height: 60 },
  3: { ring: "#c2703d", base: "#fed7aa", baseText: "#9a3412", order: "order-3", height: 40 },
} as const;

function PodiumCard({ entry }: { entry: LeaderboardEntry }) {
  const tier = TIER[entry.rank as 1 | 2 | 3];
  if (!tier) return null;
  const isFirst = entry.rank === 1;

  return (
    <div className={`flex flex-col items-center justify-end ${tier.order}`}>
      {/* Person block */}
      <div className="flex flex-col items-center mb-3">
        <Avatar
          className={isFirst ? "size-16 sm:size-[72px] ring-4" : "size-14 sm:size-16 ring-[3px]"}
          style={{ ["--tw-ring-color" as any]: tier.ring }}
        >
          <AvatarImage src={entry.profileImage ?? undefined} alt={entry.nickname || entry.username} />
          <AvatarFallback className="text-sm font-semibold bg-gray-100 text-gray-500">
            {(entry.nickname || entry.username).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <p className="font-semibold text-[15px] text-gray-900 mt-2.5 text-center truncate max-w-[9.5rem]">
          {entry.nickname || entry.username}
        </p>
        <p className="text-xs text-gray-400 truncate max-w-[9.5rem]">@{entry.username}</p>

        {entry.level && (
          <div className="mt-1.5">
            <LevelBadge level={entry.level} size="sm" />
          </div>
        )}

        <div className="flex items-center gap-1 mt-2">
          <Star className="size-4 shrink-0 fill-amber-400 text-amber-400" />
          <span className="font-bold tabular-nums text-lg text-gray-900">
            {entry.totalScore.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Podium base — the only place rank is shown */}
      <div
        className="w-20 sm:w-24 rounded-t-lg flex items-start justify-center pt-2"
        style={{ height: tier.height, backgroundColor: tier.base }}
      >
        <span className="text-2xl font-bold tabular-nums" style={{ color: tier.baseText }}>
          {entry.rank}
        </span>
      </div>
    </div>
  );
}

export default function LeaderboardPodium({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="flex items-end justify-center gap-4 sm:gap-8 bg-white border border-gray-200 rounded-xl pt-8 pb-0 px-4 overflow-hidden">
      {entries.map((entry) => (
        <PodiumCard key={entry.userId} entry={entry} />
      ))}
    </div>
  );
}