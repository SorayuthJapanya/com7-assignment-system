import { axiosInstance } from "@/lib/axios";
import { LeaderboardResponse } from "@/types/level";

export const getAdminLeaderboard = async (params?: {
  limit?: number;
  year?: number;
  month?: number;
}): Promise<LeaderboardResponse> => {
  const response = await axiosInstance.get("/api/leaderboard", { params });
  return response.data;
};

export const getPublicLeaderboard = async (params?: {
  limit?: number;
  year?: number;
  month?: number;
}): Promise<LeaderboardResponse> => {
  const response = await axiosInstance.get("/api/leaderboard/public", { params });
  return response.data;
};
