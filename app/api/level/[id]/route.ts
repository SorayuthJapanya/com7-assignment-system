import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authUser = authResult.user!;
    if (authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied. Only Super Admin can manage levels." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, emoji, minScore, maxScore, color } = body;

    const existing = await prisma.level.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    const resolvedMin = minScore !== undefined ? parseInt(minScore) : existing.minScore;
    const resolvedMax = maxScore !== undefined ? parseInt(maxScore) : existing.maxScore;

    if (resolvedMax <= resolvedMin) {
      return NextResponse.json({ error: "maxScore must be greater than minScore." }, { status: 400 });
    }

    const overlapping = await prisma.level.findFirst({
      where: {
        id: { not: id },
        minScore: { lte: resolvedMax },
        maxScore: { gte: resolvedMin },
      },
    });
    if (overlapping) {
      return NextResponse.json({ error: `Score range overlaps with existing level "${overlapping.name}" (${overlapping.minScore}–${overlapping.maxScore}).` }, { status: 400 });
    }

    const level = await prisma.level.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(emoji !== undefined && { emoji }),
        ...(minScore !== undefined && { minScore: resolvedMin }),
        ...(maxScore !== undefined && { maxScore: resolvedMax }),
        ...(color !== undefined && { color }),
      },
    });

    return NextResponse.json({ message: "Level updated successfully", level });
  } catch (error) {
    console.error("Update level error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authUser = authResult.user!;
    if (authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied. Only Super Admin can manage levels." }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.level.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    await prisma.level.delete({ where: { id } });

    return NextResponse.json({ message: "Level deleted successfully" });
  } catch (error) {
    console.error("Delete level error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
