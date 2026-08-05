// lib/score-constants.ts
import { prisma } from "@/lib/prisma";

export const REDEEM_REVIEWERS = {
  OVERDUE_DEDUCTION: "Overdue Deduction",
  NEGATIVE_DEDUCTION: "Negative Point Deduction",
} as const;

export const REDEEM_REVIEWER_LIST = Object.values(REDEEM_REVIEWERS);

const NEGATIVE_CYCLE_KEY = "negative_points_cycle_start";

// ค่า default: เริ่มนับตั้งแต่วันนี้ (วันที่ deploy ฟีเจอร์นี้)
export const DEFAULT_NEGATIVE_CYCLE_START = new Date(2026, 7, 5, 0, 0, 0, 0); // 5 ส.ค. 2026

/**
 * อ่านวันที่เริ่มนับ Negative Points
 * หากค่าใน DB เก่ากว่า DEFAULT ให้ยึด DEFAULT เป็นหลักเสมอ (กันค่าเพี้ยนย้อนหลัง)
 */
export async function getNegativePointsCycleStart(): Promise<Date> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: NEGATIVE_CYCLE_KEY },
  });

  if (setting) {
    const parsed = new Date(setting.value);
    if (!isNaN(parsed.getTime())) {
      return parsed < DEFAULT_NEGATIVE_CYCLE_START ? DEFAULT_NEGATIVE_CYCLE_START : parsed;
    }
  }

  return DEFAULT_NEGATIVE_CYCLE_START;
}

/**
 * รีเซ็ตรอบนับ Negative Points ไปเป็นเวลาปัจจุบัน (ใช้โดย SUPER_ADMIN)
 */
export async function resetNegativePointsCycle(userId: string): Promise<Date> {
  const now = new Date();

  await prisma.appSetting.upsert({
    where: { key: NEGATIVE_CYCLE_KEY },
    update: { value: now.toISOString(), updatedBy: userId },
    create: { key: NEGATIVE_CYCLE_KEY, value: now.toISOString(), updatedBy: userId },
  });

  return now;
}

export async function getNegativePointsCycleInfo(): Promise<{
  cycleStart: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
}> {
  const cycleStart = await getNegativePointsCycleStart();
  const setting = await prisma.appSetting.findUnique({
    where: { key: NEGATIVE_CYCLE_KEY },
  });

  return {
    cycleStart,
    updatedBy: setting?.updatedBy ?? null,
    updatedAt: setting?.updatedAt ?? null,
  };
}