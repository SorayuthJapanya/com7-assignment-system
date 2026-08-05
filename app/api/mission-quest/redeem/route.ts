import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  RESETTABLE_MISSION_IDS,
  VALID_MISSION_IDS,
  MISSION_TRACKING_START,
  clampStart,
  getConsistencyProStreak,
  THREE_DAYS_MS as THREE_DAYS_MS_LOCAL,
  LEVEL_UP_WINDOW_MS as LEVEL_UP_WINDOW_MS_LOCAL,
} from "@/lib/mission-shared";

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function lockKeyFor(userId: string, missionId: string): bigint {
  const hash = createHash("sha256").update(`${userId}:${missionId}`).digest();
  return hash.readBigInt64BE(0);
}

async function checkMissionCompleted(
  tx: PrismaTx,
  userId: string,
  nickname: string,
  missionId: string,
): Promise<{ completed: boolean; rewardPoints: number; recordMonth: number; recordYear: number }> {
  const now = new Date();
  const monthStart = clampStart(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const prevMonthStart = clampStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  // Default: the claim record belongs to the current month/year.
  // zero-reject is the one exception (see below) — it evaluates PREVIOUS
  // month's data, so its record must be keyed to the previous month/year to
  // match how the auto-claim route (GET) keys the same claim. Previously
  // these two routes disagreed, which could cause double-payouts or
  // incorrectly blocked claims.
  let recordMonth = currentMonth;
  let recordYear = currentYear;

  let cycleStart = monthStart;
  if (RESETTABLE_MISSION_IDS.has(missionId) && missionId !== "consistency-pro") {
    const lastClaim = await tx.missionClaim.findFirst({
      where: { userId, missionId, month: currentMonth, year: currentYear },
      orderBy: { claimedAt: "desc" },
    });
    if (lastClaim && lastClaim.claimedAt > monthStart && lastClaim.claimedAt <= monthEnd) {
      cycleStart = lastClaim.claimedAt;
    }
  }

  // consistency-pro is a cross-month streak, not a monthly quota — its lower
  // bound must NOT default to monthStart, or every un-claimed streak gets
  // silently truncated at the 1st of the calendar month. We look up the
  // most recent claim EVER (not scoped to current month/year) so a streak
  // that started last month is still respected. Mirrors streakCycleStartOf()
  // in mission-quest/route.ts (GET) — keep both in sync if this changes.
  let consistencyCycleStart = MISSION_TRACKING_START;
  if (missionId === "consistency-pro") {
    const lastConsistencyClaim = await tx.missionClaim.findFirst({
      where: { userId, missionId: "consistency-pro" },
      orderBy: { claimedAt: "desc" },
    });
    if (lastConsistencyClaim && lastConsistencyClaim.claimedAt > MISSION_TRACKING_START) {
      consistencyCycleStart = lastConsistencyClaim.claimedAt;
    }
  }

  const monthAssignments = await tx.assignment.findMany({
    where: { userId, deadline: { gte: monthStart, lte: monthEnd } },
  });
  const submitted = monthAssignments.filter((a) => a.status !== "Pending");
  const approved = monthAssignments.filter((a) => a.status === "Approved");
  const lateCount = submitted.filter((a) => a.submitAt > a.deadline).length;

  switch (missionId) {
    case "speed-runner": {
      const speedRunnerWindowStart = clampStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const effectiveStart = cycleStart > speedRunnerWindowStart ? cycleStart : speedRunnerWindowStart;
      const speedRunnerAssignments = await tx.assignment.findMany({
        where: { userId, status: "Approved", deadline: { gte: effectiveStart, lte: monthEnd } },
      });
      // FIX: also require updatedAt >= cycleStart so assignments approved
      // BEFORE the last reset-claim can't be re-counted toward a new cycle.
      const count = speedRunnerAssignments.filter(
        (a) => a.submitAt <= a.deadline && a.updatedAt >= cycleStart,
      ).length;
      return { completed: count >= 10, rewardPoints: 1500, recordMonth, recordYear };
    }

    case "perfect-month": {
      // FIX: added updatedAt >= cycleStart, matching the GET route.
      const approvedInCycle = approved.filter((a) => a.deadline >= cycleStart && a.updatedAt >= cycleStart);
      const submittedInCycle = submitted.filter((a) => a.deadline >= cycleStart);
      const lateInCycle = submittedInCycle.filter((a) => a.submitAt > a.deadline).length;
      const avgScorePct =
        approvedInCycle.length > 0
          ? approvedInCycle.reduce((s, a) => s + (a.reward ? (a.finalScore / a.reward) * 100 : 0), 0) / approvedInCycle.length
          : 0;
      return {
        completed: lateInCycle === 0 && approvedInCycle.length >= 5 && avgScorePct >= 80,
        rewardPoints: 1500,
        recordMonth,
        recordYear,
      };
    }

    case "first-responder": {
      // FIX: also require submitAt >= cycleStart (not just deadline), matching GET.
      // Otherwise a submission already counted in a prior cycle could be
      // recounted after a reset-claim as long as its deadline happened to
      // fall on/after the new cycleStart.
      const count = submitted.filter((a) => {
        if (a.deadline < cycleStart || a.submitAt < cycleStart) return false;
        const diffHours = (a.submitAt.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60);
        return diffHours >= 0 && diffHours <= 24;
      }).length;
      return { completed: count >= 3, rewardPoints: 500, recordMonth, recordYear };
    }

    case "quality-king": {
      // FIX: added updatedAt >= cycleStart.
      const count = approved.filter(
        (a) => a.deadline >= cycleStart && a.updatedAt >= cycleStart && a.reward > 0 && a.finalScore / a.reward >= 0.85,
      ).length;
      return { completed: count >= 8, rewardPoints: 1000, recordMonth, recordYear };
    }

    case "zero-reject": {
      const prevAssignments = await tx.assignment.findMany({
        where: { userId, deadline: { gte: prevMonthStart, lte: prevMonthEnd } },
      });
      const prevRejected = prevAssignments.filter((a) => a.status === "Rejected");
      const hasAssignments = prevAssignments.length > 0;
      const isCompleted = hasAssignments && prevRejected.length === 0;
      // FIX: this mission evaluates the PREVIOUS month, so its claim record
      // must be keyed to the previous month/year — same as the auto-claim
      // logic in the GET route. Previously this used the current month/year,
      // which meant a manual claim and an auto-claim for the same underlying
      // month result could each pass the "already claimed?" check and pay
      // out twice, or a manual claim in month N could block the legitimate
      // auto-claim for month N-1 by occupying an unrelated key.
      recordMonth = prevMonthStart.getMonth() + 1;
      recordYear = prevMonthStart.getFullYear();
      return { completed: isCompleted, rewardPoints: 500, recordMonth, recordYear };
    }

    case "workaholic": {
      // FIX: added updatedAt >= cycleStart.
      const count = approved.filter((a) => a.deadline >= cycleStart && a.updatedAt >= cycleStart).length;
      return { completed: count >= 15, rewardPoints: 2000, recordMonth, recordYear };
    }

    case "consistency-pro": {
      // FIX: use consistencyCycleStart (not the monthly cycleStart) so a
      // streak that started before this calendar month isn't silently
      // truncated at the 1st. See comment above where it's computed.
      const streak = await getConsistencyProStreak(tx as any, nickname, now, 8, consistencyCycleStart);
      return { completed: streak >= 8, rewardPoints: 1000, recordMonth, recordYear };
    }

    case "report-pro": {
      const reviewedCount = await tx.score.count({
        where: { reviewer: nickname, createdAt: { gte: cycleStart, lte: monthEnd } },
      });
      return { completed: reviewedCount > 20, rewardPoints: 300, recordMonth, recordYear };
    }

    // No Backlog: claimable once per calendar month only (NOT in
    // RESETTABLE_MISSION_IDS — see lib/mission-shared.ts comment). Requires
    // >= 2 submitted/approved assignments and no pending assignment older
    // than 3 days.
    case "no-backlog": {
      const activeOrSubmitted = monthAssignments.filter((a) => a.submitAt || a.status === "Approved");
      const hasBacklog = monthAssignments.some((a) => {
        const isUnsubmittedPending = !a.submitAt && a.status === "Pending";
        const isOlderThan3Days = now.getTime() - a.createdAt.getTime() > THREE_DAYS_MS_LOCAL;
        return isUnsubmittedPending && isOlderThan3Days;
      });

      return {
        completed: activeOrSubmitted.length >= 2 && !hasBacklog,
        rewardPoints: 1000,
        recordMonth,
        recordYear,
      };
    }

    case "level-up": {
      const levels = await tx.level.findMany({ orderBy: { minScore: "asc" } });
      const agg = await tx.score.aggregate({ where: { recipient_id: userId }, _sum: { score: true } });
      const totalScore = agg._sum.score ?? 0;
      const currentIdx = levels.findIndex((l) => totalScore >= l.minScore && totalScore <= l.maxScore);

      const win = await tx.missionWindow.findUnique({
        where: { userId_missionId: { userId, missionId: "level-up" } },
      });

      if (!win) return { completed: false, rewardPoints: 1000, recordMonth, recordYear };

      const expired = now.getTime() - win.windowStart.getTime() > LEVEL_UP_WINDOW_MS_LOCAL;
      const leveledUp = currentIdx > win.referenceLevelIdx;

      return { completed: !expired && leveledUp, rewardPoints: 1000, recordMonth, recordYear };
    }

    case "comeback-kid": {
      const prevAssignments = await tx.assignment.findMany({
        where: { userId, deadline: { gte: prevMonthStart, lte: prevMonthEnd } },
      });
      const prevSubmitted = prevAssignments.filter((a) => a.status !== "Pending");
      const prevLateCount = prevSubmitted.filter((a) => a.submitAt > a.deadline).length;
      return { completed: prevLateCount >= 3 && lateCount === 0, rewardPoints: 500, recordMonth, recordYear };
    }

    default:
      return { completed: false, rewardPoints: 0, recordMonth, recordYear };
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authUser = authResult.user!;
    if (authUser.role !== "STAFF") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();
    const { missionId } = body;
    if (!missionId) {
      return NextResponse.json({ error: "missionId is required." }, { status: 400 });
    }
    // FIX: validate missionId against the known list instead of silently
    // falling through to the default { completed: false } case, which made
    // typos indistinguishable from "not yet completed" in the API response.
    if (!VALID_MISSION_IDS.has(missionId)) {
      return NextResponse.json({ error: `Unknown missionId: ${missionId}` }, { status: 400 });
    }

    const now = new Date();
    const lockKey = lockKeyFor(authUser.id, missionId);

    const result = await prisma.$transaction(async (tx) => {
      // 🔒 Advisory lock
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

      const { completed, rewardPoints, recordMonth, recordYear } = await checkMissionCompleted(
        tx,
        authUser.id,
        authUser.nickname,
        missionId,
      );

      // Non-resettable missions (e.g. no-backlog, zero-reject, comeback-kid)
      // may only be claimed once per their record month/year. Checked AFTER
      // computing recordMonth/recordYear so zero-reject is checked against
      // the previous month, matching how it was evaluated.
      if (!RESETTABLE_MISSION_IDS.has(missionId)) {
        const alreadyClaimedThisMonth = await tx.missionClaim.findFirst({
          where: { userId: authUser.id, missionId, month: recordMonth, year: recordYear },
        });
        if (alreadyClaimedThisMonth) {
          return { ok: false as const };
        }
      }

      if (!completed) {
        return { ok: false as const };
      }

      const existing = await tx.missionClaim.findFirst({
        where: { userId: authUser.id, missionId, month: recordMonth, year: recordYear },
      });

      if (existing) {
        await tx.missionClaim.update({
          where: { id: existing.id },
          data: {
            points: existing.points + rewardPoints,
            claimedAt: now,
          },
        });
      } else {
        await tx.missionClaim.create({
          data: { userId: authUser.id, missionId, month: recordMonth, year: recordYear, points: rewardPoints },
        });
      }

      if (missionId === "level-up") {
        const levels = await tx.level.findMany({ orderBy: { minScore: "asc" } });
        const agg = await tx.score.aggregate({ where: { recipient_id: authUser.id }, _sum: { score: true } });
        const totalScore = (agg._sum.score ?? 0) + rewardPoints;
        const newIdx = levels.findIndex((l) => totalScore >= l.minScore && totalScore <= l.maxScore);

        await tx.missionWindow.upsert({
          where: { userId_missionId: { userId: authUser.id, missionId: "level-up" } },
          create: { userId: authUser.id, missionId: "level-up", windowStart: now, referenceLevelIdx: newIdx },
          update: { windowStart: now, referenceLevelIdx: newIdx },
        });
      }

      await tx.score.create({
        data: {
          recipient_id: authUser.id,
          reviewer: "System (Mission Quest)",
          assignment_title: `Mission Reward: ${missionId}`,
          score: rewardPoints,
        },
      });

      return { ok: true as const, rewardPoints };
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Mission ยังไม่สำเร็จตามเงื่อนไข หรือได้ทำการกดรับรางวัลไปแล้ว" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: "Claim สำเร็จ",
      rewardPoints: result.rewardPoints,
    });
  } catch (error) {
    console.error("Redeem mission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}