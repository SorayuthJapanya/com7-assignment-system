import { isAuthorize } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await isAuthorize(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const authUser = authResult.user!;

    if (authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only Super Admin can reset scores" },
        { status: 403 }
      );
    }

    const { userId } = await params;

    await prisma.user.update({
      where: { id: userId },
      data: { resetAt: new Date() },
    });

    return NextResponse.json({ message: "Score reset successfully" });
  } catch (error) {
    console.error("Reset score error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
