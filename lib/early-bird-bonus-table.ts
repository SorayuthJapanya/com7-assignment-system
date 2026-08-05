export interface EarlyBirdCondition {
  emoji: string;
  situation: string;
  modifierLabel: string;
  isBonus: boolean;
  colorClass: string;
  textColorClass: string;
}

// CHANGED: flat points ไม่ใช่ % แล้ว ต้องตรงกับ calculateLatePenalty()
// ใน assignments/[id]/route.ts เป๊ะๆ (0, -300, -500, -700)
// เดิม map นี้เก็บ key เป็น % (0.3, 0.2, -0.1, ...) ซึ่งไม่ตรงกับค่าที่
// backend ใหม่เขียนลง earlyBirdModifier อีกต่อไป ทำให้ทุกเคสที่สาย
// (-300/-500/-700) หา key ไม่เจอแล้ว return null → badge หายไปเงียบๆ
export function getEarlyBirdCondition(
  modifier: number | null | undefined
): EarlyBirdCondition | null {
  if (modifier === null || modifier === undefined) return null;

  const map: Record<
    number,
    Omit<EarlyBirdCondition, "isBonus" | "colorClass" | "textColorClass">
  > = {
    0: { emoji: "⏱️", situation: "ไม่มีการหักคะแนน", modifierLabel: "+0" },
    [-300]: { emoji: "🐢", situation: "สายเล็กน้อย", modifierLabel: "-300" },
    [-500]: { emoji: "⚠️", situation: "สายมาก", modifierLabel: "-500" },
    [-700]: { emoji: "🚨", situation: "สายมากที่สุด", modifierLabel: "-700" },
  };

  const found = map[modifier];
  if (!found) return null;

  // ฝั่ง modifier นี้เหลือแต่ penalty ล้วนแล้ว (ไม่มี early bonus % อีกต่อไป
  // เพราะ early/ontime ไปแข่ง Record Bonus +500 แยกต่างหากผ่าน getBucketDisplay)
  const isBonus = false;
  const isNeutral = modifier === 0;

  return {
    ...found,
    isBonus,
    colorClass: isNeutral ? "bg-slate-100" : "bg-red-50",
    textColorClass: isNeutral ? "text-slate-600" : "text-red-700",
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 🆕 ใหม่: bucket display สำหรับ racing bucket (super_early/early/before/
// ontime/late_minor/late_major/late_worst) ต้องตรงกับ BONUS_BUCKETS ใน
// mission-quest/route.ts และ getRacingBucketIndex/getFullBucketIndex ใน
// lib/bonus-cycle.ts — แยกออกจาก getEarlyBirdCondition เพราะคนละ concept:
// getEarlyBirdCondition = penalty ที่ถูกหักจริงจาก finalScore (0 ถึง -700)
// getBucketDisplay      = สถานะการแข่ง Record Bonus +500 (ไม่เกี่ยวกับ
//                          penalty เลย ใช้แค่บอกว่าใน bucket ไหน / กำลัง
//                          แข่งอยู่หรือเปล่า / ได้ record bonus หรือยัง)
// ─────────────────────────────────────────────────────────────────────────
export interface BucketDisplay {
  emoji: string;
  situation: string;
  isRacing: boolean; // true = อยู่ใน 4 bucket ที่แข่ง record bonus ได้ (idx 0-3)
}

const BUCKET_DISPLAY_MAP: Record<number, BucketDisplay> = {
  0: { emoji: "🚀", situation: "ส่งเร็วมาก", isRacing: true },
  1: { emoji: "🏅", situation: "ส่งเร็ว", isRacing: true },
  2: { emoji: "⭐", situation: "ส่งก่อน", isRacing: true },
  3: { emoji: "⏰", situation: "ตรงเวลา", isRacing: true },
  4: { emoji: "🐢", situation: "สายเล็กน้อย", isRacing: false },
  5: { emoji: "⚠️", situation: "สายมาก", isRacing: false },
  6: { emoji: "🚨", situation: "สายมากที่สุด", isRacing: false },
};

export function getBucketDisplay(bucket: number | null | undefined): BucketDisplay | null {
  if (bucket === null || bucket === undefined) return null;
  return BUCKET_DISPLAY_MAP[bucket] ?? null;
}