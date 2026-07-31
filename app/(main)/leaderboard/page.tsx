"use client";

import { usePublicLeaderboard } from "@/hooks/use-leaderboard";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Trophy, Star } from "lucide-react";
import LeaderboardFilters from "@/components/leaderboard/leaderboard-filters";
import LeaderboardTable from "@/components/leaderboard/leaderboard-table";
import LeaderboardSkeleton from "@/components/leaderboard/leaderboard-skeleton";
import LeaderboardPodium from "@/components/leaderboard/leaderboard-podium";

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

  /* กรองข้อมูลไม่ให้แสดงผู้ใช้งานที่มีบทบาทเป็น INTERN */
  const entries = (data?.leaderboard ?? []).filter((entry: any) => {
    const role = entry?.role || entry?.user?.role;
    return role !== "INTERN";
  });

  const podium = entries.slice(0, 3);

  const todayStamp = new Date().toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#fffff] pb-16 antialiased font-sans">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
              Top Rankings
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              คะแนนสะสมจากงานที่ได้รับการอนุมัติ
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === "SUPER_ADMIN" && (
              <LeaderboardFilters
                yearFilter={yearFilter}
                monthFilter={monthFilter}
                onYearChange={setYearFilter}
                onMonthChange={setMonthFilter}
                onReset={handleReset}
              />
            )}
            <span className="hidden sm:inline-block text-xs text-gray-400 whitespace-nowrap">
              อัปเดต {todayStamp}
            </span>
          </div>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <LeaderboardSkeleton />
        ) : !entries.length ? (
          <div className="bg-white rounded-xl py-20 text-center border border-gray-200">
            <Trophy className="w-9 h-9 mx-auto text-gray-300 mb-3 stroke-[1.25]" />
            <p className="text-sm font-medium text-gray-500">
              ยังไม่มีข้อมูลในช่วงเวลานี้
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {podium.length > 0 && <LeaderboardPodium entries={podium} />}

            <div>
              <div className="flex items-center gap-2 mb-3 px-0.5">
                <Star className="w-4 h-4 text-gray-400" />
                <span className="text-[13px] font-semibold text-gray-600">
                  รายชื่อทั้งหมด
                </span>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <LeaderboardTable entries={entries} currentUserId={user?.id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}