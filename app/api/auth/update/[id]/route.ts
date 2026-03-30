import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorize } from "@/lib/middleware";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // isAuthorize
    const authResult = await isAuthorize(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const authUser = authResult.user!;

    // Get request body
    const body = await request.json();
    const { nickname, email, role } = body;

    // Validate input
    if (!nickname && !role) {
      return NextResponse.json(
        { error: "At least one field (nickname or role) must be provided" },
        { status: 400 },
      );
    }

    // Validate role if provided
    if (role && !["SUPER_ADMIN", "ADMIN", "STAFF"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be SUPER_ADMIN, ADMIN or STAFF" },
        { status: 400 },
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: (await params).id },
      select: { id: true, email: true, role: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cannot change other user if you are not SUPER_ADMIN
    if (existingUser.id === authUser.id && authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Cannot change other user if you are not SUPER_ADMIN" },
        { status: 403 },
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: (await params).id },
      data: {
        ...(nickname && { nickname }),
        ...(email && { email }),
        ...(role && { role: role as "SUPER_ADMIN" | "STAFF" }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
