import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ดึงผ่านตัวแปรกลางที่ไปอัปเดตไฟล์ต้นทางแล้ว
import { isAuthorize } from "@/lib/middleware";

// PATCH: Admin/SuperAdmin/Staff อนุมัติหรือตีกลับรายงาน
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const authUser = authResult.user!;

    // ADMIN / SUPER_ADMIN / STAFF ตรวจงานได้
    if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(authUser.role)) {
      return NextResponse.json(
        { error: "Only ADMIN, SUPER_ADMIN or STAFF can review reports" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, feedback } = body;

    if (!["Approved", "Rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be Approved or Rejected" },
        { status: 400 },
      );
    }

    const existing = await prisma.dailyReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const updated = await prisma.dailyReport.update({
      where: { id },
      data: {
        status,
        feedback: feedback ?? "",
        // เก็บ username ของผู้ตรวจ ไม่ใช่ UUID เพื่อให้แสดงผลได้ตรงๆ โดยไม่ต้อง join ทีหลัง
        reviewedBy: authUser.username,
        // ไม่ต้องเพิ่ม field ใหม่ — ใช้ updatedAt ที่ Prisma อัปเดตให้อัตโนมัติทุกครั้งที่ update record นี้
        // (PATCH endpoint นี้เป็นจุดเดียวที่แก้ record หลังสร้าง จึงใช้แทน "เวลาที่ตรวจ" ได้อย่างแม่นยำ)
      },
      include: {
        user: { select: { id: true, username: true, nickname: true, profileImage: true } },
      },
    });

    return NextResponse.json({ message: "Report reviewed successfully", data: updated });
  } catch (error) {
    console.error("Review daily report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: ลบรายงาน (เผื่อ intern อยากลบของตัวเอง หรือ admin ลบ)
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
    const { id } = await params;

    const existing = await prisma.dailyReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const canDelete =
      existing.userId === authUser.id || ["ADMIN", "SUPER_ADMIN"].includes(authUser.role);

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.dailyReport.delete({ where: { id } });

    return NextResponse.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete daily report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}