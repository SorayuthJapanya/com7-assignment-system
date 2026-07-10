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
    const year = parseInt(searchParams.get("year") || "");
    const month = parseInt(searchParams.get("month") || ""); // 1-12

    if (!year || !month) {
      return NextResponse.json({ error: "year and month are required" }, { status: 400 });
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1)); // วันแรกของเดือนถัดไป

    // จำนวน Intern ทั้งหมดในระบบ (ใช้เทียบว่าส่งครบหรือยัง)
    const totalInterns = await prisma.user.count({ where: { role: "INTERN" } });

    const reports = await prisma.dailyReport.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
        user: { role: "INTERN" },
      },
      select: { date: true, status: true },
    });

    // group by date (YYYY-MM-DD)
    const summaryMap = new Map<string, { submitted: number; approved: number; pending: number; rejected: number }>();

    for (const r of reports) {
      const key = r.date.toISOString().slice(0, 10);
      const entry = summaryMap.get(key) ?? { submitted: 0, approved: 0, pending: 0, rejected: 0 };
      entry.submitted += 1;
      if (r.status === "Approved") entry.approved += 1;
      if (r.status === "Pending") entry.pending += 1;
      if (r.status === "Rejected") entry.rejected += 1;
      summaryMap.set(key, entry);
    }

    const data = Array.from(summaryMap.entries()).map(([date, v]) => ({
      date,
      totalInterns,
      ...v,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Get calendar summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}