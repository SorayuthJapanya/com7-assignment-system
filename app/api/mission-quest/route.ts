import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getBonusCycleStart, getPrevRankSnapshot, maybeRefreshRankSnapshot } from "@/lib/bonus-cycle";
import type {
  MissionQuestResponse,
  Mission,
  BonusBucketMeta,
  BonusBucketEntry,
} from "@/types/mission-quest";
import {
  MISSION_TRACKING_START,
  LEVEL_UP_WINDOW_MS,
  THREE_DAYS_MS,
  RESETTABLE_MISSION_IDS,
  clampStart,
  getConsistencyProStreak,
} from "@/lib/mission-shared";

const BONUS_BUCKETS: BonusBucketMeta[] = [
  { key: "super_early", emoji: "🏅", situation: "ส่งเร็วมาก", condition: "ก่อน deadline ≥ 7 วัน", modifierLabel: "+30%", modifierType: "positive", exampleReward: 130 },
  { key: "early", emoji: "🥈", situation: "ส่งเร็ว", condition: "ก่อน deadline ≥ 3 วัน", modifierLabel: "+20%", modifierType: "positive", exampleReward: 120 },
  { key: "before", emoji: "🥉", situation: "ส่งก่อน", condition: "ก่อน deadline ≥ 1 วัน", modifierLabel: "+10%", modifierType: "positive", exampleReward: 110 },
  { key: "ontime", emoji: "⏱️", situation: "ตรงเวลา", condition: "ภายใน 24 ชม. ก่อน deadline", modifierLabel: "+0%", modifierType: "neutral", exampleReward: 100 },
  { key: "late_minor", emoji: "⚠️", situation: "สายเล็กน้อย", condition: "สาย 1–3 วัน", modifierLabel: "-10%", modifierType: "negative", exampleReward: 90 },
  { key: "late_major", emoji: "🚨", situation: "สายมาก", condition: "สาย 3–7 วัน", modifierLabel: "-25%", modifierType: "negative", exampleReward: 75 },
  { key: "late_worst", emoji: "❌", situation: "สายมากที่สุด", condition: "สาย 7+ วัน", modifierLabel: "-50%", modifierType: "negative", exampleReward: 50 },
];

const BONUS_PCT = [0.3, 0.2, 0.1, 0, -0.1, -0.25, -0.5];

// NOTE: MISSION_TRACKING_START, LEVEL_UP_WINDOW_MS, THREE_DAYS_MS,
// RESETTABLE_MISSION_IDS and clampStart() now come from lib/mission-shared.ts.
// Do NOT re-declare local copies here — that drift (specifically
// RESETTABLE_MISSION_IDS disagreeing with the redeem route about
// "no-backlog") was the root cause of the double-claim / can't-claim bugs.
const AUTO_CLAIM_DEPLOY_START = MISSION_TRACKING_START;

function pct(current: number, target: number) {
  return target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
}

function getBonusBucketIndex(deadline: Date, submitAt: Date): number {
  const diffMs = deadline.getTime() - submitAt.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffDays >= 7) return 0;
  if (diffDays >= 3) return 1;
  if (diffDays >= 1) return 2;
  if (diffHours >= 0) return 3;
  if (diffDays >= -3) return 4;
  if (diffDays >= -7) return 5;
  return 6;
}

