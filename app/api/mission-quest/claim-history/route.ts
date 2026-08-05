import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

    const claims = await prisma.missionClaim.findMany({
      where: { userId: authUser.id },
      orderBy: { claimedAt: "desc" },
      take: 100,
      select: {
        id: true,
        missionId: true,
        points: true,
        month: true,
        year: true,
        claimedAt: true,
      },
    });

    return NextResponse.json({
      claims: claims.map((c) => ({
        id: c.id,
        missionId: c.missionId,
        points: c.points,
        month: c.month,
        year: c.year,
        claimedAt: c.claimedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Claim history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}