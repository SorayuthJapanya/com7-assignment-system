import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const REWARD_REVIEWER = "System (Mission Quest)";
const REWARD_TITLE_PREFIX = "Mission Reward: ";

export async function GET(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authUser = authResult.user!;
    if (authUser.role !== "STAFF" && authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    // Every successful claim writes one Score row (see redeem route), so
    // reading from Score gives one history entry per claim — including old
    // claims that were previously merged into a single MissionClaim row.
    const rows = await prisma.score.findMany({
      where: {
        recipient_id: authUser.id,
        reviewer: REWARD_REVIEWER,
        assignment_title: { startsWith: REWARD_TITLE_PREFIX },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        assignment_title: true,
        score: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      claims: rows.map((r) => ({
        id: r.id,
        missionId: r.assignment_title.slice(REWARD_TITLE_PREFIX.length),
        points: r.score,
        month: r.createdAt.getMonth() + 1,
        year: r.createdAt.getFullYear(),
        claimedAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Claim history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}