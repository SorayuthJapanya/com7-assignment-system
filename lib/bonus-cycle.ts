import { prisma } from "@/lib/prisma";
// 🔁 CHANGED: BONUS_BUCKETS now lives in lib/bonus-buckets.ts (a file with
// zero server-only imports) so client components can import it without
// pulling prisma/pg/dns into the browser bundle. Re-exported here too so
// existing `import { BONUS_BUCKETS } from "@/lib/bonus-cycle"` call sites
// (e.g. route.ts) keep working unchanged.

const BONUS_CYCLE_KEY = "bonus_leaderboard_cycle_start";
const BONUS_RANK_SNAPSHOT_KEY = "bonus_leaderboard_rank_snapshot";

//  ตั้งค่าวันเริ่มต้นเป็น 1 สิงหาคม 2026 (ปี 2026, เดือน 7 คือ ส.ค., วันที่ 1)
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
      //  ป้องกันกรณีวันที่ใน DB เก่ากว่าวันเริ่มต้นระบบ (1 ส.ค. 2026)
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

// ─────────────────────────────────────────────────────────────────────────
// 🆕 SHARED: getRacingBucketIndex
//
// ย้ายมาจาก assignments/[id]/route.ts (เดิมเป็น local function ไม่ได้ export)
// เพื่อให้ assignments/[id]/route.ts (PUT — คำนวณ record bonus),
// assignments/route.ts (GET — แสดง bucket badge บนการ์ด), และ
// mission-quest/route.ts ใช้ logic เดียวกันทั้งหมด ป้องกันผลลัพธ์เพี้ยนกัน
//
//   0 = super_early (>= 7 days early)
//   1 = early        (>= 3 days early)
//   2 = before        (>= 1 day early)
//   3 = ontime        (within 24h before deadline, i.e. 0-24h early)
//   null = late (ไม่ได้อยู่ใน race, ฝั่ง calculateLatePenalty จัดการ penalty เอง)
// ─────────────────────────────────────────────────────────────────────────
export function getRacingBucketIndex(deadline: Date, submitAt: Date): number | null {
  const diffMs = deadline.getTime() - submitAt.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffDays >= 7) return 0;
  if (diffDays >= 3) return 1;
  if (diffDays >= 1) return 2;
  if (diffHours >= 0) return 3; // ontime — still races, just a tighter window
  return null; // late — not part of the race, handled by calculateLatePenalty
}


export function getFullBucketIndex(deadline: Date, submitAt: Date): number {
  const racing = getRacingBucketIndex(deadline, submitAt);
  if (racing !== null) return racing;

  const diffMs = deadline.getTime() - submitAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays >= -3) return 4; // late_minor
  if (diffDays >= -7) return 5; // late_major
  return 6; // late_worst
}