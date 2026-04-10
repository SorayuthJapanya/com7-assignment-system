import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const levels = await prisma.level.findMany({
      orderBy: { minScore: "asc" },
    });

    return NextResponse.json(levels);
  } catch (error) {
    console.error("Get levels error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authUser = authResult.user!;
    if (authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied. Only Super Admin can manage levels." }, { status: 403 });
    }

    const body = await request.json();
    const { name, emoji, minScore, maxScore, color } = body;

    if (!name || !emoji || minScore === undefined || maxScore === undefined || !color) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (minScore < 0 || maxScore <= minScore) {
      return NextResponse.json({ error: "Invalid score range. maxScore must be greater than minScore." }, { status: 400 });
    }

    const overlapping = await prisma.level.findFirst({
      where: { minScore: { lte: maxScore }, maxScore: { gte: minScore } },
    });
    if (overlapping) {
      return NextResponse.json({ error: `Score range overlaps with existing level "${overlapping.name}" (${overlapping.minScore}–${overlapping.maxScore}).` }, { status: 400 });
    }

    const level = await prisma.level.create({
      data: {
        name,
        emoji,
        minScore: parseInt(minScore),
        maxScore: parseInt(maxScore),
        color,
      },
    });

    return NextResponse.json({ message: "Level created successfully", level }, { status: 201 });
  } catch (error) {
    console.error("Create level error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
