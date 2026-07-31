"use client";

import { useState, useRef } from "react";
import type { BonusTableData, MissionQuestKpis, BonusBucketMeta, BonusBucketEntry } from "@/types/mission-quest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarRange, Target, Coins, RotateCcw } from "lucide-react";
import { useAuthUser } from "@/contexts/auth-context";
import type { IUser } from "@/types/auth";

const MODIFIER_STYLE: Record<"positive" | "neutral" | "negative", string> = {
  positive: "text-emerald-600 border-emerald-200 bg-emerald-50",
  neutral: "text-slate-500 border-slate-200 bg-slate-50",
  negative: "text-red-600 border-red-200 bg-red-50",
};

function formatShortDate(iso: string | Date) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function formatCycleDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function formatCycleRange(iso?: string) {
  const startLabel = formatCycleDate(iso);
  if (!startLabel) return null;
  const todayLabel = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  return `${startLabel} – ${todayLabel}`;
}

function getDiffMinutes(deadline: string | Date, submitAt: string | Date): number | null {
  if (!deadline || !submitAt) return null;
  const d = new Date(deadline).getTime();
  const s = new Date(submitAt).getTime();
  if (isNaN(d) || isNaN(s)) return null;
  return Math.round(Math.abs(d - s) / (1000 * 60));
}

function formatDiffDuration(totalMinutes: number | null): string {
  if (totalMinutes === null || isNaN(totalMinutes)) return "- นาที";

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} วัน`);
  if (hours > 0) parts.push(`${hours} ชม.`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} นาที`);

  return parts.join(" ");
}

interface TooltipState {
  bucket: BonusBucketMeta;
  count?: number;
  entries?: BonusBucketEntry[];
  top: number;
  left: number;
  placement: "above" | "below";
  type: "header" | "cell";
}

