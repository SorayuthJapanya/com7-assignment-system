import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const MISSION_TRACKING_START = new Date(2026, 7, 1); // 1/8/69

function clampStart(date: Date): Date {
  return date > MISSION_TRACKING_START ? date : MISSION_TRACKING_START;
}

// มิชชั่นที่รองรับ "รีเซ็ตแล้ว claim ซ้ำได้อีกในเดือนเดียวกัน" — ต้องตรงกับ RESETTABLE_MISSION_IDS ใน app/api/mission-quest/route.ts เป๊ะ
const RESETTABLE_MISSION_IDS = new Set([
  "speed-runner",
  "workaholic",
  "quality-king",
  "first-responder",
  "zero-reject",
  "no-backlog",
  "perfect-month",
  "consistency-pro",
  "report-pro",
]);

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// ต้องเหมือนกับ getConsistencyProStreak ใน app/api/mission-quest/route.ts เป๊ะ
async function getConsistencyProStreak(
  nickname: string,
  now: Date,
  targetWeeks: number,
  cycleStart: Date,
): Promise<number> {
  const interns = await prisma.user.findMany({ where: { role: "INTERN" }, select: { id: true } });
  const internIds = interns.map((i) => i.id);
  if (internIds.length === 0) return 0;

  const lookbackStart = clampStart(new Date(now.getTime() - (targetWeeks + 2) * 7 * 24 * 60 * 60 * 1000));

  const reviews = await prisma.score.findMany({
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

    const reviewsThisWeek = reviews.filter((r) => r.createdAt >= weekStart && r.createdAt < weekEnd);
    const passedThisWeek = reviewsThisWeek.length > 0 && reviewsThisWeek.every((r) => r.createdAt.getHours() < 19);
    if (!passedThisWeek) break;
    streak++;
  }
  return streak;
}

// ต้อง sync logic การเช็คว่ามิชชั่นไหน "สำเร็จจริง" ให้ตรงกับ app/api/mission-quest/route.ts เป๊ะ
// ป้องกันคนแก้ค่าใน localStorage/devtools แล้วยิง claim ตรงๆ โดยที่ยังไม่ผ่านเงื่อนไขจริง
async function checkMissionCompleted(
  userId: string,
  nickname: string,
  missionId: string,
): Promise<{ completed: boolean; rewardPoints: number }> {
  const now = new Date();
  const monthStart = clampStart(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const prevMonthStart = clampStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 🆕 หาเวลา claim ล่าสุดของมิชชั่นนี้ในเดือนนี้ (ถ้ามี) เพื่อใช้เป็นจุดเริ่มนับรอบใหม่ — ต้องตรงกับ cycleStartOf() ใน GET route
  let cycleStart = monthStart;
  if (RESETTABLE_MISSION_IDS.has(missionId)) {
    const lastClaim = await prisma.missionClaim.findFirst({
      where: { userId, missionId, month: currentMonth, year: currentYear },
      orderBy: { claimedAt: "desc" },
    });
    if (lastClaim && lastClaim.claimedAt > monthStart && lastClaim.claimedAt <= monthEnd) {
      cycleStart = lastClaim.claimedAt;
    }
  }

  const monthAssignments = await prisma.assignment.findMany({
    where: { userId, deadline: { gte: monthStart, lte: monthEnd } },
  });
  const submitted = monthAssignments.filter((a) => a.status !== "Pending");
  const approved = monthAssignments.filter((a) => a.status === "Approved");
  const rejected = monthAssignments.filter((a) => a.status === "Rejected");
  const pending = monthAssignments.filter((a) => a.status === "Pending");
  const lateCount = submitted.filter((a) => a.submitAt > a.deadline).length;

  switch (missionId) {
    case "speed-runner": {
      const speedRunnerWindowStart = clampStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const effectiveStart = cycleStart > speedRunnerWindowStart ? cycleStart : speedRunnerWindowStart;
      const speedRunnerAssignments = await prisma.assignment.findMany({
        where: { userId, status: "Approved", deadline: { gte: effectiveStart, lte: monthEnd } },
      });
      const count = speedRunnerAssignments.filter((a) => a.submitAt <= a.deadline).length;
      return { completed: count >= 10, rewardPoints: 800 };
    }

    case "perfect-month": {
      const approvedInCycle = approved.filter((a) => a.deadline >= cycleStart);
      const submittedInCycle = submitted.filter((a) => a.deadline >= cycleStart);
      const lateInCycle = submittedInCycle.filter((a) => a.submitAt > a.deadline).length;
      const avgScorePct =
        approvedInCycle.length > 0
          ? approvedInCycle.reduce((s, a) => s + (a.reward ? (a.finalScore / a.reward) * 100 : 0), 0) / approvedInCycle.length
          : 0;
      return { completed: lateInCycle === 0 && approvedInCycle.length >= 5 && avgScorePct >= 80, rewardPoints: 1500 };
    }

    case "first-responder": {
      const count = submitted.filter((a) => {
        if (a.deadline < cycleStart) return false;
        const diffHours = (a.submitAt.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60);
        return diffHours >= 0 && diffHours <= 24;
      }).length;
      return { completed: count >= 3, rewardPoints: 400 };
    }

    case "quality-king": {
      const count = approved.filter((a) => a.deadline >= cycleStart && a.reward > 0 && a.finalScore / a.reward >= 0.85).length;
      return { completed: count >= 8, rewardPoints: 600 };
    }

    case "zero-reject": {
      const inCycle = monthAssignments.filter((a) => a.deadline >= cycleStart);
      const rejectedInCycle = rejected.filter((a) => a.deadline >= cycleStart);
      return { completed: inCycle.length > 0 && rejectedInCycle.length === 0, rewardPoints: 400 };
    }

    case "workaholic": {
      const count = approved.filter((a) => a.deadline >= cycleStart).length;
      return { completed: count >= 15, rewardPoints: 700 };
    }

    case "consistency-pro": {
      const streak = await getConsistencyProStreak(nickname, now, 8, cycleStart);
      return { completed: streak >= 8, rewardPoints: 500 };
    }

    case "report-pro": {
      const reviewedCount = await prisma.score.count({
        where: { reviewer: nickname, createdAt: { gte: cycleStart, lte: monthEnd } },
      });
      return { completed: reviewedCount > 20, rewardPoints: 300 };
    }

    case "no-backlog": {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const pendingInCycle = pending.filter((a) => a.deadline >= cycleStart);
      const inCycle = monthAssignments.filter((a) => a.deadline >= cycleStart);
      const hasBacklog = pendingInCycle.some((a) => a.deadline < threeDaysAgo);
      return { completed: inCycle.length > 0 && !hasBacklog, rewardPoints: 200 };
    }

    // ── ไม่รองรับ reset กลางเดือน (มิชชั่นแบบครั้งเดียว/เดือน) ──
    case "level-up": {
      const agg = await prisma.score.aggregate({ where: { recipient_id: userId }, _sum: { score: true } });
      const totalScore = agg._sum.score ?? 0;
      const levels = await prisma.level.findMany({ orderBy: { minScore: "asc" } });
      const idx = levels.findIndex((l) => totalScore >= l.minScore && totalScore <= l.maxScore);
      const cur = levels[idx];
      const next = levels[idx + 1];
      const levelUpPct = cur && next
        ? Math.min(100, Math.round(((totalScore - cur.minScore) / (cur.maxScore - cur.minScore)) * 100))
        : 0;
      return { completed: levelUpPct >= 100, rewardPoints: 1000 };
    }

    case "comeback-kid": {
      const prevAssignments = await prisma.assignment.findMany({
        where: { userId, deadline: { gte: prevMonthStart, lte: prevMonthEnd } },
      });
      const prevSubmitted = prevAssignments.filter((a) => a.status !== "Pending");
      const prevLateCount = prevSubmitted.filter((a) => a.submitAt > a.deadline).length;
      return { completed: prevLateCount >= 3 && lateCount === 0, rewardPoints: 500 };
    }

    default:
      return { completed: false, rewardPoints: 0 };
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

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // ✅ เช็คซ้ำจริงจาก database (cycle-aware) ไม่เชื่อค่าที่ frontend ส่งมาว่า "สำเร็จแล้ว"
    const { completed, rewardPoints } = await checkMissionCompleted(
      authUser.id,
      authUser.nickname,
      missionId,
    );

    if (!completed) {
      return NextResponse.json(
        { error: "Mission ยังไม่สำเร็จตามเงื่อนไข ไม่สามารถ claim ได้" },
        { status: 400 },
      );
    }

    // 🆕 ไม่มี unique constraint แล้ว (เอาออกเพื่อรองรับ claim ซ้ำได้หลายรอบ/เดือน)
    // การกัน double-submit ตอนนี้อาศัย checkMissionCompleted() เอง: หลัง claim ไปแล้ว cycle จะรีเซ็ต
    // ทำให้ completed = false ทันทีถ้ายังไม่มีความคืบหน้าใหม่ จึง claim ซ้ำไม่ผ่านอยู่ดี
    // 🆕 ใช้ upsert แทน create — ไม่ต้อง migrate schema, ไม่ต้องลบ unique constraint
    // ถ้าเคย claim มิชชั่นนี้เดือนนี้แล้ว: อัปเดตแถวเดิม (บวกแต้มสะสม + รีเฟรช createdAt เป็นตอนนี้ = จุดเริ่มรอบใหม่)
    // ถ้ายังไม่เคย: สร้างแถวใหม่ตามปกติ
    await prisma.$transaction(async (tx) => {
      const existing = await tx.missionClaim.findFirst({
        where: { userId: authUser.id, missionId, month, year },
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
          data: { userId: authUser.id, missionId, month, year, points: rewardPoints },
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
    });

    return NextResponse.json({
      message: "Claim สำเร็จ",
      rewardPoints,
    });
  } catch (error) {
    console.error("Redeem mission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}