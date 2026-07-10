"use client";

import { useMemo, useState } from "react";
import { useCalendarSummary } from "@/hooks/use-daily-report";
import { ChevronLeft, ChevronRight, Users, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import DayDetailDialog from "./day-detail-dialog";
import type { CalendarDaySummary } from "@/types/daily-report";

interface DaySummary {
  date: string;
  totalInterns: number;
  submitted: number;
  approved: number; 
  rejected: number;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ReportCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data, isLoading } = useCalendarSummary(year, month);

  const summaryMap = useMemo(() => {
    const map = new Map<string, DaySummary>();
    const list: DaySummary[] = data?.data ?? [];
    list.forEach((d) => map.set(d.date, d));
    return map;
  }, [data]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  const goPrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const formatDateKey = (day: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isToday = (day: number) => {
    const d = new Date(year, month - 1, day);
    return d.toDateString() === today.toDateString();
  };

  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goNextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="size-3 text-green-500" /> Approved
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3 text-yellow-500" /> Pending
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="size-3 text-red-500" /> Rejected
        </span>
        <span className="flex items-center gap-1">
          <Users className="size-3" /> Total Interns
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center text-xs font-semibold text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }

          const dateKey = formatDateKey(day);
          const summary = summaryMap.get(dateKey);
          const total = summary?.totalInterns ?? 0;
          const approvedCount = summary?.approved ?? 0;
          const submittedCount = summary?.submitted ?? 0;
          const rejectedCount = summary?.rejected ?? 0;

          // LOGIC เช็กสีตามเงื่อนไขใหม่ของคุณ
          let statusBadgeClass = "bg-yellow-100 text-yellow-700"; // ค่าเริ่มต้น: เหลือง (ยังส่งหรือตรวจไม่ครบ)

          if (total > 0) {
            if (approvedCount === total) {
              statusBadgeClass = "bg-green-100 text-green-700"; // ส่งครบและ Approved หมดทุกคน = เขียว
            } else if (submittedCount === total && rejectedCount > 0) {
              statusBadgeClass = "bg-red-100 text-red-700"; // ส่งครบทุกคนแล้ว แต่มีคนโดน Rejected = แดง
            }
          }

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(dateKey)}
              className={`aspect-square rounded-lg border p-1.5 flex flex-col items-start justify-between text-left transition-colors hover:border-primary hover:bg-primary/5 ${
                isToday(day) ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <span className={`text-xs font-semibold ${isToday(day) ? "text-primary" : ""}`}>
                {day}
              </span>

              {summary && (
                <div className="flex flex-col gap-0.5 w-full">
                  <span className={`text-[10px] font-bold rounded px-1 text-center ${statusBadgeClass}`}>
                    {approvedCount}/{total}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <p className="text-center text-sm text-muted-foreground mt-4">Loading...</p>
      )}

      <DayDetailDialog
        date={selectedDate}
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  );
}