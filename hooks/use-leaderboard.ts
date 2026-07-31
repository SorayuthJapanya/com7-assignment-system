import { getAdminLeaderboard, getPublicLeaderboard } from "@/services/leaderboard-services";
import { LeaderboardResponse } from "@/types/level";
import { useQuery } from "@tanstack/react-query";

/* กำหนด type สำหรับ params เพิ่มการรองรับ excludeRole */
interface LeaderboardParams {
  limit?: number;
  year?: number;
  month?: number;
  excludeRole?: string;
}

export const useAdminLeaderboard = (params?: LeaderboardParams) => {
  return useQuery<LeaderboardResponse>({
    queryKey: ["admin-leaderboard", params],
    queryFn: () => getAdminLeaderboard(params),
  });
};

export const usePublicLeaderboard = (params?: LeaderboardParams) => {
  return useQuery<LeaderboardResponse>({
    queryKey: ["public-leaderboard", params],
    queryFn: () => getPublicLeaderboard(params),
  });
};