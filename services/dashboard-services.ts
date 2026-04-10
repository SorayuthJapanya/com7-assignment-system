import { DashboardPeriod } from "@/types/dashboard";
import { AdminDashboardResponse, UserDashboardResponse } from "@/types/dashboard";

function buildParams(year?: number | null, month?: number | null): string {
  const params = new URLSearchParams();
  if (year != null) params.set("year", year.toString());
  if (month != null) params.set("month", month.toString());
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const getAdminDashboardData = async ({ year, month }: DashboardPeriod): Promise<AdminDashboardResponse> => {
  const response = await fetch(`/api/assignment/dashboard/admin${buildParams(year, month)}`);
  return response.json();
};

export const getUserDashboardData = async ({ year, month }: DashboardPeriod): Promise<UserDashboardResponse> => {
  const response = await fetch(`/api/assignment/dashboard/user${buildParams(year, month)}`);
  return response.json();
};