function BucketTooltip({
  state,
  onMouseEnter,
  onMouseLeave,
}: {
  state: TooltipState;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const { bucket: b, entries, top, left, placement, type } = state;
  const isHeader = type === "header";

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed z-50 w-72 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl text-left pointer-events-auto max-h-80 overflow-y-auto"
      style={{
        top,
        left,
        transform: `translate(-50%, ${placement === "above" ? "-100%" : "0"})`,
      }}
    >
      {isHeader && (
        <>
          <div className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
            <span>{b.emoji}</span>
            <span>{b.situation}</span>
          </div>

          <div className="flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>เงื่อนไข</span>
              <span className="text-slate-700 font-medium">{b.condition}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Bonus / Penalty</span>
              <span className={cn("font-bold px-1.5 py-0.5 rounded border", MODIFIER_STYLE[b.modifierType])}>
                {b.modifierLabel}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>คะแนนตัวอย่าง</span>
              <span className="text-slate-700 font-medium">{b.exampleReward} Points</span>
            </div>
          </div>
        </>
      )}

      {!isHeader && entries && entries.length > 0 && (() => {
        const e = entries[0];
        const diffMins = getDiffMinutes(e.deadline, e.submitAt);

        return (
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-1">
              {b.modifierType === "negative" ? "Worst Record:" : "Best Record:"}
            </span>
            <div className="text-slate-600 leading-snug bg-slate-50 p-2 rounded border border-slate-100">
              <div className="font-medium text-slate-800 mb-1">• Assignment</div>
              <div className="text-[10px] text-slate-500 flex flex-col gap-0.5 border-t border-slate-100/80 pt-1 mt-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Deadline:</span>
                  <span className="font-semibold text-slate-700">{formatShortDate(e.deadline)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Submitted:</span>
                  <span className="font-semibold text-slate-700">{formatShortDate(e.submitAt)}</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-400">Stat:</span>
                  <span
                    className={cn(
                      "font-semibold",
                      b.modifierType === "positive" && "text-emerald-600",
                      b.modifierType === "neutral" && "text-slate-500",
                      b.modifierType === "negative" && "text-red-600"
                    )}
                  >
                    ({b.modifierType === "negative" ? "สาย" : "สถิติ"} {formatDiffDuration(diffMins)})
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

interface EarlyBirdBonusTableProps {
  data?: BonusTableData;
  kpis?: MissionQuestKpis;
  onResetSuccess?: () => void;
}

export default function EarlyBirdBonusTable({ data, kpis, onResetSuccess }: EarlyBirdBonusTableProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const authUser = useAuthUser() as IUser | null;
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const buckets = data?.buckets ?? [];
  const leaderboard: any[] = (data?.leaderboard as any) ?? [];
  const cycleRangeLabel = formatCycleRange(data?.cycleStart);

  function handleMouseEnter(
    e: React.MouseEvent<HTMLElement>,
    bucket: BonusBucketMeta,
    count?: number,
    entries?: BonusBucketEntry[],
    type: "header" | "cell" = "cell"
  ) {
    if (type === "cell" && (!entries || entries.length === 0)) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const spaceAbove = rect.top;
    const placement: "above" | "below" = spaceAbove < 200 ? "below" : "above";

    setTooltip({
      bucket,
      count,
      entries,
      left: rect.left + rect.width / 2,
      top: placement === "above" ? rect.top - 8 : rect.bottom + 8,
      placement,
      type,
    });
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => {
      setTooltip(null);
    }, 150);
  }

  function handleTooltipMouseEnter() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  async function handleReset() {
    setIsResetting(true);
    try {
      const res = await fetch("/api/mission-quest/bonus-reset", { method: "POST" });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "รีเซ็ตไม่สำเร็จ");
      }

      setShowConfirm(false);
      onResetSuccess?.();
    } catch (err: any) {
      alert(err?.message ?? "เกิดข้อผิดพลาดในการรีเซ็ต");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <Card className="rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          💰 Early Bird Bonus Leaderboard
        </CardTitle>

        <div className="flex items-center gap-2">
          {cycleRangeLabel && (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
              <CalendarRange className="size-3.5 text-blue-500" />
              <span>{cycleRangeLabel}</span>
            </div>
          )}

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
              title="รีเซ็ตตาราง Leaderboard (ข้อมูลเดิมจะไม่หาย)"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 px-3 sm:px-6">
        {/* 🟢 ใส่ overflow-x-auto เพื่อสร้าง Bar สไลด์เมื่อพื้นที่จอไม่พอ */}
        <div className="w-full overflow-x-auto pb-2">
          {/* 🟢 กำหนด min-w-[850px] เพื่อไม่ให้ตารางโดนบีบจนตัดคำ */}
          <table className="w-full min-w-[850px] text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-400 font-semibold">
                <th className="py-2.5 pr-1 w-8 text-slate-500 align-bottom">#</th>
                <th className="py-2.5 pr-2 w-32 text-slate-500 align-bottom">ชื่อ</th>
                <th className="py-2.5 px-1 text-center text-slate-500 align-bottom">
                  <span className="flex flex-col items-center justify-center gap-0.5 leading-tight">
                    <Target className="size-3.5 text-violet-500" />
                    <span className="text-[9px] whitespace-nowrap">Missions</span>
                  </span>
                </th>
                {buckets.map((b) => (
                  <th key={b.key} className="py-2.5 px-1 text-center align-bottom">
                    <span
                      onMouseEnter={(e) => handleMouseEnter(e, b, undefined, undefined, "header")}
                      onMouseLeave={handleMouseLeave}
                      className="inline-flex items-center justify-center cursor-default w-full"
                    >
                      {/* 🟢 แสดงคำเต็ม 100% ห้ามตัดคำ ห้ามขึ้นบรรทัดใหม่ */}
                      <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-1.5 rounded-md whitespace-nowrap hover:bg-slate-200/80 transition-colors inline-block">
                        {b.condition}
                      </span>
                    </span>
                  </th>
                ))}
                <th className="py-2.5 pl-1 text-center text-slate-500 align-bottom">
                  <span className="flex flex-col items-center justify-center gap-0.5 leading-tight">
                    <Coins className="size-3.5 text-amber-500" />
                    <span className="text-[9px] whitespace-nowrap">Bonus</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={buckets.length + 4} className="py-6 text-center text-xs text-slate-300">
                    ยังไม่มีข้อมูลในรอบนี้
                  </td>
                </tr>
              )}
              {leaderboard.map((row) => (
                <tr
                  key={row.username}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-3 pr-2">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-bold text-slate-400 text-xs">#{row.rank}</span>

                      {row.rankTrend?.type === "up" && (
                        <span className="inline-flex items-center text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">
                          ▲{row.rankTrend.diff}
                        </span>
                      )}
                      {row.rankTrend?.type === "down" && (
                        <span className="inline-flex items-center text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-100">
                          ▼{row.rankTrend.diff}
                        </span>
                      )}
                      {row.rankTrend?.type === "same" && (
                        <span className="inline-flex items-center text-[9px] font-bold text-slate-300 bg-slate-50 px-1 py-0.5 rounded">
                          –
                        </span>
                      )}
                      {row.rankTrend?.type === "new" && (
                        <span className="inline-flex items-center text-[8px] font-extrabold text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
                          NEW
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 pr-3">
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-slate-700 truncate text-xs sm:text-sm">{row.name}</span>
                      <span className="text-[11px] text-slate-400 truncate">@{row.username}</span>
                    </div>
                  </td>

                  <td className="py-3 px-2 text-center">
                    <span className="inline-block font-semibold text-[11px] text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {row.missionsDone ?? 0}/{kpis?.missionsTotal ?? 11}
                    </span>
                  </td>

                  {buckets.map((b, idx) => {
                    const count = row?.buckets?.[idx] ?? 0;
                    const entries = row?.bucketEntries?.[idx] ?? [];
                    return (
                      <td key={b.key} className="py-3 px-1 text-center">
                        <span
                          onMouseEnter={(e) => handleMouseEnter(e, b, count, entries, "cell")}
                          onMouseLeave={handleMouseLeave}
                          className={cn(
                            "inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-md text-base cursor-default transition-colors",
                            count > 0
                              ? "bg-violet-50 hover:bg-violet-100 border border-violet-100"
                              : "text-slate-300 text-xs font-bold"
                          )}
                        >
                          {count > 0 ? b.emoji : "–"}
                        </span>
                      </td>
                    );
                  })}

                  <td className="py-3 pl-2 text-center font-bold text-xs">
                    {(row.bonusEarned ?? 0) > 0 ? (
                      <span className="text-emerald-600">+{row.bonusEarned.toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      {tooltip && (
        <BucketTooltip
          state={tooltip}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <h3 className="font-bold text-slate-900">ยืนยันการรีเซ็ต Leaderboard?</h3>
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
              ข้อมูลงาน (Assignment) และคะแนน (Score) เดิมทั้งหมด{" "}
              <b className="text-slate-700">จะไม่ถูกลบ</b> — แต่ตาราง Leaderboard นี้จะเริ่มนับคะแนนสะสมใหม่
              จากตอนนี้เป็นต้นไป จนกว่าจะกด Reset อีกครั้ง
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isResetting}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isResetting ? "กำลังรีเซ็ต..." : "ยืนยัน Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}