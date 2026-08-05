// lib/mission-shared.ts
//
// Single source of truth for mission constants + condition logic.
// Both the GET (mission-quest) route and the POST (redeem) route MUST import
// from here instead of re-declaring their own copies. The previous bugs
// (double-claiming, mismatched RESETTABLE_MISSION_IDS, stale-assignment
// re-counting) were all caused by the same logic existing in two places and
// drifting apart over time.

export const MISSION_TRACKING_START = new Date(2026, 7, 1); // 1 Aug 2026
export const LEVEL_UP_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
export const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// "no-backlog" is intentionally excluded: it must only ever be claimable
// once per calendar month (see redeem route comment history). Do NOT add it
// back without also updating resolveIsClaimed()/cycleStartOf() logic below,
// or the double-claim bug will resurface.
export const RESETTABLE_MISSION_IDS = new Set([
  "speed-runner",
  "workaholic",
  "quality-king",
  "first-responder",
  "perfect-month",
  "consistency-pro",
  "report-pro",
  "level-up",
]);

// All valid mission ids — used to validate the `missionId` sent by clients
// so a typo doesn't silently fall through to a generic "not completed" error.
export const VALID_MISSION_IDS = new Set([
  "speed-runner",
  "perfect-month",
  "first-responder",
  "quality-king",
  "zero-reject",
  "workaholic",
  "consistency-pro",
  "report-pro",
  "no-backlog",
  "level-up",
  "comeback-kid",
]);

export function isBangkokWeekday(date: Date): boolean {
  const bangkokMs = date.getTime() + 7 * 60 * 60 * 1000;
  const bangkok = new Date(bangkokMs);
  const day = bangkok.getUTCDay(); // 0 = Sun, 6 = Sat
  return day !== 0 && day !== 6;
}

export function clampStart(date: Date): Date {
  return date > MISSION_TRACKING_START ? date : MISSION_TRACKING_START;
}

export function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Returns the hour-of-day (0-23) for a given UTC instant, as observed in the
// Asia/Bangkok timezone (UTC+7, no DST). Using this instead of
// Date#getHours() avoids the bug where "before 7pm" was actually being
// evaluated in the server/container's local timezone (often UTC), which
// silently shifted the deadline by up to 7 hours depending on deploy target.
export function bangkokHour(date: Date): number {
  const bangkokMs = date.getTime() + 7 * 60 * 60 * 1000; // UTC+7
  const bangkok = new Date(bangkokMs);
  return bangkok.getUTCHours();
}

