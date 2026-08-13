"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthUser } from "@/contexts/auth-context";
import { ShieldAlert } from "lucide-react";
import EarlyBirdBonusTable from "@/components/mission-quest/early-bird-bonus-table";
import type { BonusTableData, MissionQuestKpis } from "@/types/mission-quest";

type LeaderboardResponse = {
  cycleStart: string;
  buckets: BonusTableData["buckets"];
  leaderboard: BonusTableData["leaderboard"];
  kpis: MissionQuestKpis;
};

export default function EarlyBirdLeaderboardPage() {
  const authUser = useAuthUser();
  const hasAccess = authUser?.role === "STAFF" || authUser?.role === "SUPER_ADMIN";

  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    setIsLoading(true);
    fetch("/api/mission-quest/early-bird-leaderboard", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (body) setData(body);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (hasAccess) load();
  }, [hasAccess, load]);

  if (!authUser || !hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert className="size-8 text-red-500" />
        <p className="text-sm text-slate-500">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <div className="h-8 w-64 rounded bg-slate-100 animate-pulse" />
        <div className="h-96 rounded-xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Early Bird Bonus Leaderboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          อันดับคะแนนโบนัสของรอบปัจจุบัน ตามความเร็วในการส่งงานก่อน deadline
        </p>
      </div>

      <EarlyBirdBonusTable
        data={
          data
            ? {
                buckets: data.buckets,
                leaderboard: data.leaderboard,
                cycleStart: data.cycleStart,
              }
            : undefined
        }
        kpis={data?.kpis}
        onResetSuccess={load}
      />
    </div>
  );
}