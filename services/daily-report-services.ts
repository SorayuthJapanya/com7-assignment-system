import { axiosInstance } from "@/lib/axios";
import {
  IDailyReport,
  CreateDailyReportRequest,
  ReviewDailyReportRequest,
  CalendarDaySummary,
  DayDetailIntern,
} from "@/types/daily-report";

// ── Intern: ส่งรายงานประจำวัน ─────────────────────────────
export const createDailyReport = async (
  data: CreateDailyReportRequest,
): Promise<{ message: string; data: IDailyReport }> => {
  const response = await axiosInstance.post("/api/daily-report", data);
  return response.data;
};

// ── Intern: ดูประวัติของตัวเอง ────────────────────────────
export const getMyDailyReports = async (): Promise<{ data: IDailyReport[] }> => {
  const response = await axiosInstance.get("/api/daily-report", {
    params: { myReports: true },
  });
  return response.data;
};

// ── Admin: สรุปรายเดือนสำหรับวาดปฏิทิน ────────────────────
export const getCalendarSummary = async (
  year: number,
  month: number, // 1-12
): Promise<{ data: CalendarDaySummary[] }> => {
  const response = await axiosInstance.get("/api/daily-report/calendar", {
    params: { year, month },
  });
  return response.data;
};

// ── Admin: รายละเอียดของวันที่เลือก ───────────────────────
export const getDayDetail = async (
  date: string, // YYYY-MM-DD
): Promise<{ data: DayDetailIntern[] }> => {
  const response = await axiosInstance.get("/api/daily-report/day", {
    params: { date },
  });
  return response.data;
};

// ── Admin: อนุมัติ / ตีกลับรายงาน ──────────────────────────
export const reviewDailyReport = async (
  id: string,
  data: ReviewDailyReportRequest,
): Promise<{ message: string; data: IDailyReport }> => {
  const response = await axiosInstance.patch(`/api/daily-report/${id}`, data);
  return response.data;
};