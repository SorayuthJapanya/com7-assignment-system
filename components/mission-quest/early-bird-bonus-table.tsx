"use client";

import { useState, useRef } from "react";
import type { BonusTableData, MissionQuestKpis, BonusBucketEntry } from "@/types/mission-quest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarRange, Coins, RotateCcw } from "lucide-react";
import { useAuthUser } from "@/contexts/auth-context";
import type { IUser } from "@/types/auth";
import { BONUS_BUCKETS } from "@/lib/bonus-buckets";

// เปิด/ปิด mock ด้วยการแก้ true/false ตรงนี้
const USE_MOCK_LEADERBOARD = false;

const MODIFIER_STYLE: Record<"positive" | "neutral" | "negative", string> = {
  positive: "text-emerald-600 border-emerald-200 bg-emerald-50",
  neutral: "text-slate-500 border-slate-200 bg-slate-50",
  negative: "text-red-600 border-red-200 bg-red-50",
};

// สีหัวคอลัมน์ตามตัวอย่างในรูป
const BUCKET_HEADER_STYLE = [
  "bg-indigo-600 text-white hover:bg-indigo-700",       // >= 7 วัน
  "bg-teal-500 text-white hover:bg-teal-600",           // >= 3 วัน
  "bg-emerald-500 text-white hover:bg-emerald-600",     // >= 1 วัน
  "bg-orange-400 text-white hover:bg-orange-500",       // ภายใน 24 ชม.
  "bg-orange-500 text-white hover:bg-orange-600",       // 1–3 วัน
  "bg-orange-600 text-white hover:bg-orange-700",       // 3–7 วัน
  "bg-red-800 text-white hover:bg-red-900",             // 7+ วัน
];

// ข้อความสั้นบนหัวคอลัมน์
const BUCKET_HEADER_LABEL = [
  "≥7 วัน",
  "≥3 วัน",
  "≥1 วัน",
  "ภายใน 24 ชม.",
  "1–3 วัน",
  "3–7 วัน",
  "7+ วัน",
];

// Mock ชุด เต็ม 7 buckets - 1 คนต่อ 1 bucket ตรงตามเงื่อนไขจริงของระบบ
const MOCK_LEADERBOARD = [
  {
    rank: 1,
    rankTrend: { type: "new" as const, diff: 0 },
    userId: "u1",
    name: "Ploy",
    username: "Ploychan",
    buckets: [1, 0, 0, 0, 0, 0, 0],
    bucketEntries: [
      [{ id: "a1", assignmentId: "a1", title: "รายงานสรุปยอดขาย Q3", deadline: new Date(Date.now() + 8 * 86400000).toISOString(), submitAt: new Date().toISOString(), reward: 150 }],
      [], [], [], [], [], [],
    ],
    missionsDone: 3,
    bonusEarned: 1950,
    totalPoints: 2600,
  },
  {
    rank: 2,
    rankTrend: { type: "up" as const, diff: 1 },
    userId: "u2",
    name: "Nott",
    username: "Nottapong",
    buckets: [0, 1, 0, 0, 0, 0, 0],
    bucketEntries: [
      [],
      [{ id: "b1", assignmentId: "b1", title: "ตรวจสอบเอกสารสัญญา", deadline: new Date(Date.now() + 4 * 86400000).toISOString(), submitAt: new Date().toISOString(), reward: 120 }],
      [], [], [], [], [],
    ],
    missionsDone: 2,
    bonusEarned: 1440,
    totalPoints: 1900,
  },
  {
    rank: 3,
    rankTrend: { type: "same" as const, diff: 0 },
    userId: "u3",
    name: "Beam",
    username: "Beam_wr",
    buckets: [0, 0, 1, 0, 0, 0, 0],
    bucketEntries: [
      [], [],
      [{ id: "c1", assignmentId: "c1", title: "อัปเดตฐานข้อมูลลูกค้า", deadline: new Date(Date.now() + 1 * 86400000).toISOString(), submitAt: new Date().toISOString(), reward: 100 }],
      [], [], [], [],
    ],
    missionsDone: 2,
    bonusEarned: 1100,
    totalPoints: 1500,
  },
  {
    rank: 4,
    rankTrend: { type: "new" as const, diff: 0 },
    userId: "u4",
    name: "Ken",
    username: "Kenta_p",
    buckets: [0, 0, 0, 1, 0, 0, 0],
    bucketEntries: [
      [], [], [],
      [{ id: "d1", assignmentId: "d1", title: "จัดเตรียมสไลด์นำเสนอลูกค้า", deadline: new Date().toISOString(), submitAt: new Date().toISOString(), reward: 100 }],
      [], [], [],
    ],
    missionsDone: 1,
    bonusEarned: 700,
    totalPoints: 900,
  },
  {
    rank: 5,
    rankTrend: { type: "down" as const, diff: 2 },
    userId: "u5",
    name: "Mind",
    username: "Mind_su",
    buckets: [0, 0, 0, 0, 1, 0, 0],
    bucketEntries: [
      [], [], [], [],
      [{ id: "e1", assignmentId: "e1", title: "แก้ไขบั๊กระบบ login", deadline: new Date(Date.now() - 2 * 86400000).toISOString(), submitAt: new Date().toISOString(), reward: 100 }],
      [], [],
    ],
    missionsDone: 1,
    bonusEarned: -300,
    totalPoints: 800,
  },
  {
    rank: 6,
    rankTrend: { type: "same" as const, diff: 0 },
    userId: "u6",
    name: "Poomjai",
    username: "Passakorn_pumisit",
    buckets: [0, 0, 0, 0, 0, 1, 0],
    bucketEntries: [
      [], [], [], [], [],
      [{ id: "f1", assignmentId: "f1", title: "รีวิวโค้ด PR #482", deadline: new Date(Date.now() - 5 * 86400000).toISOString(), submitAt: new Date().toISOString(), reward: 100 }],
      [],
    ],
    missionsDone: 1,
    bonusEarned: -500,
    totalPoints: 650,
  },
  {
    rank: 7,
    rankTrend: { type: "down" as const, diff: 1 },
    userId: "u7",
    name: "Fah",
    username: "Fahsai_k",
    buckets: [0, 0, 0, 0, 0, 0, 1],
    bucketEntries: [
      [], [], [], [], [], [],
      [{ id: "g1", assignmentId: "g1", title: "ส่งรายงานประจำเดือน", deadline: new Date(Date.now() - 9 * 86400000).toISOString(), submitAt: new Date().toISOString(), reward: 100 }],
    ],
    missionsDone: 1,
    bonusEarned: -700,
    totalPoints: 350,
  },
];

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-amber-600",
  "bg-red-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
];

function avatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-amber-50 text-base" title="#1">
        🥇
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-slate-100 text-base" title="#2">
        🥈
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-orange-50 text-base" title="#3">
        🥉
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold text-slate-400 tabular-nums">#{rank}</span>
  );
}

function getBucketHeaderClass(idx: number) {
  return BUCKET_HEADER_STYLE[idx] ?? "bg-slate-100 text-slate-600 hover:bg-slate-200/80";
}

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
  bucket: (typeof BONUS_BUCKETS)[number];
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

  const buckets =
    data?.buckets && data.buckets.length > 0 ? data.buckets : BONUS_BUCKETS;

  const realLeaderboard: any[] = (data?.leaderboard as any) ?? [];
  const leaderboard = USE_MOCK_LEADERBOARD ? MOCK_LEADERBOARD : realLeaderboard;

  const cycleRangeLabel = formatCycleRange(data?.cycleStart);

  function handleMouseEnter(
    e: React.MouseEvent<HTMLElement>,
    bucket: (typeof BONUS_BUCKETS)[number],
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
          Early Bird Bonus Leaderboard
          {USE_MOCK_LEADERBOARD && (
            <span className="text-[10px] font-semibold uppercase tracking-wide rounded bg-amber-100 text-amber-700 px-1.5 py-0.5">
              Mock
            </span>
          )}
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
        <div className="w-full overflow-x-auto pb-2">
          <table className="w-full min-w-[900px] text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-400 font-semibold">
                <th className="py-2.5 pr-1 w-10 text-center text-slate-500 align-bottom">#</th>
                <th className="py-2.5 pr-2 w-44 text-slate-500 align-bottom">ชื่อ</th>
                {buckets.map((b, idx) => (
                  <th key={b.key} className="py-2.5 px-1 text-center align-bottom">
                    <span
                      onMouseEnter={(e) => handleMouseEnter(e, b, undefined, undefined, "header")}
                      onMouseLeave={handleMouseLeave}
                      className="inline-flex items-center justify-center cursor-default w-full"
                    >
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap transition-colors",
                          getBucketHeaderClass(idx)
                        )}
                      >
                        <span className="text-sm leading-none">{b.emoji}</span>
                        <span>{BUCKET_HEADER_LABEL[idx] ?? b.condition}</span>
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
                  <td colSpan={buckets.length + 3} className="py-6 text-center text-xs text-slate-300">
                    ยังไม่มีข้อมูลในรอบนี้
                  </td>
                </tr>
              )}
              {leaderboard.map((row) => (
                <tr
                  key={row.username}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-3 pr-2 text-center align-middle">
                    <div className="flex flex-col items-center gap-0.5">
                      <RankBadge rank={row.rank} />
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
                    </div>
                  </td>

                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                          avatarColor(row.username || row.name || "")
                        )}
                      >
                        {(row.name?.trim()?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold text-slate-800 truncate text-xs sm:text-sm">
                            {row.name}
                          </span>
                          {row.rankTrend?.type === "new" && (
                            <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-sky-100 text-sky-600 border border-sky-100">
                              NEW
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 truncate">@{row.username}</span>
                      </div>
                    </div>
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
                          {count > 0 ? b.emoji : ""}
                        </span>
                      </td>
                    );
                  })}

                  <td className="py-3 pl-2 text-center font-bold text-xs">
                    {(() => {
                      const netBonus = row.bonusEarned ?? 0;
                      if (netBonus > 0) {
                        return <span className="text-emerald-600">+{netBonus.toLocaleString()}</span>;
                      } else if (netBonus < 0) {
                        return <span className="text-red-600">{netBonus.toLocaleString()}</span>;
                      } else {
                        return <span className="text-slate-400">0</span>;
                      }
                    })()}
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