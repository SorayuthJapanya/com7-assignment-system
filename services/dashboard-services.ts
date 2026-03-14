import { DashboardPeriod } from "@/types/dashboard";
import { AdminDashboardResponse, UserDashboardResponse } from "@/types/dashboard";

export const getAdminDashboardData = async ({year, month}: DashboardPeriod): Promise<AdminDashboardResponse> => {
  const response = await fetch(`/api/assignment/dashboard/admin?year=${year}&month=${month}`);
  return response.json();
};

export const getUserDashboardData = async ({year, month}: DashboardPeriod): Promise<UserDashboardResponse> => {
  const response = await fetch(`/api/assignment/dashboard/user?year=${year}&month=${month}`);
  return response.json();
};