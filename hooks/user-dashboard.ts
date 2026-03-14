import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardData, getUserDashboardData } from "@/services/dashboard-services";
import { DashboardPeriod } from "@/types/dashboard";

export function useAdminDashboard({ year, month }: DashboardPeriod) {
  return useQuery({
    queryKey: ["admin-dashboard", year, month],
    queryFn: () => getAdminDashboardData({ year, month }),
  });
}

export function useUserDashboard({ year, month }: DashboardPeriod) {
  return useQuery({
    queryKey: ["user-dashboard", year, month],
    queryFn: () => getUserDashboardData({ year, month }),
  });
}
