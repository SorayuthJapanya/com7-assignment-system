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
    // 💡 1. ดึง username ออกมารับค่าจากหน้าบ้านเพิ่มตรงนี้
    const { username, nickname, email, role, profileImage } = body;

    // Validate input
    // 💡 2. เพิ่ม username เข้าไปในเงื่อนไขตรวจสอบ Validation
    if (!username && !nickname && !email && !role && !profileImage) {
      return NextResponse.json(
        {
          error: "At least one field (username, nickname, email, role, or profileImage) must be provided",
        },
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

    const targetUserId = (await params).id;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, role: true, username: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cannot change another user if you are not SUPER_ADMIN
    if (existingUser.id !== authUser.id && authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Cannot change other user if you are not SUPER_ADMIN" },
        { status: 403 },
      );
    }

    // 💡 3. ตรวจสอบเงื่อนไขหากมีการเปลี่ยน Username ว่าซ้ำกับคนอื่นในระบบไหม
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username },
      });
      if (usernameExists) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 },
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        // 💡 4. เพิ่มคำสั่งบันทึกฟิลด์ username ลงฐานข้อมูล
        ...(username && { username }),
        ...(nickname && { nickname }),
        ...(email && { email }),
        ...(role && { role: role as "SUPER_ADMIN" | "STAFF" }),
        ...(profileImage && { profileImage }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        role: true,
        profileImage: true,
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