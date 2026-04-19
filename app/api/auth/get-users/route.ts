import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorize } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const whereClause = search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { nickname: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        role: true,
        resetAt: true,
        createdAt: true,
        scores: {
          select: { score: true, createdAt: true },
        },
      },
    });

    const data = users.map(({ scores, resetAt, ...user }) => ({
      ...user,
      totalScore: scores
        .filter((s) => !resetAt || s.createdAt > resetAt)
        .reduce((sum, s) => sum + s.score, 0),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
