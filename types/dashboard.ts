// Dashboard Types
export interface DashboardPeriod {
  year?: number | null;
  month?: number | null;
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
  approved: number;
}

export interface AverageScoreByMonth {
  month: string;
  averageScore: number;
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
  averageScore?: string;
  score?: string;
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
    averageScoreByMonth: ChartData<AverageScoreByMonth>;
    userScoreSummary: ChartData<UserScoreSummary>;
  };
}

export interface AdminDashboardKPIs {
  totalAssignments: number;
  totalSubmitted: number;
  totalApproved: number;
  averageScore: number;
  lateSubmissions: number;
}

export interface UserMonthlyTrend {
  month: string;
  assigned: number;
}

export interface UserStatusDistribution {
  name: string;
  value: number;
  percentage: number;
}

export interface UserScoreByMonth {
  month: string;
  score: number;
}

export interface UserDashboardKPIs {
  totalAssignments: number;
  totalApproved: number;
  totalRejected: number;
  totalScore: number;
  avgScore: number;
}

export interface UserChartsResponse {
  period: DashboardPeriod & { userId: string };
  charts: {
    monthlyTrend: ChartData<UserMonthlyTrend>;
    statusDistribution: ChartData<UserStatusDistribution>;
    scoreByMonth: ChartData<UserScoreByMonth>;
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