"use client";

import { useAuth } from "@/contexts/auth-context";
import ReportCalendar from "@/components/daily-report/admin/report-calendar";
import ReportForm from "@/components/daily-report/intern/report-form";
import MyReportHistory from "@/components/daily-report/intern/my-report-history";

export default function DailyReportPage() {
  const { isAdmin, isIntern, isLoading } = useAuth();

  if (isLoading) return null;

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

  if (isAdmin) {
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