// Returns the Bangkok calendar date key (YYYY-MM-DD) for grouping reviews by day.
function bangkokDateKey(date: Date): string {
  const bangkokMs = date.getTime() + 7 * 60 * 60 * 1000;
  const bangkok = new Date(bangkokMs);
  const y = bangkok.getUTCFullYear();
  const m = String(bangkok.getUTCMonth() + 1).padStart(2, "0");
  const d = String(bangkok.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Minimal shape both `prisma` and a `$transaction` callback's `tx` satisfy
// for the delegate methods used below. Keeping this loose on purpose so it
// works with either client without needing Prisma's generated tx type here.
//
// FIX (consistency-pro): previously read from `score.findMany`, but no
// route anywhere in the app ever creates a Score record when a staff member
// reviews (approves/rejects) an intern's DailyReport — PATCH
// /api/daily-reports/[id] only updates DailyReport.status/feedback/reviewedBy.
// That meant `reviews` was always empty and the streak was permanently 0,
// exactly mirroring the report-pro bug fixed earlier. Switched to read from
// `dailyReport.findMany` instead, matching how report-pro now counts reviews,
// so both "review INTERN work" missions share the same underlying signal.
type MissionClient = {
  user: { findMany: (args: any) => Promise<any[]> };
  dailyReport: { findMany: (args: any) => Promise<any[]> };
};

/**
 * Number of consecutive weeks (looking backward from `now`, capped at
 * `targetWeeks`) in which `reviewerIdentifier` reviewed at least one
 * INTERN's daily report on EVERY weekday (Mon–Fri) of that week, and
 * EVERY review that week was submitted before 19:00 Bangkok time.
 *
 * - สัปดาห์ปัจจุบันที่ยังไม่จบ (ยังไม่ถึงศุกร์) จะไม่ถูกนับ
 * - ต้องมีรีวิวครบ 5 วันทำการ (จ–ศ) ในสัปดาห์นั้น
 * - ทุกครั้งที่รีวิวต้องเกิดก่อน 19:00 (Bangkok)
 *
 * `reviewerIdentifier` must match whatever DailyReport.reviewedBy actually
 * stores (currently `User.username` — see PATCH /api/daily-reports/[id]).
 * Callers should pass targetUsername, not targetNickname.
 *
 * IMPORTANT: this is the one and only implementation. Do not fork it again.
 */
export async function getConsistencyProStreak(
  client: MissionClient,
  reviewerIdentifier: string,
  now: Date,
  targetWeeks: number,
  cycleStart: Date,
): Promise<number> {
  const lookbackStart = clampStart(
    new Date(now.getTime() - (targetWeeks + 2) * 7 * 24 * 60 * 60 * 1000),
  );

  const reviews = await client.dailyReport.findMany({
    where: {
      reviewedBy: reviewerIdentifier,
      status: { in: ["Approved", "Rejected"] },
      user: { role: "INTERN" },
      updatedAt: { gte: lookbackStart, lte: now },
    },
    select: { updatedAt: true },
  });

  // กรองเสาร์-อาทิตย์ออกตั้งแต่ต้น เพื่อไม่ให้ทั้ง "มีรีวิวไหม" และ "ก่อน 19:00 ไหม" นับรวมวันหยุด
  const weekdayReviews = reviews.filter((r: any) => isBangkokWeekday(r.updatedAt));

  const currentWeekStart = startOfWeek(now);

  // FIX: อย่าให้ cycleStart (ที่มาจาก monthStart เมื่อยังไม่เคย claim) มาตัด streak
  // ข้ามเดือนโดยไม่ตั้งใจ — ให้ effectiveLowerBound เพดานต่ำสุดคือ lookbackStart เท่านั้น
  // เว้นแต่ cycleStart มาจากการ claim จริง (ซึ่งจะ "ตั้งใจ" เริ่มรอบใหม่)
  const effectiveLowerBound = cycleStart > lookbackStart ? cycleStart : lookbackStart;

  let streak = 0;
  for (let i = 0; i < targetWeeks; i++) {
    const weekStart = new Date(currentWeekStart.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    // ข้ามสัปดาห์ปัจจุบันที่ยังไม่จบ (ยังไม่ถึงศุกร์)
    // weekEnd = จันทร์ถัดไป 00:00 → ถ้า now < weekEnd แปลว่าสัปดาห์นี้ยังไม่จบ
    if (i === 0 && now < weekEnd) {
      continue;
    }

    if (weekEnd <= effectiveLowerBound) break;

    const reviewsThisWeek = weekdayReviews.filter(
      (r: any) => r.updatedAt >= weekStart && r.updatedAt < weekEnd,
    );

    // ต้องมีรีวิวอย่างน้อย 1 ครั้ง และทุกครั้งต้องก่อน 19:00
    if (reviewsThisWeek.length === 0) break;
    if (!reviewsThisWeek.every((r: any) => bangkokHour(r.updatedAt) < 19)) break;

    // ต้องมีรีวิวครบ 5 วันทำการ (จ–ศ) ในสัปดาห์นั้น
    // ใช้ Bangkok date key เพื่อไม่ให้ timezone เพี้ยน
    const distinctDays = new Set(
      reviewsThisWeek.map((r: any) => bangkokDateKey(r.updatedAt)),
    );
    if (distinctDays.size < 5) break;

    streak++;
  }
  return streak;
}

/**
 * Given an assignment list already filtered to the relevant deadline window,
 * further restrict to only those whose *approval/update* actually happened
 * within the current cycle. This is the filter that the redeem (POST) route
 * was previously missing, which allowed assignments approved BEFORE a
 * mission was reset (via Claim) to still count toward the new cycle,
 * letting the same batch of work be claimed repeatedly.
 */
export function inCycle<T extends { updatedAt: Date }>(items: T[], cycleStart: Date): T[] {
  return items.filter((a) => a.updatedAt >= cycleStart);
}