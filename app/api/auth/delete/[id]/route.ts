import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorize } from "@/lib/middleware";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // isAuthorize
    const authResult = await isAuthorize(request);

    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authUser = authResult.user!; // We know user exists if error is null

    // Check if user is SUPER_ADMIN
    if (authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Only SUPER_ADMIN can delete users." },
        { status: 403 },
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: (await params).id },
      select: { id: true, role: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    // Prevent SUPER_ADMIN from deleting themselves
    if (existingUser.id === authUser.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 403 },
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
