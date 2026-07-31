export interface EarlyBirdCondition {
  emoji: string;
  situation: string;
  modifierLabel: string;
  isBonus: boolean;
  colorClass: string;
  textColorClass: string;
}

// map ค่า modifier (จาก calculateEarlyBirdModifier() ฝั่ง backend) -> label ที่แสดงผล
// ใช้ร่วมกันทั้ง AssignmentCard และ EarlyBirdBonusTable เพื่อไม่ให้ label เพี้ยนกันคนละที่
export function getEarlyBirdCondition(
  modifier: number | null | undefined
): EarlyBirdCondition | null {
  if (modifier === null || modifier === undefined) return null;

  const map: Record<
    number,
    Omit<EarlyBirdCondition, "isBonus" | "colorClass" | "textColorClass">
  > = {
    0.3: { emoji: "🥇", situation: "ส่งเร็วมาก", modifierLabel: "+30%" },
    0.2: { emoji: "🥈", situation: "ส่งเร็ว", modifierLabel: "+20%" },
    0.1: { emoji: "🥉", situation: "ส่งก่อน", modifierLabel: "+10%" },
    0: { emoji: "⏱️", situation: "ตรงเวลา", modifierLabel: "+0%" },
    [-0.1]: { emoji: "⚠️", situation: "สายเล็กน้อย", modifierLabel: "-10%" },
    [-0.25]: { emoji: "🔺", situation: "สายมาก", modifierLabel: "-25%" },
    [-0.5]: { emoji: "❌", situation: "สายมากที่สุด", modifierLabel: "-50%" },
  };

  const found = map[modifier];
  if (!found) return null;

  const isBonus = modifier > 0;
  const isNeutral = modifier === 0;

  return {
    ...found,
    isBonus,
    colorClass: isNeutral
      ? "bg-slate-100"
      : isBonus
        ? "bg-emerald-50"
        : "bg-red-50",
    textColorClass: isNeutral
      ? "text-slate-600"
      : isBonus
        ? "text-emerald-700"
        : "text-red-700",
  };
}