async function getBonusLeaderboard(cycleStart: Date, now: Date): Promise<any[]> {
  const approvedAssignments = await prisma.assignment.findMany({
    where: {
      status: "Approved",
      deadline: { gte: cycleStart, lte: now },
      user: { role: "STAFF" },
    },
    include: { user: { select: { id: true, nickname: true, username: true } } },
  });

  const bucketWinners: (BonusBucketEntry & { userId: string; name: string; username: string })[] = [];

  BONUS_BUCKETS.forEach((_, idx) => {
    const matched = approvedAssignments.filter(
      (a) => getBonusBucketIndex(a.deadline, a.submitAt) === idx
    );

    if (matched.length > 0) {
      matched.sort((a, b) => {
        const earlyMsA = a.deadline.getTime() - a.submitAt.getTime();
        const earlyMsB = b.deadline.getTime() - b.submitAt.getTime();

        if (idx < 4) {
          return earlyMsB - earlyMsA;
        } else {
          return earlyMsA - earlyMsB;
        }
      });

      const best = matched[0];
      bucketWinners[idx] = {
        id: best.id,
        assignmentId: best.id,
        title: best.title,
        deadline: best.deadline,
        submitAt: best.submitAt,
        userId: best.userId,
        name: best.user.nickname,
        username: best.user.username,
        reward: best.reward,
      } as any;
    }
  });

  const winnerUserIds = Array.from(new Set(bucketWinners.filter(Boolean).map((w) => w!.userId)));

  const userAssignmentTotalWithBonus = new Map<string, number>();
  approvedAssignments.forEach((a) => {
    const idx = getBonusBucketIndex(a.deadline, a.submitAt);
    const totalScoreForAssignment = Math.round((a.reward ?? 0) * (1 + BONUS_PCT[idx]));
    userAssignmentTotalWithBonus.set(
      a.userId,
      (userAssignmentTotalWithBonus.get(a.userId) ?? 0) + totalScoreForAssignment
    );
  });

  const userClaimBonusTotals = new Map<string, number>();
  if (winnerUserIds.length > 0) {
    const missionClaimSums = await prisma.missionClaim.groupBy({
      by: ["userId"],
      where: {
        userId: { in: winnerUserIds },
        claimedAt: { gte: cycleStart, lte: now },
      },
      _sum: { points: true },
    });
    missionClaimSums.forEach((g) => {
      userClaimBonusTotals.set(g.userId, g._sum.points ?? 0);
    });
  }

  const cycleScoreTotals = new Map<string, number>();
  if (winnerUserIds.length > 0) {
    const scoreGroups = await prisma.score.groupBy({
      by: ["recipient_id"],
      where: {
        recipient_id: { in: winnerUserIds },
        createdAt: { gte: cycleStart, lte: now },
      },
      _sum: { score: true },
    });
    scoreGroups.forEach((g) => {
      cycleScoreTotals.set(g.recipient_id, g._sum.score ?? 0);
    });
  }

  const userMap = new Map<
    string,
    {
      userId: string;
      name: string;
      username: string;
      buckets: number[];
      bucketEntries: BonusBucketEntry[][];
      missionsDone: number;
      bonusEarned: number;
      totalPoints: number;
    }
  >();

  for (let idx = 0; idx < bucketWinners.length; idx++) {
    const winner = bucketWinners[idx];
    if (!winner) continue;

    if (!userMap.has(winner.userId)) {
      const claimedMissions = await prisma.missionClaim.findMany({
        where: { userId: winner.userId, claimedAt: { gte: cycleStart, lte: now } },
      });

      const missionBonus = userClaimBonusTotals.get(winner.userId) ?? 0;
      const assignmentScoreWithBonus = userAssignmentTotalWithBonus.get(winner.userId) ?? 0;
      const totalBonusEarned = missionBonus + assignmentScoreWithBonus;

      userMap.set(winner.userId, {
        userId: winner.userId,
        name: winner.name,
        username: winner.username,
        buckets: new Array(BONUS_BUCKETS.length).fill(0),
        bucketEntries: Array.from({ length: BONUS_BUCKETS.length }, () => []),
        missionsDone: claimedMissions.length,
        bonusEarned: totalBonusEarned,
        totalPoints: cycleScoreTotals.get(winner.userId) ?? 0,
      });
    }

    const userData = userMap.get(winner.userId)!;
    userData.buckets[idx] = 1;
    userData.bucketEntries[idx] = [winner];
  }

  const currentLeaderboard = Array.from(userMap.values())
    .map((u) => ({
      userId: u.userId,
      name: u.name,
      username: u.username,
      buckets: u.buckets,
      bucketEntries: u.bucketEntries,
      missionsDone: u.missionsDone,
      bonusEarned: u.bonusEarned,
      totalPoints: u.totalPoints,
      total: u.buckets.reduce((sum, c) => sum + c, 0),
    }))
    .sort((a, b) => {
      for (let i = 0; i < BONUS_BUCKETS.length; i++) {
        if ((b.buckets[i] ?? 0) !== (a.buckets[i] ?? 0)) {
          return (b.buckets[i] ?? 0) - (a.buckets[i] ?? 0);
        }
      }
      if (b.bonusEarned !== a.bonusEarned) {
        return b.bonusEarned - a.bonusEarned;
      }
      return b.missionsDone - a.missionsDone;
    });

  const prevSnapshot = await getPrevRankSnapshot();
  const prevRankMap = new Map<string, number>(
    prevSnapshot ? Object.entries(prevSnapshot.ranks) : []
  );

  const rankedLeaderboard = currentLeaderboard.map((u, idx) => {
    const currentRank = idx + 1;
    const prevRank = prevRankMap.get(u.userId);

    let rankTrend: { type: "up" | "down" | "same" | "new"; diff: number } = {
      type: "same",
      diff: 0,
    };

    if (prevRank === undefined) {
      rankTrend = { type: "new", diff: 0 };
    } else if (prevRank > currentRank) {
      rankTrend = { type: "up", diff: prevRank - currentRank };
    } else if (prevRank < currentRank) {
      rankTrend = { type: "down", diff: currentRank - prevRank };
    }

    return {
      rank: currentRank,
      rankTrend,
      ...u,
    };
  });

  const currentRanksForSnapshot: Record<string, number> = {};
  rankedLeaderboard.forEach((u) => {
    currentRanksForSnapshot[u.userId] = u.rank;
  });
  await maybeRefreshRankSnapshot(currentRanksForSnapshot, prevSnapshot);

  return rankedLeaderboard;
}

