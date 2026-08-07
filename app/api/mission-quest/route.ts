import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  getBonusCycleStart,
  getPrevRankSnapshot,
  maybeRefreshRankSnapshot,
  getFullBucketIndex,
} from "@/lib/bonus-cycle";
import { BONUS_BUCKETS } from "@/lib/bonus-buckets";
import type {
  MissionQuestResponse,
  Mission,
} from "@/types/mission-quest";
import {
  MISSION_TRACKING_START,
  LEVEL_UP_WINDOW_MS,
  THREE_DAYS_MS,
  RESETTABLE_MISSION_IDS,
  clampStart,
  getConsistencyProStreak,
} from "@/lib/mission-shared";

const AUTO_CLAIM_DEPLOY_START = MISSION_TRACKING_START;

function pct(current: number, target: number) {
  return target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
}

async function safeGetConsistencyStreak(
  username: string,
  now: Date,
  targetWeeks: number,
  cycleStart: Date
): Promise<number> {
  try {
    return await getConsistencyProStreak(prisma as any, username, now, targetWeeks, cycleStart);
  } catch (err) {
    console.error("Failed to calculate consistency pro streak:", err);
    return 0;
  }
}

async function getBonusLeaderboard(cycleStart: Date, now: Date): Promise<any[]> {
  try {
    const approvedAssignments = (
      await prisma.assignment.findMany({
        where: {
          status: "Approved",
          OR: [
            { deadline: { gte: cycleStart } },
            { submitAt: { gte: cycleStart } },
          ],
          user: { role: "STAFF" },
        },
        include: {
          user: { select: { id: true, nickname: true, username: true } },
        },
      })
    ).filter((a) => a.submitAt != null);

    type Entry = {
      id: string;
      assignmentId: string;
      title: string;
      deadline: Date;
      submitAt: Date;
      userId: string;
      name: string;
      username: string;
      reward: number;
      earlyMs: number;
    };

    // เก็บ "แชมป์" ของแต่ละ bucket แบบ global (1 คนต่อ bucket เท่านั้น)
    const bucketChampion: (Entry | null)[] = new Array(BONUS_BUCKETS.length).fill(null);

    for (const a of approvedAssignments) {
      const idx = getFullBucketIndex(a.deadline, a.submitAt!);
      if (idx < 0 || idx >= BONUS_BUCKETS.length) continue;

      const earlyMs = a.deadline.getTime() - a.submitAt!.getTime();
      const entry: Entry = {
        id: a.id,
        assignmentId: a.id,
        title: a.title,
        deadline: a.deadline,
        submitAt: a.submitAt!,
        userId: a.userId,
        name: a.user.nickname,
        username: a.user.username,
        reward: a.reward,
        earlyMs,
      };

      const current = bucketChampion[idx];

      if (!current) {
        bucketChampion[idx] = entry;
        continue;
      }

      // bucket 0-3 (ส่งเร็ว/early bird): earlyMs ยิ่งมาก ยิ่งดี -> เอาคนที่ส่งเร็วที่สุด
      // bucket 4-6 (overdue): earlyMs ยิ่งติดลบมาก ยิ่งสาย -> เอาคนที่สายที่สุด
      const isBetter =
        idx < 4 ? entry.earlyMs > current.earlyMs : entry.earlyMs < current.earlyMs;

      if (isBetter) {
        bucketChampion[idx] = entry;
      }
    }

    const allUserIds = new Set<string>();
    bucketChampion.forEach((entry) => {
      if (entry) allUserIds.add(entry.userId);
    });

    if (allUserIds.size === 0) {
      return [];
    }

    const winnerIdsForQuery = Array.from(allUserIds);

    type ScoreGroupByRecipient = {
      recipient_id: string;
      _sum: { score: number | null };
    };

    const [scoreGroups, claimsByUser] = await Promise.all([
      prisma.score.groupBy({
        by: ["recipient_id"],
        where: {
          recipient_id: { in: winnerIdsForQuery },
          createdAt: { gte: cycleStart, lte: now },
        },
        _sum: { score: true },
      }),
      prisma.missionClaim.findMany({
        where: {
          userId: { in: winnerIdsForQuery },
          claimedAt: { gte: cycleStart, lte: now },
        },
        select: { userId: true },
      }),
    ]);

    const cycleScoreTotals = new Map<string, number>();
    (scoreGroups as ScoreGroupByRecipient[]).forEach((g) => {
      cycleScoreTotals.set(g.recipient_id, g._sum?.score ?? 0);
    });

    const claimsCountByUser = new Map<string, number>();
    claimsByUser.forEach((c) => {
      claimsCountByUser.set(c.userId, (claimsCountByUser.get(c.userId) ?? 0) + 1);
    });

    const userMap = new Map<
      string,
      {
        userId: string;
        name: string;
        username: string;
        buckets: number[];
        bucketEntries: any[][];
        missionsDone: number;
        bonusEarned: number;
        totalPoints: number;
      }
    >();

    for (let idx = 0; idx < bucketChampion.length; idx++) {
      const entry = bucketChampion[idx];
      if (!entry) continue; // bucket นี้ยังไม่มีใครทำสำเร็จเลย

      if (!userMap.has(entry.userId)) {
        const realCycleTotal = cycleScoreTotals.get(entry.userId) ?? 0;
        userMap.set(entry.userId, {
          userId: entry.userId,
          name: entry.name,
          username: entry.username,
          buckets: new Array(BONUS_BUCKETS.length).fill(0),
          bucketEntries: Array.from({ length: BONUS_BUCKETS.length }, () => []),
          missionsDone: claimsCountByUser.get(entry.userId) ?? 0,
          bonusEarned: realCycleTotal,
          totalPoints: realCycleTotal,
        });
      }

      const userData = userMap.get(entry.userId)!;
      userData.buckets[idx] = 1;
      userData.bucketEntries[idx] = [
        {
          id: entry.id,
          assignmentId: entry.assignmentId,
          title: entry.title,
          deadline: entry.deadline,
          submitAt: entry.submitAt,
          reward: entry.reward,
        },
      ];
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
      prevSnapshot ? Object.entries(prevSnapshot.ranks) : [],
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
  } catch (error) {
    console.error("Error in getBonusLeaderboard:", error);
    return [];
  }
}

async function getLevelUpWindowState(userId: string, now: Date) {
  const [levels, agg] = await Promise.all([
    prisma.level.findMany({ orderBy: { minScore: "asc" } }),
    prisma.score.aggregate({ where: { recipient_id: userId }, _sum: { score: true } }),
  ]);

  const totalScore = Math.max(0, agg._sum.score ?? 0);
  const currentIdx = levels.length > 0
    ? levels.findIndex((l) => totalScore >= l.minScore && totalScore <= l.maxScore)
    : 0;
  const safeCurrentIdx = currentIdx < 0 ? 0 : currentIdx;

  let win = await prisma.missionWindow.findUnique({
    where: { userId_missionId: { userId, missionId: "level-up" } },
  });

  if (!win) {
    try {
      win = await prisma.missionWindow.create({
        data: { userId, missionId: "level-up", windowStart: now, referenceLevelIdx: safeCurrentIdx },
      });
    } catch {
      win = await prisma.missionWindow.findUnique({
        where: { userId_missionId: { userId, missionId: "level-up" } },
      });
    }
  }

  if (!win) {
    return { completed: false, currentIdx: safeCurrentIdx, windowStart: now, levels };
  }

  const expired = now.getTime() - win.windowStart.getTime() > LEVEL_UP_WINDOW_MS;
  const leveledUp = safeCurrentIdx > win.referenceLevelIdx;

  if (expired && !leveledUp) {
    try {
      win = await prisma.missionWindow.update({
        where: { id: win.id },
        data: { windowStart: now, referenceLevelIdx: safeCurrentIdx },
      });
    } catch (err) {
      console.error("Failed to update expired level-up window:", err);
    }
    return { completed: false, currentIdx: safeCurrentIdx, windowStart: win?.windowStart ?? now, levels };
  }

  return { completed: leveledUp, currentIdx: safeCurrentIdx, windowStart: win.windowStart, levels };
}

async function autoClaimUnclaimedPreviousMonth(
  userId: string,
  nickname: string,
  username: string,
  prevMonthStart: Date,
  prevMonthEnd: Date,
  prevMonthNum: number,
  prevYearNum: number,
) {
  if (prevMonthEnd < MISSION_TRACKING_START) return;
  if (prevMonthStart < AUTO_CLAIM_DEPLOY_START) return;

  const prevPrevMonthStart = clampStart(new Date(prevMonthStart.getFullYear(), prevMonthStart.getMonth() - 1, 1));
  const prevPrevMonthEnd = new Date(prevMonthStart.getFullYear(), prevMonthStart.getMonth(), 0, 23, 59, 59);

  const [
    prevAssignments,
    prevReviewedCount,
    prevConsistencyStreak,
    prevPrevAssignments,
  ] = await Promise.all([
    prisma.assignment.findMany({
      where: { userId, deadline: { gte: prevMonthStart, lte: prevMonthEnd } },
    }),
    prisma.dailyReport.count({
      where: {
        reviewedBy: username,
        status: { in: ["Approved", "Rejected"] },
        updatedAt: { gte: prevMonthStart, lte: prevMonthEnd },
        user: { role: "INTERN" },
      },
    }),
    safeGetConsistencyStreak(username, prevMonthEnd, 8, prevMonthStart),
    prisma.assignment.findMany({
      where: { userId, deadline: { gte: prevPrevMonthStart, lte: prevPrevMonthEnd } },
    }),
  ]);

  const prevSubmitted = prevAssignments.filter((a) => a.status !== "Pending");
  const prevApproved = prevAssignments.filter((a) => a.status === "Approved");
  const prevRejected = prevAssignments.filter((a) => a.status === "Rejected");
  const prevLateCount = prevSubmitted.filter((a) => a.submitAt && a.submitAt > a.deadline).length;

  const prevAvgScorePct =
    prevApproved.length > 0
      ? prevApproved.reduce((sum, a) => sum + (a.reward ? (a.finalScore / a.reward) * 100 : 0), 0) /
        prevApproved.length
      : 0;

  const prevFirstResponderCount = prevSubmitted.filter((a) => {
    if (!a.submitAt) return false;
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

  const prevActiveOrSubmittedForNoBacklog = prevAssignments.filter(
    (a) => a.submitAt || a.status === "Approved",
  );

  const prevPrevSubmitted = prevPrevAssignments.filter((a) => a.status !== "Pending");
  const prevPrevLateCount = prevPrevSubmitted.filter((a) => a.submitAt && a.submitAt > a.deadline).length;
  const comebackKidCompleted = prevPrevLateCount >= 3 && prevLateCount === 0;

  const finalStates: { id: string; isCompleted: boolean; rewardPoints: number; name: string }[] = [
    { id: "speed-runner", isCompleted: prevApproved.filter((a) => a.submitAt && a.submitAt <= a.deadline).length >= 10, rewardPoints: 1500, name: "Speed Runner" },
    { id: "perfect-month", isCompleted: prevLateCount === 0 && prevApproved.length >= 5 && prevAvgScorePct >= 80, rewardPoints: 1500, name: "Perfect Month" },
    { id: "first-responder", isCompleted: prevFirstResponderCount >= 3, rewardPoints: 500, name: "First Responder" },
    { id: "quality-king", isCompleted: prevQualityKingCurrent >= 8, rewardPoints: 1000, name: "Quality King" },
    { id: "zero-reject", isCompleted: prevAssignments.length > 0 && prevRejected.length === 0, rewardPoints: 500, name: "Zero Reject" },
    { id: "workaholic", isCompleted: prevApproved.length >= 15, rewardPoints: 2000, name: "Workaholic" },
    { id: "report-pro", isCompleted: prevReviewedCount > 20, rewardPoints: 300, name: "20+ Reviews" },
    { id: "no-backlog", isCompleted: prevActiveOrSubmittedForNoBacklog.length >= 2 && !prevHasBacklog, rewardPoints: 1000, name: "No Backlog" },
    { id: "consistency-pro", isCompleted: prevConsistencyStreak >= 8, rewardPoints: 1000, name: "8-Week Streak" },
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

    const { searchParams } = new URL(request.url);
    const viewUserId = searchParams.get("userId");

    let targetUserId = authUser.id;
    let targetNickname = authUser.nickname;
    let targetUsername = authUser.username;

    if (viewUserId && viewUserId !== authUser.id) {
      if (!isSuperAdmin) {
        return NextResponse.json({ error: "Access denied." }, { status: 403 });
      }
      const targetUser = await prisma.user.findUnique({
        where: { id: viewUserId },
        select: { id: true, nickname: true, username: true, role: true },
      });
      if (!targetUser || targetUser.role !== "STAFF") {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
      targetUserId = targetUser.id;
      targetNickname = targetUser.nickname;
      targetUsername = targetUser.username;
    }

    const now = new Date();
    const monthStart = clampStart(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const prevMonthStart = clampStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const daysLeft = Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    await autoClaimUnclaimedPreviousMonth(
      targetUserId,
      targetNickname,
      targetUsername,
      prevMonthStart,
      prevMonthEnd,
      prevMonthStart.getMonth() + 1,
      prevMonthStart.getFullYear(),
    );

    const currentMonthNum = now.getMonth() + 1;
    const currentYearNum = now.getFullYear();

    const [
      monthClaims,
      monthAssignments,
      prevMonthAssignments,
      levelUpState,
      bonusCycleStart,
      isZeroRejectClaimed,
    ] = await Promise.all([
      prisma.missionClaim.findMany({
        where: { userId: targetUserId, month: currentMonthNum, year: currentYearNum },
        orderBy: { claimedAt: "asc" },
      }),
      prisma.assignment.findMany({
        where: { userId: targetUserId, deadline: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.assignment.findMany({
        where: { userId: targetUserId, deadline: { gte: prevMonthStart, lte: prevMonthEnd } },
      }),
      getLevelUpWindowState(targetUserId, now),
      getBonusCycleStart(),
      prisma.missionClaim.findFirst({
        where: {
          userId: targetUserId,
          missionId: "zero-reject",
          month: prevMonthStart.getMonth() + 1,
          year: prevMonthStart.getFullYear(),
        },
      }),
    ]);

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

    const submitted = monthAssignments.filter((a) => a.status !== "Pending");
    const approved = monthAssignments.filter((a) => a.status === "Approved");

    const speedRunnerWindowStart = clampStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const speedRunnerCycleStart = cycleStartOf("speed-runner");
    const speedRunnerEffectiveStart =
      speedRunnerCycleStart > speedRunnerWindowStart ? speedRunnerCycleStart : speedRunnerWindowStart;

    const perfectMonthCycleStart = cycleStartOf("perfect-month");
    const approvedForPerfect = approved.filter((a) => a.deadline >= perfectMonthCycleStart && a.updatedAt >= perfectMonthCycleStart);
    const submittedForPerfect = submitted.filter((a) => a.deadline >= perfectMonthCycleStart);
    const lateCountForPerfect = submittedForPerfect.filter((a) => a.submitAt && a.submitAt > a.deadline).length;
    const avgScorePctForPerfect =
      approvedForPerfect.length > 0
        ? approvedForPerfect.reduce((sum, a) => sum + (a.reward ? (a.finalScore / a.reward) * 100 : 0), 0) /
          approvedForPerfect.length
        : 0;
    const perfectMonth = lateCountForPerfect === 0 && approvedForPerfect.length >= 5 && avgScorePctForPerfect >= 80;

    const firstResponderCycleStart = cycleStartOf("first-responder");
    const firstResponderCount = submitted.filter((a) => {
      if (!a.submitAt) return false;
      if (a.deadline < firstResponderCycleStart || a.submitAt < firstResponderCycleStart) return false;
      const diffHours = (a.submitAt.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours <= 24;
    }).length;
    const firstResponderTarget = 3;

    const qualityKingCycleStart = cycleStartOf("quality-king");
    const qualityKingCurrent = approved.filter(
      (a) => a.deadline >= qualityKingCycleStart && a.updatedAt >= qualityKingCycleStart && a.reward > 0 && a.finalScore / a.reward >= 0.85,
    ).length;
    const qualityKingTarget = 8;

    const prevRejectedForZeroReject = prevMonthAssignments.filter((a) => a.status === "Rejected");
    const hasAssignmentsPrevMonth = prevMonthAssignments.length > 0;
    const zeroRejectCompleted = hasAssignmentsPrevMonth && prevRejectedForZeroReject.length === 0;

    const workaholicCycleStart = cycleStartOf("workaholic");
    const workaholicCurrent = approved.filter((a) => a.deadline >= workaholicCycleStart && a.updatedAt >= workaholicCycleStart).length;
    const workaholicTarget = 15;

    const consistencyTarget = 8;
    function streakCycleStartOf(missionId: string): Date {
      const claimedAt = lastClaimedAtMap.get(missionId);
      if (claimedAt && claimedAt > MISSION_TRACKING_START) return claimedAt;
      return MISSION_TRACKING_START;
    }

    const consistencyProCycleStart = streakCycleStartOf("consistency-pro");
    const reportProCycleStart = cycleStartOf("report-pro");

    const [speedRunnerAssignments, consistencyProCurrent, reviewedCount] = await Promise.all([
      prisma.assignment.findMany({
        where: {
          userId: targetUserId,
          status: "Approved",
          deadline: { gte: speedRunnerEffectiveStart, lte: monthEnd },
        },
      }),
      safeGetConsistencyStreak(
        targetUsername,
        now,
        consistencyTarget,
        consistencyProCycleStart,
      ),
      prisma.dailyReport.count({
        where: {
          reviewedBy: targetUsername,
          status: { in: ["Approved", "Rejected"] },
          updatedAt: { gte: reportProCycleStart, lte: monthEnd },
          user: { role: "INTERN" },
        },
      }),
    ]);
    const speedRunnerCurrent = speedRunnerAssignments.filter((a) => a.submitAt && a.submitAt <= a.deadline && a.updatedAt >= speedRunnerCycleStart).length;
    const speedRunnerTarget = 10;
    const reportProTarget = 20;

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

    const levels = levelUpState.levels;
    const curLv = levels[levelUpState.currentIdx] ?? null;
    const nextLv = levels[levelUpState.currentIdx + 1] ?? null;
    const levelUpDaysLeft = Math.max(
      0,
      Math.ceil((LEVEL_UP_WINDOW_MS - (now.getTime() - levelUpState.windowStart.getTime())) / (1000 * 60 * 60 * 24)),
    );
    const levelUpCompleted = levelUpState.completed;

    const prevSubmitted = prevMonthAssignments.filter((a) => a.status !== "Pending");
    const prevLateCount = prevSubmitted.filter((a) => a.submitAt && a.submitAt > a.deadline).length;
    const currentSubmitted = monthAssignments.filter((a) => a.status !== "Pending");
    const currentLateCount = currentSubmitted.filter((a) => a.submitAt && a.submitAt > a.deadline).length;
    const comebackKid = prevLateCount >= 3 && currentLateCount === 0;

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
        description: "ตรวจงานของ INTERN มากกว่า 20 ครั้ง (กด Claim เพื่อเริ่มรอบใหม่)",
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