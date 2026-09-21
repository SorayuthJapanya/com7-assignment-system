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

/**
 * หา index ของ level จากคะแนนรวม — ใช้ fallback เดียวกับ GET route
 * (คะแนนไม่อยู่ในช่วงใดเลย => ถือว่าเป็น level สูงสุด)
 * แนะนำให้ย้ายไป lib/mission-shared.ts แล้วให้ GET import ไปใช้ร่วมกัน
 */
function resolveLevelIdx(
  levels: { minScore: number; maxScore: number }[],
  totalScore: number,
): number {
  if (levels.length === 0) return 0;
  const idx = levels.findIndex((l) => totalScore >= l.minScore && totalScore <= l.maxScore);
  return idx < 0 ? levels.length - 1 : idx;
}

async function checkMissionCompleted(
  tx: PrismaTx,
  userId: string,
  nickname: string,
  username: string,
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
  // zero-reject is the exception — it evaluates PREVIOUS month's data, so its
  // record must be keyed to the previous month/year.
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

  // consistency-pro is a cross-month streak — look up the most recent claim
  // EVER (not scoped to month/year). Mirrors streakCycleStartOf() in the GET route.
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

  // Lazy fetch + memoize: query monthAssignments only when a case needs it.
  let _monthAssignments: Awaited<ReturnType<typeof tx.assignment.findMany>> | null = null;
  const getMonthAssignments = async () => {
    if (_monthAssignments === null) {
      _monthAssignments = await tx.assignment.findMany({
        where: { userId, deadline: { gte: monthStart, lte: monthEnd } },
      });
    }
    return _monthAssignments;
  };
  const getSubmitted = async () => (await getMonthAssignments()).filter((a) => a.status !== "Pending");
  const getApproved = async () => (await getMonthAssignments()).filter((a) => a.status === "Approved");
  // null-safe: same as GET (submitAt may be null)
  const getLateCount = async () =>
    (await getSubmitted()).filter((a) => a.submitAt && a.submitAt > a.deadline).length;

  switch (missionId) {
    case "speed-runner": {
      const speedRunnerWindowStart = clampStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const effectiveStart = cycleStart > speedRunnerWindowStart ? cycleStart : speedRunnerWindowStart;
      const speedRunnerAssignments = await tx.assignment.findMany({
        where: { userId, status: "Approved", deadline: { gte: effectiveStart, lte: monthEnd } },
      });
      // updatedAt >= cycleStart so assignments approved BEFORE the last
      // reset-claim can't be re-counted toward a new cycle.
      const count = speedRunnerAssignments.filter(
        (a) => a.submitAt && a.submitAt <= a.deadline && a.updatedAt >= cycleStart,
      ).length;
      return { completed: count >= 10, rewardPoints: 1500, recordMonth, recordYear };
    }

    case "perfect-month": {
      const approved = await getApproved();
      const submitted = await getSubmitted();
      const approvedInCycle = approved.filter((a) => a.deadline >= cycleStart && a.updatedAt >= cycleStart);
      const submittedInCycle = submitted.filter((a) => a.deadline >= cycleStart);
      const lateInCycle = submittedInCycle.filter((a) => a.submitAt && a.submitAt > a.deadline).length;
      const avgScorePct =
        approvedInCycle.length > 0
          ? approvedInCycle.reduce((s, a) => s + (a.reward ? (a.finalScore / a.reward) * 100 : 0), 0) /
            approvedInCycle.length
          : 0;
      return {
        completed: lateInCycle === 0 && approvedInCycle.length >= 5 && avgScorePct >= 80,
        rewardPoints: 1500,
        recordMonth,
        recordYear,
      };
    }

    case "first-responder": {
      const submitted = await getSubmitted();
      const count = submitted.filter((a) => {
        if (!a.submitAt) return false;
        if (a.deadline < cycleStart || a.submitAt < cycleStart) return false;
        const diffHours = (a.submitAt.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60);
        return diffHours >= 0 && diffHours <= 24;
      }).length;
      return { completed: count >= 3, rewardPoints: 500, recordMonth, recordYear };
    }

    case "quality-king": {
      const approved = await getApproved();
      const count = approved.filter(
        (a) =>
          a.deadline >= cycleStart &&
          a.updatedAt >= cycleStart &&
          a.reward > 0 &&
          a.finalScore / a.reward >= 0.85,
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
      // Evaluates the PREVIOUS month => key the claim to the previous month/year.
      recordMonth = prevMonthStart.getMonth() + 1;
      recordYear = prevMonthStart.getFullYear();
      return { completed: isCompleted, rewardPoints: 500, recordMonth, recordYear };
    }

    case "workaholic": {
      const approved = await getApproved();
      const count = approved.filter((a) => a.deadline >= cycleStart && a.updatedAt >= cycleStart).length;
      return { completed: count >= 15, rewardPoints: 2000, recordMonth, recordYear };
    }

    case "consistency-pro": {
      // FIX: GET passes `username` — redeem must too (was `nickname`).
      const streak = await getConsistencyProStreak(tx as any, username, now, 8, consistencyCycleStart);
      return { completed: streak >= 8, rewardPoints: 1000, recordMonth, recordYear };
    }

    case "report-pro": {
      // FIX: count from the SAME table/filters as the GET route
      // (dailyReport + reviewedBy: username + Approved/Rejected + INTERN),
      // previously counted `score` rows by nickname => mismatch with the UI.
      const reviewedCount = await tx.dailyReport.count({
        where: {
          reviewedBy: username,
          status: { in: ["Approved", "Rejected"] },
          updatedAt: { gte: cycleStart, lte: monthEnd },
          user: { role: "INTERN" },
        },
      });
      return { completed: reviewedCount > 20, rewardPoints: 300, recordMonth, recordYear };
    }

    // No Backlog: claimable once per calendar month only (NOT resettable).
    case "no-backlog": {
      const monthAssignments = (await getMonthAssignments()).filter((a) => a.createdAt >= monthStart);
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
      // FIX: same total + fallback as GET (Math.max(0,…) and resolveLevelIdx)
      const totalScore = Math.max(0, agg._sum.score ?? 0);
      const currentIdx = resolveLevelIdx(levels, totalScore);

      const win = await tx.missionWindow.findUnique({
        where: { userId_missionId: { userId, missionId: "level-up" } },
      });

      if (!win) return { completed: false, rewardPoints: 1000, recordMonth, recordYear };

      // FIX: GET treats "leveled up" as completed even if the window is past
      // 14 days (it only resets the window when expired AND not leveled up).
      // Redeem previously also required !expired, so the UI showed "done" but
      // Claim was rejected. Now both sides use the same rule.
      void LEVEL_UP_WINDOW_MS_LOCAL;
      const leveledUp = currentIdx > win.referenceLevelIdx;

      return { completed: leveledUp, rewardPoints: 1000, recordMonth, recordYear };
    }

    case "comeback-kid": {
      const lateCount = await getLateCount();
      const prevAssignments = await tx.assignment.findMany({
        where: { userId, deadline: { gte: prevMonthStart, lte: prevMonthEnd } },
      });
      const prevSubmitted = prevAssignments.filter((a) => a.status !== "Pending");
      const prevLateCount = prevSubmitted.filter((a) => a.submitAt && a.submitAt > a.deadline).length;
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
        authUser.username, // FIX: pass username (used by report-pro & consistency-pro)
        missionId,
      );

      // Non-resettable missions may only be claimed once per record month/year.
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

      // MissionClaim stays ONE row per (user, mission, month, year) — it is
      // only used to track the latest claimedAt (cycle start) and to block
      // duplicate claims. No schema migration needed. The per-claim history
      // shown to users is read from the Score table instead (one row is
      // created there on every claim, see below + claim-history route).
      const existing = await tx.missionClaim.findFirst({
        where: { userId: authUser.id, missionId, month: recordMonth, year: recordYear },
      });

      if (existing) {
        await tx.missionClaim.update({
          where: { id: existing.id },
          data: { points: existing.points + rewardPoints, claimedAt: now },
        });
      } else {
        await tx.missionClaim.create({
          data: { userId: authUser.id, missionId, month: recordMonth, year: recordYear, points: rewardPoints },
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

      // FIX: reset the level-up window AFTER the reward score is created so the
      // baseline level reflects the real total score (what GET will compute).
      if (missionId === "level-up") {
        const levels = await tx.level.findMany({ orderBy: { minScore: "asc" } });
        const agg = await tx.score.aggregate({ where: { recipient_id: authUser.id }, _sum: { score: true } });
        const newIdx = resolveLevelIdx(levels, Math.max(0, agg._sum.score ?? 0));

        await tx.missionWindow.upsert({
          where: { userId_missionId: { userId: authUser.id, missionId: "level-up" } },
          create: { userId: authUser.id, missionId: "level-up", windowStart: now, referenceLevelIdx: newIdx },
          update: { windowStart: now, referenceLevelIdx: newIdx },
        });
      }

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