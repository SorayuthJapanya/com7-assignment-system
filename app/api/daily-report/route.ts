import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorize } from "@/lib/middleware";

// GET: Intern ดูประวัติของตัวเอง / Admin ดูทั้งหมด (query ?myReports=true)
export async function GET(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const authUser = authResult.user!;
    const { searchParams } = new URL(request.url);
    const myReports = searchParams.get("myReports") === "true";

    const where = myReports ? { userId: authUser.id } : {};

    const reports = await prisma.dailyReport.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        user: {
          select: { id: true, username: true, nickname: true, profileImage: true },
        },
      },
    });

    return NextResponse.json({ data: reports });
  } catch (error) {
    console.error("Get daily report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Intern ส่งรายงานประจำวัน (1 คน 1 วัน)
export async function POST(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const authUser = authResult.user!;

    const body = await request.json();
    const { date, description, imageUrl } = body;

    if (!date || !description) {
      return NextResponse.json(
        { error: "date and description are required" },
        { status: 400 },
      );
    }

    const reportDate = new Date(date);

    // upsert: ถ้าวันนั้นเคยส่งแล้ว ให้แก้ไขแทนการสร้างซ้ำ
    const report = await prisma.dailyReport.upsert({
      where: {
        userId_date: { userId: authUser.id, date: reportDate },
      },
      update: {
        description,
        imageUrl: imageUrl || null,
        status: "Pending", // ส่งใหม่ให้กลับไปรอตรวจอีกครั้ง
        feedback: "",
      },
      create: {
        userId: authUser.id,
        date: reportDate,
        description,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({
      message: "Daily report submitted successfully",
      data: report,
    });
  } catch (error) {
    console.error("Create daily report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}