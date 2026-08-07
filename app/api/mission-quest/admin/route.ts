import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);

    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: 401 });
    }

    if (authResult.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get("missionId") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const skip = (page - 1) * limit;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter Where Objects
    const claimWhere: any = {};
    if (missionId) claimWhere.missionId = missionId;
    if (userId) claimWhere.userId = userId;

    const overdueWhere: any = {
      reviewer: "Overdue Deduction",
      assignment_title: "Redeem overdue minutes",
    };
    if (userId) overdueWhere.recipient_id = userId;

    // 🎯 FIX: รวม claimsToday (count) + pointsToday (sum) เข้าเป็น aggregate
    // เดียวกัน เพราะทั้งคู่ query ตาราง missionClaim ด้วย where เดียวกัน
    // (claimedAt >= todayStart) — เดิมเป็น 2 queries แยกกัน ลดเหลือ 1 query
    // ผลลัพธ์ที่ได้ (จำนวน claim วันนี้ + คะแนนรวมวันนี้) เหมือนเดิมทุกประการ
    //
    // รัน Query ทั้งหมดขนานกันใน Promise.all
    const [
      todayAgg,
      claimsThisMonth,
      activeStaffCount,
      topMissionGroup,
      overdueToday,
      overdueThisMonth,
      claims,
      totalClaims,
      overdueRows,
      missionSummary,
    ] = await Promise.all([
      prisma.missionClaim.aggregate({
        where: { claimedAt: { gte: todayStart } },
        _count: true,
        _sum: { points: true },
      }),

      prisma.missionClaim.count({ where: { claimedAt: { gte: monthStart } } }),

      prisma.missionClaim.groupBy({
        by: ["userId"],
        where: { claimedAt: { gte: monthStart } },
      }),

      prisma.missionClaim.groupBy({
        by: ["missionId"],
        where: { claimedAt: { gte: monthStart } },
        _count: { missionId: true },
        orderBy: { _count: { missionId: "desc" } },
        take: 1,
      }),

      prisma.score.aggregate({
        where: {
          reviewer: "Overdue Deduction",
          assignment_title: "Redeem overdue minutes",
          createdAt: { gte: todayStart },
        },
        _sum: { score: true },
        _count: true,
      }),

      prisma.score.aggregate({
        where: {
          reviewer: "Overdue Deduction",
          assignment_title: "Redeem overdue minutes",
          createdAt: { gte: monthStart },
        },
        _sum: { score: true },
        _count: true,
      }),

      prisma.missionClaim.findMany({
        where: claimWhere,
        orderBy: { claimedAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, nickname: true, username: true } },
        },
      }),

      prisma.missionClaim.count({ where: claimWhere }),

      // 🎯 แก้ไขจาก recipient -> user ให้ตรงกับ Prisma Schema
      prisma.score.findMany({
        where: overdueWhere,
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          score: true,
          recipient_id: true,
          createdAt: true,
          user: {
            select: { id: true, nickname: true, username: true },
          },
        },
      }),

      prisma.missionClaim.groupBy({
        by: ["missionId"],
        where: { claimedAt: { gte: monthStart } },
        _count: { missionId: true },
        _sum: { points: true },
      }),
    ]);

    const claimsToday = todayAgg._count;
    const pointsToday = todayAgg._sum.points ?? 0;

    return NextResponse.json({
      kpi: {
        claimsToday,
        pointsToday,
        claimsThisMonth,
        activeStaff: activeStaffCount.length,
        topMission: topMissionGroup[0]
          ? {
              missionId: topMissionGroup[0].missionId,
              count: topMissionGroup[0]._count.missionId,
            }
          : null,
        overduePointsToday: Math.abs(overdueToday._sum.score ?? 0),
        overdueCountToday: overdueToday._count,
        overduePointsThisMonth: Math.abs(overdueThisMonth._sum.score ?? 0),
        overdueCountThisMonth: overdueThisMonth._count,
        overdueMinutesThisMonth: Math.abs(overdueThisMonth._sum.score ?? 0) * 5,
      },
      claims: claims.map((c) => ({
        id: c.id,
        userId: c.userId,
        nickname: c.user?.nickname ?? "-",
        username: c.user?.username ?? "-",
        missionId: c.missionId,
        points: c.points,
        month: c.month,
        year: c.year,
        claimedAt: c.claimedAt.toISOString(),
      })),
      overdue: overdueRows.map((r) => {
        const pointsUsed = Math.abs(r.score);
        return {
          id: r.id,
          userId: r.recipient_id,
          nickname: r.user?.nickname ?? "-",
          username: r.user?.username ?? "-",
          points: r.score,
          pointsUsed,
          minutes: pointsUsed * 5,
          createdAt: r.createdAt.toISOString(),
        };
      }),
      pagination: {
        page,
        limit,
        total: totalClaims,
        totalPages: Math.ceil(totalClaims / limit),
      },
      missionSummary: missionSummary.map((m) => ({
        missionId: m.missionId,
        claimCount: m._count.missionId,
        totalPoints: m._sum.points ?? 0,
      })),
    });
  } catch (error) {
    console.error("Admin mission-quest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}