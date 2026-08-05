"use client";

import type { Mission } from "@/types/mission-quest";
import { cn } from "@/lib/utils";
import type { MissionTheme } from "./mission-section";

// 🎨 ธีมไล่สีพื้นหลังการ์ด ตามหมวดหมู่ — แต่ละหมวดมีโทนเป็นของตัวเอง ไม่ซ้ำกัน
const THEME_MAP: Record<
  MissionTheme,
  {
    cardBg: string;
    badgeBg: string;
    categoryBg: string;
    progressTrack: string;
    progressFill: string;
  }
> = {
  time: {
    cardBg: "bg-gradient-to-br from-orange-500 to-red-500",
    badgeBg: "bg-white text-orange-600",
    categoryBg: "bg-white text-orange-600",
    progressTrack: "bg-white/25",
    progressFill: "bg-white",
  },
  quality: {
    cardBg: "bg-gradient-to-br from-pink-500 to-rose-600",
    badgeBg: "bg-white text-rose-600",
    categoryBg: "bg-white text-rose-600",
    progressTrack: "bg-white/25",
    progressFill: "bg-white",
  },
  quantity: {
    cardBg: "bg-gradient-to-br from-green-500 to-emerald-600",
    badgeBg: "bg-white text-emerald-600",
    categoryBg: "bg-white text-emerald-600",
    progressTrack: "bg-white/25",
    progressFill: "bg-white",
  },
  growth: {
    cardBg: "bg-gradient-to-br from-yellow-500 to-amber-600",
    badgeBg: "bg-white text-amber-600",
    categoryBg: "bg-white text-amber-600",
    progressTrack: "bg-white/25",
    progressFill: "bg-white",
  },
  default: {
    cardBg: "bg-white",
    badgeBg: "bg-violet-50 text-violet-700",
    categoryBg: "bg-slate-100 text-slate-600",
    progressTrack: "bg-slate-100",
    progressFill: "bg-violet-500",
  },
};

interface MissionCardProps {
  mission: Mission;
  theme?: MissionTheme;
  legendary?: boolean;
  onClaim?: (missionId: string) => void;
  isClaiming?: boolean;
  // 🆕 โหมดดูอย่างเดียว (Admin เปิดดู mission ของ staff คนอื่น)
  // ปุ่ม Claim จะถูกปิดใช้งานเสมอและเปลี่ยนข้อความ ไม่ว่า onClaim จะถูกส่งมาหรือไม่
  readOnly?: boolean;
}

export default function MissionCard({
  mission,
  theme = "default",
  legendary,
  onClaim,
  isClaiming,
  readOnly = false,
}: MissionCardProps) {
  const isNotStarted = mission.current === 0 && !mission.isCompleted;
  // 🔧 FIX: เดิม canClaim เช็คแค่ isCompleted + !isClaimed ทำให้ปุ่มยัง
  // แสดงเป็น "Claim ได้" แม้ตอน readOnly เพราะปุ่มถูก render จาก
  // mission.isCompleted อย่างเดียว ไม่เคยเช็ค onClaim เลย
  const canClaim = mission.isCompleted && !mission.isClaimed && !readOnly;
  const t = THEME_MAP[theme];
  // การ์ดที่ยังไม่เริ่มเลย ให้เป็นสีเทาจาง ๆ เหมือนเดิม ไม่ใช้สีธีม (กันดูรกตา)
  const useThemeBg = !isNotStarted && theme !== "default";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex flex-col gap-3 transition-shadow",
        isNotStarted
          ? "bg-slate-50 border-slate-100 opacity-60"
          : "hover:shadow-md border-transparent",
        !isNotStarted && legendary
          ? "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300"
          : useThemeBg
            ? cn(t.cardBg, "text-white")
            : !isNotStarted && "bg-white border-slate-200"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("text-2xl leading-none", isNotStarted && "grayscale opacity-70")}>{mission.emoji}</div>
        <div
          className={cn(
            "text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap",
            isNotStarted
              ? "bg-slate-200 text-slate-400"
              : legendary
                ? "bg-gradient-to-r from-amber-200 to-amber-300 text-amber-900"
                : t.badgeBg
          )}
        >
          +{mission.rewardPoints.toLocaleString()} Points
        </div>
      </div>

      <div>
        <span
          className={cn(
            "inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded",
            isNotStarted
              ? "bg-slate-200 text-slate-400"
              : legendary
                ? "bg-amber-300 text-amber-950"
                : t.categoryBg
          )}
        >
          {mission.categoryLabel}
        </span>
        <h4
          className={cn(
            "mt-1.5 text-sm font-bold",
            isNotStarted ? "text-slate-400" : useThemeBg ? "text-white drop-shadow-sm" : "text-slate-900"
          )}
        >
          {mission.name}
        </h4>
        <p
          className={cn(
            "mt-1 text-xs leading-relaxed",
            isNotStarted ? "text-slate-400" : useThemeBg ? "text-white drop-shadow-sm" : "text-slate-500"
          )}
        >
          {mission.description}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={cn(
              "text-xs font-semibold",
              isNotStarted ? "text-slate-400" : useThemeBg ? "text-white drop-shadow-sm" : "text-slate-500"
            )}
          >
            {mission.progressLabel}
          </span>
          <span
            className={cn(
              "text-xs font-bold",
              isNotStarted
                ? "text-slate-400"
                : mission.isCompleted
                  ? useThemeBg
                    ? "text-white"
                    : "text-emerald-600"
                  : useThemeBg
                    ? "text-white"
                    : "text-slate-600"
            )}
          >
            {mission.isCompleted ? "สำเร็จ ✅" : `${mission.progressPct}%`}
          </span>
        </div>
        <div
          className={cn(
            "h-2 w-full rounded-full overflow-hidden",
            useThemeBg ? t.progressTrack : "bg-slate-100"
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              useThemeBg ? t.progressFill : "bg-violet-500"
            )}
            style={{ width: `${Math.max(mission.progressPct, isNotStarted ? 3 : 0)}%` }}
          />
        </div>
      </div>

      {mission.isCompleted && (
        <button
          type="button"
          disabled={!canClaim || isClaiming}
          onClick={() => canClaim && onClaim?.(mission.id)}
          className={cn(
            "mt-1 w-full rounded-lg py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5",
            mission.isClaimed
              ? useThemeBg
                ? "bg-white/20 text-white cursor-default"
                : "bg-emerald-50 text-emerald-500 cursor-default"
              : readOnly
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : useThemeBg
                  ? "bg-white text-slate-900 hover:bg-white/90 disabled:opacity-60"
                  : "bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60"
          )}
        >
          {mission.isClaimed
            ? "รับรางวัลแล้ว "
            : readOnly
              ? "🔒 รอ Staff กด Claim เอง"
              : isClaiming
                ? "กำลังรับรางวัล..."
                : `🎁 Claim +${mission.rewardPoints.toLocaleString()} Points`}
        </button>
      )}
    </div>
  );
}