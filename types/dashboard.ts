// Dashboard Types
export interface DashboardPeriod {
  year: number;
  month: number;
}

export interface UserAssignmentStatus {
  username: string;
  nickname: string;
  submitted: number;
  approved: number;
  rejected: number;
  pending: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  total: number;
  submitted: number;
  approved: number;
  rejected: number;
  lateSubmit: number;
}

export interface UserScoreSummary {
  username: string;
  nickname: string;
  totalScore: number;
  assignmentCount: number;
}

export interface ChartColors {
  submitted?: string;
  approved?: string;
  rejected?: string;
  pending?: string;
  total?: string;
  lateSubmit?: string;
  created?: string;
  totalScore?: string;
  assigned?: string;
  assignmentCount?: string;
}

export interface ChartData<T> {
  title: string;
  type: string;
  data: T[];
  colors?: ChartColors | string[];
}

export interface AdminChartsResponse {
  period: DashboardPeriod;
  charts: {
    userAssignmentStatus: ChartData<UserAssignmentStatus>;
    statusDistribution: ChartData<StatusDistribution>;
    monthlyTrend: ChartData<MonthlyTrend>;
    userScoreSummary: ChartData<UserScoreSummary>;
  };
}

export interface AdminDashboardKPIs {
  totalAssignments: number;
  totalSubmitted: number;
  totalApproved: number;
  averageScore: number;
}

export interface UserMonthlyTrend {
  month: string;
  assigned: number;
}

export interface UserStatusDistribution {
  status: string;
  value: number;
  percentage: number;
}

export interface UserDashboardKPIs {
  totalAssignments: number;
  totalApproved: number;
  totalRejected: number;
  totalScore: number;
}

export interface UserChartsResponse {
  period: DashboardPeriod & { userId: string };
  charts: {
    monthlyTrend: ChartData<UserMonthlyTrend>;
    statusDistribution: ChartData<UserStatusDistribution>;
  };
}

export interface UserDashboardResponse {
  role: "USER";
  period: DashboardPeriod & { userId: string };
  kpis: UserDashboardKPIs;
  charts: UserChartsResponse["charts"];
}

export interface AdminDashboardResponse {
  role: "SUPER_ADMIN";
  period: DashboardPeriod;
  kpis: AdminDashboardKPIs;
  charts: AdminChartsResponse["charts"];
}