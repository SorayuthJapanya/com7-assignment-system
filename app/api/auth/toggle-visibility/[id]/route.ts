import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorize } from "@/lib/middleware";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, 
) {
  try {
    const authResult = await isAuthorize(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const userRole = authResult.user?.role;
    if (!userRole || !["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json(
        { error: "You do not have permission to perform this action" },
        { status: 403 },
      );
    }

    const { id } = await params; // 👈 เพิ่ม await

    if (authResult.user?.id === id) {
      return NextResponse.json(
        { error: "Cannot hide your own account" },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isHidden: !targetUser.isHidden,
        hiddenAt: !targetUser.isHidden ? new Date() : null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        role: true,
        isHidden: true,
        hiddenAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: updated.isHidden
        ? `User "${updated.username}" has been hidden`
        : `User "${updated.username}" is now visible`,
      data: updated,
    });
  } catch (error) {
    console.error("Toggle user visibility error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}