async function getLevelUpWindowState(userId: string, now: Date) {
  const levels = await prisma.level.findMany({ orderBy: { minScore: "asc" } });
  const agg = await prisma.score.aggregate({ where: { recipient_id: userId }, _sum: { score: true } });
  const totalScore = agg._sum.score ?? 0;
  const currentIdx = levels.findIndex((l) => totalScore >= l.minScore && totalScore <= l.maxScore);

  let win = await prisma.missionWindow.findUnique({
    where: { userId_missionId: { userId, missionId: "level-up" } },
  });

  if (!win) {
    try {
      win = await prisma.missionWindow.create({
        data: { userId, missionId: "level-up", windowStart: now, referenceLevelIdx: currentIdx },
      });
    } catch {
      win = await prisma.missionWindow.findUnique({
        where: { userId_missionId: { userId, missionId: "level-up" } },
      });
    }
  }

  if (!win) {
    return { completed: false, currentIdx, windowStart: now, levels };
  }

  const expired = now.getTime() - win.windowStart.getTime() > LEVEL_UP_WINDOW_MS;
  const leveledUp = currentIdx > win.referenceLevelIdx;

  if (expired && !leveledUp) {
    win = await prisma.missionWindow.update({
      where: { id: win.id },
      data: { windowStart: now, referenceLevelIdx: currentIdx },
    });
    return { completed: false, currentIdx, windowStart: win.windowStart, levels };
  }

  return { completed: leveledUp, currentIdx, windowStart: win.windowStart, levels };
}

