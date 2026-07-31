"use client";

// app/(main)/mission-quest/page.tsx
//
// เชื่อมกับ API จริงแล้วสำหรับ 11 มิชชั่น + Early Bird Bonus (รวม 12 อย่างที่ยืนยันว่าคำนวณได้จริง)
// ถ้า API ล่มหรือ error จะ fallback ไปใช้ MOCK_MISSION_QUEST แทนโดยอัตโนมัติ
//
// 🆕 อนุญาตให้ SUPER_ADMIN เข้าดูหน้านี้ได้ด้วย (เดิมจำกัดแค่ STAFF)
// 🆕 Early Bird Bonus Leaderboard มีปุ่ม Reset สำหรับ SuperAdmin -> refetch ข้อมูลทั้งหน้าหลัง reset สำเร็จ

import { useEffect, useState, useCallback } from "react";
import type { MissionQuestResponse } from "@/types/mission-quest";
import { MOCK_MISSION_QUEST } from "@/lib/mission-quest-mock";
import MissionSection from "@/components/mission-quest/mission-section";
import EarlyBirdBonusTable from "@/components/mission-quest/early-bird-bonus-table";
import RewardBanner from "@/components/mission-quest/reward-banner";
import MissionCharts from "@/components/mission-quest/mission-charts";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { useAuthUser } from "@/contexts/auth-context";
import type { IUser } from "@/types/auth";
import { redeemMission } from "@/services/mission-quest-services";
import ClaimSuccessDialog from "@/components/mission-quest/claim-success-dialog";

export default function MissionQuestPage() {
  const authUser = useAuthUser() as IUser | null;
  const [data, setData] = useState<MissionQuestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimResult, setClaimResult] = useState<{ missionName: string; points: number } | null>(null);

  // 🆕 อนุญาตทั้ง STAFF และ SUPER_ADMIN
  const hasAccess = authUser?.role === "STAFF" || authUser?.role === "SUPER_ADMIN";

  const load = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/mission-quest");
      if (res.ok) {
        setData(await res.json());
        setIsUsingMock(false);
      } else {
        const body = await res.json().catch(() => ({}));
        setApiError(`API error ${res.status}: ${body.error ?? "unknown"}`);
        setData(MOCK_MISSION_QUEST);
        setIsUsingMock(true);
      }
    } catch (err) {
      console.error("mission-quest fetch error:", err);
      setApiError(err instanceof Error ? err.message : "Network error");
      setData(MOCK_MISSION_QUEST);
      setIsUsingMock(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // ⛔ Guard: หน้านี้มองเห็นได้เฉพาะ Role = STAFF และ SUPER_ADMIN เท่านั้น
    if (authUser && !hasAccess) return;
    load();
  }, [authUser, hasAccess, load]);

  const handleClaim = async (missionId: string) => {
    if (!data) return;
    setClaimingId(missionId);
    try {
      const res = await redeemMission({ missionId });

      const missionName =
        data.sections.flatMap((s) => s.missions).find((m) => m.id === missionId)?.name ?? missionId;

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((section) => ({
            ...section,
            missions: section.missions.map((m) =>
              m.id === missionId ? { ...m, isClaimed: true } : m,
            ),
          })),
        };
      });

      setClaimResult({ missionName, points: res.rewardPoints });

      window.dispatchEvent(new CustomEvent("mission-quest:claimed", { detail: { missionId, points: res.rewardPoints } }));
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? "Claim ไม่สำเร็จ";
      alert(message);
      console.error("claim error:", err);
    } finally {
      setClaimingId(null);
    }
  };

  if (authUser === undefined) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (authUser && !hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center px-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-red-50 text-red-500">
          <ShieldAlert className="size-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Mission &amp; Quest Board เปิดให้ใช้งานเฉพาะบัญชี Staff และ Super Admin เท่านั้น
        </p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mission &amp; Quest</h1>
        <p className="text-sm text-slate-500 mt-1">
          ภารกิจประจำเดือน สะสมแต้ม แลกรางวัล และไต่อันดับ Leaderboard
        </p>
      </div>

      {isUsingMock && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-bold">กำลังแสดงข้อมูลตัวอย่าง (Mock) — ไม่ใช่ข้อมูลจริง</p>
            <p className="mt-0.5 text-amber-700">
              เรียก /api/mission-quest ไม่สำเร็จ{apiError ? `: ${apiError}` : ""} — เช็ค console
              และการเชื่อมต่อฐานข้อมูล
            </p>
          </div>
        </div>
      )}

      {/* 1. Potential Bonus This Month — ขึ้นบนสุด */}
      <RewardBanner summary={data.summary} />

      {/* 2. Early Bird Bonus (รวม KPI 4 การ์ดอยู่ในนี้แล้ว) — SuperAdmin กด Reset ได้จากในนี้ */}
      <EarlyBirdBonusTable data={data.bonusTable} kpis={data.kpis} onResetSuccess={load} />

      {/* 3. มิชชั่นแต่ละกลุ่ม — เฉพาะ 11 มิชชั่นที่เชื่อม API จริงแล้ว */}
      {data.sections.map((section) => (
        <MissionSection
          key={section.key}
          section={section}
          onClaim={handleClaim}
          claimingId={claimingId}
        />
      ))}

      <MissionCharts categoryChart={data.categoryChart} progressChart={data.progressChart} />

      {claimResult && (
        <ClaimSuccessDialog
          open={!!claimResult}
          onClose={() => setClaimResult(null)}
          missionName={claimResult.missionName}
          points={claimResult.points}
        />
      )}
    </div>
  );
}