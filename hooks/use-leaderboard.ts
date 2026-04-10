import { getAdminLeaderboard, getPublicLeaderboard } from "@/services/leaderboard-services";
import { LeaderboardResponse } from "@/types/level";
import { useQuery } from "@tanstack/react-query";

export const useAdminLeaderboard = (params?: { limit?: number; year?: number; month?: number }) => {
  return useQuery<LeaderboardResponse>({
    queryKey: ["admin-leaderboard", params],
    queryFn: () => getAdminLeaderboard(params),
  });
};

export const usePublicLeaderboard = (params?: { limit?: number; year?: number; month?: number }) => {
  return useQuery<LeaderboardResponse>({
    queryKey: ["public-leaderboard", params],
    queryFn: () => getPublicLeaderboard(params),
  });
};
