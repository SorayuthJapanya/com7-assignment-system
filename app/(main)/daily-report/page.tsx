"use client";

// 1. นำเข้า useAuthUser เพิ่มเข้ามา
import { useAuth, useAuthUser } from "@/contexts/auth-context"; 
import ReportCalendar from "@/components/daily-report/admin/report-calendar";
import ReportForm from "@/components/daily-report/intern/report-form";
import MyReportHistory from "@/components/daily-report/intern/my-report-history";
import { IUser } from "@/types/auth"; // ถ้าระบบมี Type ของ User ให้ดึงมาใช้ด้วยนะครับ

export default function DailyReportPage() {
  const { isAdmin, isIntern, isLoading } = useAuth();
  const authUser = useAuthUser() as IUser | null; // 2. ดึงข้อมูล User ปัจจุบันออกมา

  if (isLoading) return null;

  // เช็กว่า User คนนี้มี role เป็น STAFF หรือไม่
  const isStaff = authUser?.role === "STAFF"; 

  if (isIntern) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold">Daily Report</h1>
          <p className="text-sm text-muted-foreground">ส่งรายงานประจำวันของคุณ</p>
        </div>
        <ReportForm />
        <MyReportHistory />
      </div>
    );
  }

  // 3. ใช้ตัวแปร isStaff ที่เราเช็กจาก role ตรงๆ ได้เลย
  if (isAdmin || isStaff) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold">Daily Report — Overview</h1>
          <p className="text-sm text-muted-foreground">
            ภาพรวมการส่งรายงานประจำวันของ Intern ทั้งหมด
          </p>
        </div>
        <ReportCalendar />
      </div>
    );
  }

  return (
    <div className="p-6 text-center text-muted-foreground">
      คุณไม่มีสิทธิ์เข้าถึงหน้านี้
    </div>
  );
}