import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorize } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    if (!dateStr) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    const targetDate = new Date(dateStr);

    // ดึง Intern ทั้งหมดในระบบ
    const interns = await prisma.user.findMany({
      where: { role: "INTERN" },
      select: { id: true, username: true, nickname: true, profileImage: true },
      orderBy: { nickname: "asc" },
    });

    // ดึงรายงานของวันนั้นทั้งหมด
    const reports = await prisma.dailyReport.findMany({
      where: { date: targetDate },
    });

    const reportMap = new Map(reports.map((r) => [r.userId, r]));

    const data = interns.map((intern) => ({
      userId: intern.id,
      username: intern.username,
      nickname: intern.nickname,
      profileImage: intern.profileImage,
      report: reportMap.get(intern.id) ?? null,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Get day detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}