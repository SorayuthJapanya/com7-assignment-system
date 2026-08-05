// lib/bonus-buckets.ts

export type BonusBucketMeta = {
  key: string;
  emoji: string;
  situation: string;
  condition: string;
  modifierLabel: string;
  modifierType: "positive" | "neutral" | "negative"; 
  exampleReward: number;
};

export const BONUS_BUCKETS: BonusBucketMeta[] = [
  { key: "super_early", emoji: "🚀", situation: "ส่งเร็วมาก", condition: "ก่อน deadline ≥ 7 วัน", modifierLabel: "+500", modifierType: "positive", exampleReward: 500 },
  { key: "early", emoji: "🏅", situation: "ส่งเร็ว", condition: "ก่อน deadline ≥ 3 วัน", modifierLabel: "+500", modifierType: "positive", exampleReward: 500 },
  { key: "before", emoji: "⭐", situation: "ส่งก่อน", condition: "ก่อน deadline ≥ 1 วัน", modifierLabel: "+500", modifierType: "positive", exampleReward: 500 },
  { key: "ontime", emoji: "⏰", situation: "ตรงเวลา", condition: "ภายใน 24 ชม. ก่อน deadline", modifierLabel: "+500", modifierType: "positive", exampleReward: 500 },
  { key: "late_minor", emoji: "🐢", situation: "สายเล็กน้อย", condition: "สาย 1–3 วัน", modifierLabel: "-300", modifierType: "negative", exampleReward: -300 },
  { key: "late_major", emoji: "⚠️", situation: "สายมาก", condition: "สาย 3–7 วัน", modifierLabel: "-500", modifierType: "negative", exampleReward: -500 },
  { key: "late_worst", emoji: "🚨", situation: "สายมากที่สุด", condition: "สาย 7+ วัน", modifierLabel: "-700", modifierType: "negative", exampleReward: -700 },
];