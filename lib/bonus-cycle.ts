import { prisma } from "@/lib/prisma";

const BONUS_CYCLE_KEY = "bonus_leaderboard_cycle_start";
const BONUS_RANK_SNAPSHOT_KEY = "bonus_leaderboard_rank_snapshot";

// 🟢 ตั้งค่าวันเริ่มต้นเป็น 1 สิงหาคม 2026 (ปี 2026, เดือน 7 คือ ส.ค., วันที่ 1)
export const DEFAULT_CYCLE_START = new Date(2026, 7, 1, 0, 0, 0, 0);

// Snapshot จะถูกอัปเดตอัตโนมัติทุกๆ 24 ชั่วโมง
const SNAPSHOT_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

type RankSnapshot = {
  snapshotAt: string;
  ranks: Record<string, number>;
};

/**
 * อ่านวันที่เริ่มนับรอบคะแนนของ Early Bird Bonus Leaderboard
 * หากค่าใน DB เก่ากว่าวันที่ 1/8/2026 ให้ยึดวันที่ 1/8/2026 เป็นหลักเสมอ
 */
export async function getBonusCycleStart(): Promise<Date> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: BONUS_CYCLE_KEY },
  });

  if (setting) {
    const parsed = new Date(setting.value);
    if (!isNaN(parsed.getTime())) {
      // 🟢 ป้องกันกรณีวันที่ใน DB เก่ากว่าวันเริ่มต้นระบบ (1 ส.ค. 2026)
      return parsed < DEFAULT_CYCLE_START ? DEFAULT_CYCLE_START : parsed;
    }
  }

  return DEFAULT_CYCLE_START;
}

/**
 * รีเซ็ตรอบคะแนน Leaderboard ไปเป็นเวลาปัจจุบัน
 */
export async function resetBonusCycle(userId: string): Promise<Date> {
  const now = new Date();

  await prisma.appSetting.upsert({
    where: { key: BONUS_CYCLE_KEY },
    update: { value: now.toISOString(), updatedBy: userId },
    create: { key: BONUS_CYCLE_KEY, value: now.toISOString(), updatedBy: userId },
  });

  return now;
}

/**
 * ดึงข้อมูลช่วงเวลาของรอบปัจจุบัน
 */
export async function getBonusCycleInfo(): Promise<{
  cycleStart: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
}> {
  const cycleStart = await getBonusCycleStart();
  const setting = await prisma.appSetting.findUnique({
    where: { key: BONUS_CYCLE_KEY },
  });

  return {
    cycleStart,
    updatedBy: setting?.updatedBy ?? null,
    updatedAt: setting?.updatedAt ?? null,
  };
}

export async function getPrevRankSnapshot(): Promise<RankSnapshot | null> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: BONUS_RANK_SNAPSHOT_KEY },
  });

  if (!setting) return null;

  try {
    return JSON.parse(setting.value) as RankSnapshot;
  } catch {
    return null;
  }
}

async function saveRankSnapshot(ranks: Record<string, number>): Promise<void> {
  const payload: RankSnapshot = {
    snapshotAt: new Date().toISOString(),
    ranks,
  };

  await prisma.appSetting.upsert({
    where: { key: BONUS_RANK_SNAPSHOT_KEY },
    update: { value: JSON.stringify(payload) },
    create: { key: BONUS_RANK_SNAPSHOT_KEY, value: JSON.stringify(payload) },
  });
}

export async function maybeRefreshRankSnapshot(
  currentRanks: Record<string, number>,
  prevSnapshot: RankSnapshot | null,
): Promise<void> {
  const shouldRefresh =
    !prevSnapshot ||
    Date.now() - new Date(prevSnapshot.snapshotAt).getTime() >= SNAPSHOT_REFRESH_INTERVAL_MS;

  if (shouldRefresh) {
    await saveRankSnapshot(currentRanks);
  }
}

export async function clearRankSnapshot(): Promise<void> {
  await prisma.appSetting.deleteMany({
    where: { key: BONUS_RANK_SNAPSHOT_KEY },
  });
}