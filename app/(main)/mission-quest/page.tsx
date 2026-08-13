"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { MissionQuestResponse } from "@/types/mission-quest";
import { MOCK_MISSION_QUEST } from "@/lib/mission-quest-mock";
import MissionSection from "@/components/mission-quest/mission-section";
import RewardBanner from "@/components/mission-quest/reward-banner";
import MissionCharts from "@/components/mission-quest/mission-charts";
import { ShieldAlert, AlertTriangle, History, X } from "lucide-react";
import { useAuthUser } from "@/contexts/auth-context";
import type { IUser } from "@/types/auth";
import { redeemMission } from "@/services/mission-quest-services";
import ClaimSuccessDialog from "@/components/mission-quest/claim-success-dialog";

const MISSION_NAME_MAP: Record<string, string> = {
  "speed-runner": "Speed Runner",
  "perfect-month": "Perfect Month",
  "first-responder": "First Responder",
  "quality-king": "Quality King",
  "zero-reject": "Zero Reject",
  workaholic: "Workaholic",
  "consistency-pro": "8-Week Streak",
  "report-pro": "20+ Reviews",
  "no-backlog": "No Backlog",
  "level-up": "Level Up!",
  "comeback-kid": "Comeback Kid",
};

type ClaimHistoryItem = {
  id: string;
  missionId: string;
  points: number;
  month: number;
  year: number;
  claimedAt: string;
};

export default function MissionQuestPage() {
  const authUser = useAuthUser() as IUser | null;
  const router = useRouter();

  const [data, setData] = useState<MissionQuestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimResult, setClaimResult] = useState<{ missionName: string; points: number } | null>(null);

  // ── Popup ประวัติการกดรับรางวัล ──
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [claimHistory, setClaimHistory] = useState<ClaimHistoryItem[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const hasAccess = authUser?.role === "STAFF" || authUser?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (authUser?.role === "SUPER_ADMIN") {
      router.replace("/mission-quest/admin");
    }
  }, [authUser, router]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (opts?.silent) {
      setIsRefreshing(true);
    } else if (!data) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setApiError(null);
    try {
      const res = await fetch("/api/mission-quest", {
        credentials: "include",
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (res.ok) {
        setData(await res.json());
        setIsUsingMock(false);
      } else {
        const body = await res.json().catch(() => ({}));
        setApiError(`API error ${res.status}: ${body.error ?? "unknown"}`);
        if (!data) {
          setData(MOCK_MISSION_QUEST);
          setIsUsingMock(true);
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error("mission-quest fetch error:", err);
      setApiError(err instanceof Error ? err.message : "Network error");
      if (!data) {
        setData(MOCK_MISSION_QUEST);
        setIsUsingMock(true);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsRefreshing(false);
        setIsLoading(false);
      }
    }
  }, [data]);

  useEffect(() => {
    if (authUser && !hasAccess) return;
    if (authUser?.role === "SUPER_ADMIN") return;
    if (authUser?.role === "STAFF") {
      load();
    }
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, hasAccess]);

  const openClaimHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch("/api/mission-quest/claim-history", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `API error ${res.status}`);
      }
      const body = await res.json();
      setClaimHistory(Array.isArray(body.claims) ? body.claims : []);
    } catch (err: any) {
      setHistoryError(err?.message ?? "โหลดประวัติไม่สำเร็จ");
      setClaimHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleClaim = async (missionId: string) => {
    if (!data) return;
    setClaimingId(missionId);
    try {
      const res = await redeemMission({ missionId });
      const missionName =
        data.sections.flatMap((s) => s.missions).find((m) => m.id === missionId)?.name ?? missionId;

      await load({ silent: true });
      setClaimResult({ missionName, points: res.rewardPoints });
      window.dispatchEvent(
        new CustomEvent("mission-quest:claimed", {
          detail: { missionId, points: res.rewardPoints },
        }),
      );
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? "Claim ไม่สำเร็จ";
      alert(message);
      console.error("claim error:", err);
    } finally {
      setClaimingId(null);
    }
  };

  if (authUser?.role === "SUPER_ADMIN") {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

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

  if ((isLoading && !data) || !data) {
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mission &amp; Quest</h1>
          <p className="text-sm text-slate-500 mt-1">
            ภารกิจประจำเดือน สะสมแต้ม แลกรางวัล และไต่อันดับ Leaderboard
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isRefreshing && (
            <span className="text-[11px] text-slate-400 animate-pulse whitespace-nowrap hidden sm:inline">
              กำลังอัปเดตข้อมูล...
            </span>
          )}
          {/* ปุ่มหัวข้อ — เด่นขึ้น */}
          <button
            type="button"
            onClick={openClaimHistory}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors shadow-sm"
          >
            <History className="size-4 text-indigo-600" />
            <span>ประวัติการกดรับรางวัล</span>
          </button>
        </div>
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

      <RewardBanner summary={data.summary} />

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

      {/* ── Popup ประวัติการกดรับรางวัล ── */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={() => setHistoryOpen(false)}
          />
          <div className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-indigo-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/15">
                  <History className="size-4" />
                </div>
                <h2 className="text-sm font-bold">ประวัติการกดรับรางวัล</h2>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {historyLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-xl bg-indigo-50/80 animate-pulse" />
                  ))}
                </div>
              )}

              {!historyLoading && historyError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-red-700">{historyError}</p>
                </div>
              )}

              {!historyLoading && !historyError && claimHistory.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                  <History className="size-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">ยังไม่มีประวัติการกดรับรางวัล</p>
                  <p className="text-xs text-slate-400 mt-1">เมื่อกด Claim สำเร็จ รายการจะโชว์ที่นี่</p>
                </div>
              )}

              {!historyLoading && !historyError && claimHistory.length > 0 && (
                <ul className="space-y-2">
                  {claimHistory.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-white px-3.5 py-3 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {MISSION_NAME_MAP[item.missionId] ?? item.missionId}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.month}/{item.year} ·{" "}
                          {new Date(item.claimedAt).toLocaleString("th-TH", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-sm font-bold text-emerald-700">
                        +{item.points.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}