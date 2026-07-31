import { isAuthorize } from "@/lib/middleware";
import { resetBonusCycle, getBonusCycleInfo, clearRankSnapshot } from "@/lib/bonus-cycle";
import { NextRequest, NextResponse } from "next/server";

// GET: ดูข้อมูลรอบปัจจุบัน (เริ่มนับตั้งแต่เมื่อไหร่ ใครกด reset ล่าสุด)
export async function GET(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const info = await getBonusCycleInfo();
    return NextResponse.json(info);
  } catch (error) {
    console.error("Get bonus cycle info error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: รีเซ็ตรอบคะแนน — เฉพาะ SUPER_ADMIN เท่านั้น
export async function POST(request: NextRequest) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authUser = authResult.user!;
    if (authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "เฉพาะ Super Admin เท่านั้นที่สามารถรีเซ็ต Leaderboard ได้" },
        { status: 403 },
      );
    }

    const newCycleStart = await resetBonusCycle(authUser.id);
    await clearRankSnapshot(); // เริ่มนับ trend (▲▼) ใหม่พร้อมกับคะแนน

    return NextResponse.json({
      message: "รีเซ็ต Bonus Leaderboard สำเร็จ ข้อมูลเดิมทั้งหมดยังอยู่ครบ เริ่มนับคะแนนใหม่จากตอนนี้",
      cycleStart: newCycleStart,
    });
  } catch (error) {
    console.error("Bonus reset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}