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

// Minimal shape both `prisma` and a `$transaction` callback's `tx` satisfy
// for the delegate methods used below. Keeping this loose on purpose so it
// works with either client without needing Prisma's generated tx type here.
type MissionClient = {
  user: { findMany: (args: any) => Promise<any[]> };
  score: { findMany: (args: any) => Promise<any[]> };
};

/**
 * Number of consecutive weeks (looking backward from `now`, capped at
 * `targetWeeks`) in which `nickname` reviewed at least one INTERN's work
 * and EVERY review that week was submitted before 19:00 Bangkok time.
 *
 * IMPORTANT: this is the one and only implementation. Do not fork it again.
 */
export async function getConsistencyProStreak(
  client: MissionClient,
  nickname: string,
  now: Date,
  targetWeeks: number,
  cycleStart: Date,
): Promise<number> {
  const interns = await client.user.findMany({ where: { role: "INTERN" }, select: { id: true } });
  const internIds = interns.map((i: any) => i.id);
  if (internIds.length === 0) return 0;

  const lookbackStart = clampStart(
    new Date(now.getTime() - (targetWeeks + 2) * 7 * 24 * 60 * 60 * 1000),
  );

  const reviews = await client.score.findMany({
    where: { reviewer: nickname, recipient_id: { in: internIds }, createdAt: { gte: lookbackStart, lte: now } },
    select: { createdAt: true },
  });

  const currentWeekStart = startOfWeek(now);
  const effectiveLowerBound = cycleStart > lookbackStart ? cycleStart : lookbackStart;

  let streak = 0;
  for (let i = 0; i < targetWeeks; i++) {
    const weekStart = new Date(currentWeekStart.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (weekEnd <= effectiveLowerBound) break;

    const reviewsThisWeek = reviews.filter((r: any) => r.createdAt >= weekStart && r.createdAt < weekEnd);
    const passedThisWeek =
      reviewsThisWeek.length > 0 && reviewsThisWeek.every((r: any) => bangkokHour(r.createdAt) < 19);
    if (!passedThisWeek) break;
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