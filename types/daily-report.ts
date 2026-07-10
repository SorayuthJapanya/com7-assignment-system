export type ReportStatus = "Pending" | "Approved" | "Rejected";

export interface IDailyReport {
  id: string;
  userId: string;
  date: string;
  description: string;
  imageUrl?: string | null;
  status: ReportStatus;
  reviewedBy?: string | null;
  feedback: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    nickname: string;
    profileImage?: string | null;
  };
}

export interface CreateDailyReportRequest {
  date: string; // YYYY-MM-DD
  description: string;
  imageUrl?: string;
}

export interface ReviewDailyReportRequest {
  status: ReportStatus;
  feedback?: string;
  reviewedBy?: string;
}

// สรุปรายวันสำหรับวาดปฏิทิน (Admin)
export interface CalendarDaySummary {
  date: string; // YYYY-MM-DD
  totalInterns: number;
  submitted: number;
  approved: number;
  pending: number;
  rejected: number;
}

// รายละเอียดของวันที่เลือก (Admin เปิด modal)
export interface DayDetailIntern {
  userId: string;
  username: string;
  nickname: string;
  profileImage?: string | null;
  report: IDailyReport | null; // null = ยังไม่ส่ง
}