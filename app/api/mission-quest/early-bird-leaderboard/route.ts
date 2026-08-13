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

// ── ย้ายมาจาก mission-quest/route.ts (getBonusLeaderboard) แบบคำต่อคำ ──
// Logic: แต่ละ bucket มี "แชมป์" ได้แค่ 1 คน (คนที่ทำได้ดีที่สุดใน bucket นั้น)
// bonusEarned/totalPoints มาจาก Score จริงในรอบ (ตัดคะแนน Mission Quest ออก)
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
      // ไม่นับคะแนนที่มาจาก Mission Quest claim เข้าไปใน Early Bird bonus
      prisma.score.groupBy({
        by: ["recipient_id"],
        where: {
          recipient_id: { in: winnerIdsForQuery },
          createdAt: { gte: cycleStart, lte: now },
          reviewer: { not: "System (Mission Quest)" },
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

// GET: ข้อมูล Early Bird Bonus Leaderboard ของรอบปัจจุบัน
// คืนค่าตรงกับ shape ที่ EarlyBirdBonusTable component ต้องการ:
// { buckets, leaderboard: [...], cycleStart, kpis }
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
    const cycleStart = await getBonusCycleStart();

    const leaderboard = await getBonusLeaderboard(cycleStart, now);

    const kpis = {
      totalStaff: leaderboard.length,
      totalPointsAwarded: leaderboard.reduce((sum, r) => sum + (r.bonusEarned ?? 0), 0),
      topScore: leaderboard[0]?.bonusEarned ?? 0,
    };

    return NextResponse.json({
      cycleStart: cycleStart.toISOString(),
      buckets: BONUS_BUCKETS,
      leaderboard,
      kpis,
    });
  } catch (error) {
    console.error("Get early-bird leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}