async function autoClaimUnclaimedPreviousMonth(
  userId: string,
  nickname: string,
  prevMonthStart: Date,
  prevMonthEnd: Date,
  prevMonthNum: number,
  prevYearNum: number,
) {
  if (prevMonthEnd < MISSION_TRACKING_START) return;
  if (prevMonthStart < AUTO_CLAIM_DEPLOY_START) return;

  const prevAssignments = await prisma.assignment.findMany({
    where: { userId, deadline: { gte: prevMonthStart, lte: prevMonthEnd } },
  });
  const prevSubmitted = prevAssignments.filter((a) => a.status !== "Pending");
  const prevApproved = prevAssignments.filter((a) => a.status === "Approved");
  const prevRejected = prevAssignments.filter((a) => a.status === "Rejected");
  const prevLateCount = prevSubmitted.filter((a) => a.submitAt > a.deadline).length;

  const prevAvgScorePct =
    prevApproved.length > 0
      ? prevApproved.reduce((sum, a) => sum + (a.reward ? (a.finalScore / a.reward) * 100 : 0), 0) /
        prevApproved.length
      : 0;

  const prevFirstResponderCount = prevSubmitted.filter((a) => {
    const diffHours = (a.submitAt.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 24;
  }).length;

  const prevQualityKingCurrent = prevApproved.filter(
    (a) => a.reward > 0 && a.finalScore / a.reward >= 0.85,
  ).length;

  const prevHasBacklog = prevAssignments.some((a) => {
    const isUnsubmittedPending = !a.submitAt && a.status === "Pending";
    const isOlderThan3Days = (prevMonthEnd.getTime() - a.createdAt.getTime()) > THREE_DAYS_MS;
    return isUnsubmittedPending && isOlderThan3Days;
  });

  const prevReviewedCount = await prisma.score.count({
    where: { reviewer: nickname, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
  });

  const prevConsistencyStreak = await getConsistencyProStreak(
    prisma as any,
    nickname,
    prevMonthEnd,
    8,
    prevMonthStart,
  );

  // FIX: "comeback-kid" evaluates prevMonth-vs-thisMonth late counts, so by
  // definition it can only ever be judged accurately from the *current*
  // month's data (i.e. from the GET request's normal per-request
  // computation, not from an auto-claim of the previous month in isolation).
  // Leaving it out of finalStates here is intentional — it is NOT a bug to
  // omit it from THIS auto-claim pass. However, the real bug was that there
  // was previously no other safety net for it at all: if a user qualified
  // (>=3 late last month, 0 late this month) but forgot to click Claim
  // before the month rolled over, the condition could no longer be true
  // (this month's data becomes "last month's" and a new comparison starts)
  // and the reward was lost permanently with no way to recover it.
  //
  // We fix that by capturing "comeback-kid" eligibility using the just-
  // completed prevMonth vs. the month before it, and auto-claiming it here
  // using the month-N-1-vs-month-N-2 comparison, mirroring how
  // zero-reject/etc. settle a month in arrears.
  const prevPrevMonthStart = clampStart(new Date(prevMonthStart.getFullYear(), prevMonthStart.getMonth() - 1, 1));
  const prevPrevMonthEnd = new Date(prevMonthStart.getFullYear(), prevMonthStart.getMonth(), 0, 23, 59, 59);
  const prevPrevAssignments = await prisma.assignment.findMany({
    where: { userId, deadline: { gte: prevPrevMonthStart, lte: prevPrevMonthEnd } },
  });
  const prevPrevSubmitted = prevPrevAssignments.filter((a) => a.status !== "Pending");
  const prevPrevLateCount = prevPrevSubmitted.filter((a) => a.submitAt > a.deadline).length;
  const comebackKidCompleted = prevPrevLateCount >= 3 && prevLateCount === 0;

  const finalStates: { id: string; isCompleted: boolean; rewardPoints: number; name: string }[] = [
    { id: "speed-runner", isCompleted: prevApproved.filter((a) => a.submitAt <= a.deadline).length >= 10, rewardPoints: 1500, name: "Speed Runner" },
    { id: "perfect-month", isCompleted: prevLateCount === 0 && prevApproved.length >= 5 && prevAvgScorePct >= 80, rewardPoints: 1500, name: "Perfect Month" },
    { id: "first-responder", isCompleted: prevFirstResponderCount >= 3, rewardPoints: 500, name: "First Responder" },
    { id: "quality-king", isCompleted: prevQualityKingCurrent >= 8, rewardPoints: 1000, name: "Quality King" },
    { id: "zero-reject", isCompleted: prevAssignments.length > 0 && prevRejected.length === 0, rewardPoints: 500, name: "Zero Reject" },
    { id: "workaholic", isCompleted: prevApproved.length >= 15, rewardPoints: 2000, name: "Workaholic" },
    { id: "report-pro", isCompleted: prevReviewedCount > 20, rewardPoints: 300, name: "20+ Reviews" },
    { id: "no-backlog", isCompleted: prevApproved.length >= 2 && !prevHasBacklog, rewardPoints: 1000, name: "No Backlog" },
    { id: "consistency-pro", isCompleted: prevConsistencyStreak >= 8, rewardPoints: 1000, name: "8-Week Streak" },
    // FIX: previously missing from the auto-claim safety net entirely.
    { id: "comeback-kid", isCompleted: comebackKidCompleted, rewardPoints: 500, name: "Comeback Kid" },
  ];

  const existingClaims = await prisma.missionClaim.findMany({
    where: { userId, month: prevMonthNum, year: prevYearNum },
    select: { missionId: true },
  });
  const alreadyClaimedIds = new Set(existingClaims.map((c) => c.missionId));

  for (const m of finalStates) {
    if (!m.isCompleted) continue;
    if (alreadyClaimedIds.has(m.id)) continue;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.missionClaim.create({
          data: {
            userId,
            missionId: m.id,
            month: prevMonthNum,
            year: prevYearNum,
            points: m.rewardPoints,
          },
        });

        await tx.score.create({
          data: {
            recipient_id: userId,
            reviewer: "System (Mission Quest)",
            assignment_title: `Mission Reward (Auto-claim): ${m.id}`,
            score: m.rewardPoints,
          },
        });
      });
    } catch (err) {
      console.error(`Auto-claim failed for mission ${m.id}, userId ${userId}:`, err);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authUser = authResult.user!;
    const isStaff = authUser.role === "STAFF";
    const isSuperAdmin = authUser.role === "SUPER_ADMIN";
    if (!isStaff && !isSuperAdmin) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const now = new Date();
    const monthStart = clampStart(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const prevMonthStart = clampStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const daysLeft = Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    await autoClaimUnclaimedPreviousMonth(
      authUser.id,
      authUser.nickname,
      prevMonthStart,
      prevMonthEnd,
      prevMonthStart.getMonth() + 1,
      prevMonthStart.getFullYear(),
    );

    const currentMonthNum = now.getMonth() + 1;
    const currentYearNum = now.getFullYear();

    const monthClaims = await prisma.missionClaim.findMany({
      where: { userId: authUser.id, month: currentMonthNum, year: currentYearNum },
      orderBy: { claimedAt: "asc" },
    });

    const claimedIds = new Set(monthClaims.map((c) => c.missionId));

    const lastClaimedAtMap = new Map<string, Date>();
    monthClaims.forEach((c) => {
      lastClaimedAtMap.set(c.missionId, c.claimedAt);
    });

    function cycleStartOf(missionId: string): Date {
      if (!RESETTABLE_MISSION_IDS.has(missionId)) return monthStart;
      const claimedAt = lastClaimedAtMap.get(missionId);
      if (claimedAt && claimedAt > monthStart && claimedAt <= monthEnd) return claimedAt;
      return monthStart;
    }

    const monthAssignments = await prisma.assignment.findMany({
      where: { userId: authUser.id, deadline: { gte: monthStart, lte: monthEnd } },
    });

    const submitted = monthAssignments.filter((a) => a.status !== "Pending");
    const approved = monthAssignments.filter((a) => a.status === "Approved");

    // ── Speed Runner ──
    const speedRunnerWindowStart = clampStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const speedRunnerCycleStart = cycleStartOf("speed-runner");
    const speedRunnerEffectiveStart =
      speedRunnerCycleStart > speedRunnerWindowStart ? speedRunnerCycleStart : speedRunnerWindowStart;
    const speedRunnerAssignments = await prisma.assignment.findMany({
      where: {
        userId: authUser.id,
        status: "Approved",
        deadline: { gte: speedRunnerEffectiveStart, lte: monthEnd },
      },
    });
    const speedRunnerCurrent = speedRunnerAssignments.filter((a) => a.submitAt <= a.deadline && a.updatedAt >= speedRunnerCycleStart).length;
    const speedRunnerTarget = 10;

    // ── Perfect Month ──
    const perfectMonthCycleStart = cycleStartOf("perfect-month");
    const approvedForPerfect = approved.filter((a) => a.deadline >= perfectMonthCycleStart && a.updatedAt >= perfectMonthCycleStart);
    const submittedForPerfect = submitted.filter((a) => a.deadline >= perfectMonthCycleStart);
    const lateCountForPerfect = submittedForPerfect.filter((a) => a.submitAt > a.deadline).length;
    const avgScorePctForPerfect =
      approvedForPerfect.length > 0
        ? approvedForPerfect.reduce((sum, a) => sum + (a.reward ? (a.finalScore / a.reward) * 100 : 0), 0) /
          approvedForPerfect.length
        : 0;
    const perfectMonth = lateCountForPerfect === 0 && approvedForPerfect.length >= 5 && avgScorePctForPerfect >= 80;

    // ── First Responder ──
    const firstResponderCycleStart = cycleStartOf("first-responder");
    const firstResponderCount = submitted.filter((a) => {
      if (a.deadline < firstResponderCycleStart || a.submitAt < firstResponderCycleStart) return false;
      const diffHours = (a.submitAt.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours <= 24;
    }).length;
    const firstResponderTarget = 3;

    // ── Quality King ──
    const qualityKingCycleStart = cycleStartOf("quality-king");
    const qualityKingCurrent = approved.filter(
      (a) => a.deadline >= qualityKingCycleStart && a.updatedAt >= qualityKingCycleStart && a.reward > 0 && a.finalScore / a.reward >= 0.85,
    ).length;
    const qualityKingTarget = 8;

    // ── Zero Reject (สรุปผลเดือนที่แล้ว จ่ายวันที่ 1) ──
    const prevAssignmentsForZeroReject = await prisma.assignment.findMany({
      where: { userId: authUser.id, deadline: { gte: prevMonthStart, lte: prevMonthEnd } },
    });
    const prevRejectedForZeroReject = prevAssignmentsForZeroReject.filter((a) => a.status === "Rejected");
    const hasAssignmentsPrevMonth = prevAssignmentsForZeroReject.length > 0;
    const zeroRejectCompleted = hasAssignmentsPrevMonth && prevRejectedForZeroReject.length === 0;

    // FIX: this now matches the record key written by BOTH the auto-claim
    // path above (month = prevMonthNum/prevYearNum) AND the manual redeem
    // route (which now also keys zero-reject to the previous month/year).
    const isZeroRejectClaimed = await prisma.missionClaim.findFirst({
      where: {
        userId: authUser.id,
        missionId: "zero-reject",
        month: prevMonthStart.getMonth() + 1,
        year: prevMonthStart.getFullYear(),
      },
    });

    // ── Workaholic ──
    const workaholicCycleStart = cycleStartOf("workaholic");
    const workaholicCurrent = approved.filter((a) => a.deadline >= workaholicCycleStart && a.updatedAt >= workaholicCycleStart).length;
    const workaholicTarget = 15;

    // ── Consistency Pro ──
    const consistencyTarget = 8;
    const consistencyProCycleStart = cycleStartOf("consistency-pro");
    const consistencyProCurrent = await getConsistencyProStreak(
      prisma as any,
      authUser.nickname,
      now,
      consistencyTarget,
      consistencyProCycleStart,
    );

    // ── Report Pro ──
    const reportProCycleStart = cycleStartOf("report-pro");
    const reviewedCount = await prisma.score.count({
      where: { reviewer: authUser.nickname, createdAt: { gte: reportProCycleStart, lte: monthEnd } },
    });
    const reportProTarget = 20;

    // ── No Backlog (claimable once per calendar month; not resettable) ──
    const noBacklogCycleStart = monthStart;
    const assignmentsInNoBacklogCycle = monthAssignments.filter((a) => a.createdAt >= noBacklogCycleStart);
    const activeOrSubmittedForNoBacklog = assignmentsInNoBacklogCycle.filter((a) => a.submitAt || a.status === "Approved");

    const hasBacklog = assignmentsInNoBacklogCycle.some((a) => {
      const isUnsubmittedPending = !a.submitAt && a.status === "Pending";
      const isOlderThan3Days = (now.getTime() - a.createdAt.getTime()) > THREE_DAYS_MS;
      return isUnsubmittedPending && isOlderThan3Days;
    });

    const noBacklogCompleted = activeOrSubmittedForNoBacklog.length >= 2 && !hasBacklog;

    let noBacklogProgressLabel = "";
    if (activeOrSubmittedForNoBacklog.length < 2) {
      noBacklogProgressLabel = `ส่ง/อนุมัติงาน ${activeOrSubmittedForNoBacklog.length} / 2 งาน`;
    } else if (hasBacklog) {
      noBacklogProgressLabel = "⚠️ มีงานดองเกิน 3 วันยังไม่ได้ส่ง";
    } else {
      noBacklogProgressLabel = "✅ 0 backlog · On track";
    }

    // ── Level Up! ──
    const levelUpState = await getLevelUpWindowState(authUser.id, now);
    const levels = levelUpState.levels;
    const curLv = levels[levelUpState.currentIdx];
    const nextLv = levels[levelUpState.currentIdx + 1];
    const levelUpDaysLeft = Math.max(
      0,
      Math.ceil((LEVEL_UP_WINDOW_MS - (now.getTime() - levelUpState.windowStart.getTime())) / (1000 * 60 * 60 * 24)),
    );
    const levelUpCompleted = levelUpState.completed;

    // ── Comeback Kid ──
    const prevMonthAssignments = await prisma.assignment.findMany({
      where: { userId: authUser.id, deadline: { gte: prevMonthStart, lte: prevMonthEnd } },
    });
    const prevSubmitted = prevMonthAssignments.filter((a) => a.status !== "Pending");
    const prevLateCount = prevSubmitted.filter((a) => a.submitAt > a.deadline).length;
    const currentSubmitted = monthAssignments.filter((a) => a.status !== "Pending");
    const currentLateCount = currentSubmitted.filter((a) => a.submitAt > a.deadline).length;
    const comebackKid = prevLateCount >= 3 && currentLateCount === 0;

    // Leaderboard
    const bonusCycleStart = await getBonusCycleStart();
    const bonusLeaderboard = await getBonusLeaderboard(bonusCycleStart, now);

    function resolveIsClaimed(missionId: string, current: number): boolean {
      if (!claimedIds.has(missionId)) return false;
      if (!RESETTABLE_MISSION_IDS.has(missionId)) return true;
      return current === 0;
    }

    const missions: Record<string, Mission> = {
      "speed-runner": {
        id: "speed-runner", emoji: "⚡", name: "Speed Runner",
        description: "ส่งงานตรงเวลา (approved) ครบ 10 ชิ้น ภายใน 2 เดือน (กด Claim เพื่อเริ่มรอบใหม่)",
        category: "punctual", categoryLabel: "ตรงเวลา", rewardPoints: 1500,
        current: speedRunnerCurrent, target: speedRunnerTarget,
        progressLabel: `${speedRunnerCurrent} / ${speedRunnerTarget}`,
        progressPct: pct(speedRunnerCurrent, speedRunnerTarget), progressColor: "teal",
        isCompleted: speedRunnerCurrent >= speedRunnerTarget,
        isClaimed: resolveIsClaimed("speed-runner", speedRunnerCurrent),
      },
      "perfect-month": {
        id: "perfect-month", emoji: "👑", name: "Perfect Month",
        description: "Zero Late + Avg Score ≥ 80% (งาน ≥ 5 ชิ้น) — กด Claim เพื่อเริ่มรอบใหม่",
        category: "punctual", categoryLabel: "ตรงเวลา", rewardPoints: 1500,
        current: perfectMonth ? 1 : 0, target: 1,
        progressLabel: perfectMonth ? "✅ On track · 0 late" : "ยังไม่เข้าเงื่อนไข",
        progressPct: perfectMonth ? 100 : 0, progressColor: "green", isCompleted: perfectMonth,
        isClaimed: resolveIsClaimed("perfect-month", perfectMonth ? 1 : 0),
      },
      "first-responder": {
        id: "first-responder", emoji: "⏰", name: "First Responder",
        description: "ส่งงานภายใน 24 ชม. หลังได้รับ assign จำนวน 3 ครั้ง (กด Claim เพื่อเริ่มรอบใหม่)",
        category: "respond", categoryLabel: "ตอบรับเร็ว", rewardPoints: 500,
        current: firstResponderCount, target: firstResponderTarget,
        progressLabel: `${firstResponderCount} / ${firstResponderTarget}`,
        progressPct: pct(firstResponderCount, firstResponderTarget), progressColor: "blue",
        isCompleted: firstResponderCount >= firstResponderTarget,
        isClaimed: resolveIsClaimed("first-responder", firstResponderCount),
      },
      "quality-king": {
        id: "quality-king", emoji: "🎯", name: "Quality King",
        description: "ได้ Score ≥ 85% ครบ 8 งาน (กด Claim เพื่อเริ่มรอบใหม่)",
        category: "quality", categoryLabel: "คุณภาพ", rewardPoints: 1000,
        current: qualityKingCurrent, target: qualityKingTarget,
        progressLabel: `${qualityKingCurrent} / ${qualityKingTarget}`,
        progressPct: pct(qualityKingCurrent, qualityKingTarget), progressColor: "pink",
        isCompleted: qualityKingCurrent >= qualityKingTarget,
        isClaimed: resolveIsClaimed("quality-king", qualityKingCurrent),
      },
      "zero-reject": {
        id: "zero-reject",
        emoji: "✨",
        name: "Zero Reject",
        description: "ไม่มีงาน Rejected เลยตลอดทั้งเดือน (ตัดรอบสรุปผลและรับคะแนนทุกวันที่ 1 ของเดือนถัดไป)",
        category: "quality",
        categoryLabel: "คุณภาพ",
        rewardPoints: 500,
        current: zeroRejectCompleted ? 1 : 0,
        target: 1,
        progressLabel: !hasAssignmentsPrevMonth
          ? "เดือนที่แล้วไม่มีงาน"
          : zeroRejectCompleted
            ? "✅ เดือนที่แล้ว 0 rejected (พร้อมกดรับรางวัล)"
            : `❌ เดือนที่แล้วมี ${prevRejectedForZeroReject.length} rejected`,
        progressPct: zeroRejectCompleted ? 100 : 0,
        progressColor: "purple",
        isCompleted: zeroRejectCompleted,
        isClaimed: !!isZeroRejectClaimed,
      },
      workaholic: {
        id: "workaholic", emoji: "💪", name: "Workaholic",
        description: "ส่งงาน approved ≥ 15 ชิ้น (กด Claim เพื่อเริ่มรอบใหม่)",
        category: "volume", categoryLabel: "ปริมาณ", rewardPoints: 2000,
        current: workaholicCurrent, target: workaholicTarget,
        progressLabel: `${workaholicCurrent} / ${workaholicTarget}`,
        progressPct: pct(workaholicCurrent, workaholicTarget), progressColor: "green",
        isCompleted: workaholicCurrent >= workaholicTarget,
        isClaimed: resolveIsClaimed("workaholic", workaholicCurrent),
      },
      "consistency-pro": {
        id: "consistency-pro", emoji: "🧠", name: "8-Week Streak",
        description: "ตรวจงานของ INTERN ก่อน 1 ทุ่ม ครบ 8 สัปดาห์ติดต่อกัน (กด Claim เพื่อเริ่มรอบใหม่)",
        category: "volume", categoryLabel: "ปริมาณ", rewardPoints: 1000,
        current: consistencyProCurrent, target: consistencyTarget,
        progressLabel: `${consistencyProCurrent} / ${consistencyTarget} weeks`,
        progressPct: pct(consistencyProCurrent, consistencyTarget), progressColor: "teal",
        isCompleted: consistencyProCurrent >= consistencyTarget,
        isClaimed: resolveIsClaimed("consistency-pro", consistencyProCurrent),
      },
      "report-pro": {
        id: "report-pro", emoji: "📝", name: "20+ Reviews",
        description: "ตรวจงานของทีมมากกว่า 20 ครั้ง (กด Claim เพื่อเริ่มรอบใหม่)",
        category: "report", categoryLabel: "Routine", rewardPoints: 300,
        current: reviewedCount, target: reportProTarget,
        progressLabel: `${reviewedCount} / ${reportProTarget}+`,
        progressPct: pct(reviewedCount, reportProTarget), progressColor: "green",
        isCompleted: reviewedCount > reportProTarget,
        isClaimed: resolveIsClaimed("report-pro", reviewedCount),
      },
      "no-backlog": {
        id: "no-backlog", emoji: "📋", name: "No Backlog",
        description: "ไม่มีงานดองค้างเกิน 3 วันนับจากวันได้รับ assign + ทำส่ง/อนุมัติ ≥ 2 งาน (Claim ได้ 1 ครั้ง/เดือน)",
        category: "report", categoryLabel: "Routine", rewardPoints: 1000,
        current: activeOrSubmittedForNoBacklog.length, target: 2,
        progressLabel: noBacklogProgressLabel,
        progressPct: noBacklogCompleted ? 100 : Math.min(99, Math.round((activeOrSubmittedForNoBacklog.length / 2) * 100)),
        progressColor: "blue", isCompleted: noBacklogCompleted,
        // FIX: "no-backlog" is NOT in RESETTABLE_MISSION_IDS (matches redeem
        // route), so its claimed state is a plain "claimed this month?"
        // check, same as zero-reject/comeback-kid — not resolveIsClaimed(),
        // which is only correct for resettable missions.
        isClaimed: claimedIds.has("no-backlog"),
      },
      "level-up": {
        id: "level-up", emoji: "📈", name: "Level Up!",
        description: "เลื่อน Level ขึ้น 1 ระดับภายใน 2 อาทิตย์ (กด Claim เพื่อเริ่มรอบใหม่ — ถ้าครบ 14 วันไม่เลื่อน จะเริ่มนับใหม่อัตโนมัติ)",
        category: "growth", categoryLabel: "การเติบโต", rewardPoints: 1000,
        current: levelUpCompleted ? 1 : 0, target: 1,
        progressLabel: levelUpCompleted
          ? `✅ เลื่อน Level แล้ว${curLv ? ` (${curLv.name})` : ""}`
          : nextLv
            ? `${curLv ? curLv.name : "-"} → ${nextLv.name} · เหลือ ${levelUpDaysLeft} วัน`
            : "Max level",
        progressPct: levelUpCompleted ? 100 : 0, progressColor: "purple", isCompleted: levelUpCompleted,
        isClaimed: resolveIsClaimed("level-up", levelUpCompleted ? 1 : 0),
      },
      "comeback-kid": {
        id: "comeback-kid", emoji: "🌈", name: "Comeback Kid",
        description: "เดือนที่แล้ว late ≥ 3 ครั้ง แต่เดือนนี้ late = 0",
        category: "growth", categoryLabel: "การเติบโต", rewardPoints: 500,
        current: comebackKid ? 1 : 0, target: 1,
        progressLabel: `Last: ${prevLateCount} late · This: ${currentLateCount}`,
        progressPct: comebackKid ? 100 : 0, progressColor: "teal", isCompleted: comebackKid,
        isClaimed: claimedIds.has("comeback-kid"),
      },
    };

    const missionsDone = Object.values(missions).filter((m) => m.isCompleted).length;
    const bonusEarned = Object.values(missions)
      .filter((m) => m.isCompleted)
      .reduce((sum, m) => sum + m.rewardPoints, 0);

    const response: MissionQuestResponse = {
      kpis: {
        missionsDone,
        missionsTotal: Object.keys(missions).length,
        streakDays: 0,
        bonusEarned,
        daysLeft,
      },
      sections: [
        {
          key: "punctual", title: "ตรงเวลา & ส่งงานเร็ว", icon: "clock",
          iconBg: "#dbeafe", iconColor: "#1d4ed8", countLabel: "3 Missions",
          missions: [missions["speed-runner"], missions["perfect-month"], missions["first-responder"]],
        },
        {
          key: "quality", title: "คุณภาพงาน", icon: "gem",
          iconBg: "#fce7f3", iconColor: "#be185d", countLabel: "2 Missions",
          missions: [missions["quality-king"], missions["zero-reject"]],
        },
        {
          key: "volume", title: "ปริมาณ & Routine", icon: "chart-simple",
          iconBg: "#d1fae5", iconColor: "#047857", countLabel: "4 Missions",
          missions: [missions["workaholic"], missions["consistency-pro"], missions["report-pro"], missions["no-backlog"]],
        },
        {
          key: "growth", title: "การเติบโต", icon: "trending-up",
          iconBg: "#e0e7ff", iconColor: "#4338ca", countLabel: "2 Missions",
          missions: [missions["level-up"], missions["comeback-kid"]],
        },
      ],
      bonusTable: {
        buckets: BONUS_BUCKETS,
        leaderboard: bonusLeaderboard,
        cycleStart: bonusCycleStart.toISOString(),
      },
      summary: {
        potentialBonusPoints: Object.values(missions).reduce((sum, m) => sum + m.rewardPoints, 0),
        totalMissions: Object.keys(missions).length,
        breakdown: [
          { label: "ตรงเวลา", value: missions["speed-runner"].rewardPoints + missions["perfect-month"].rewardPoints + missions["first-responder"].rewardPoints, emoji: "⏱️" },
          { label: "คุณภาพ", value: missions["quality-king"].rewardPoints + missions["zero-reject"].rewardPoints, emoji: "💎" },
          { label: "ปริมาณ", value: missions["workaholic"].rewardPoints + missions["consistency-pro"].rewardPoints + missions["report-pro"].rewardPoints + missions["no-backlog"].rewardPoints, emoji: "📊" },
          { label: "การเติบโต", value: missions["level-up"].rewardPoints + missions["comeback-kid"].rewardPoints, emoji: "📈" },
        ],
      },
      categoryChart: [
        { name: "ตรงเวลา", value: 3 },
        { name: "คุณภาพ", value: 2 },
        { name: "ปริมาณ & Routine", value: 4 },
        { name: "การเติบโต", value: 2 },
      ],
      progressChart: [
        { category: "ตรงเวลา", progressPct: Math.round((missions["speed-runner"].progressPct + missions["perfect-month"].progressPct + missions["first-responder"].progressPct) / 3) },
        { category: "คุณภาพ", progressPct: Math.round((missions["quality-king"].progressPct + missions["zero-reject"].progressPct) / 2) },
        { category: "ปริมาณ", progressPct: Math.round((missions["workaholic"].progressPct + missions["consistency-pro"].progressPct + missions["report-pro"].progressPct + missions["no-backlog"].progressPct) / 4) },
        { category: "การเติบโต", progressPct: Math.round((missions["level-up"].progressPct + missions["comeback-kid"].progressPct) / 2) },
      ],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Mission quest route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}