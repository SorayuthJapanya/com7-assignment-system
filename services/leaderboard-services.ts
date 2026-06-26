import { axiosInstance } from "@/lib/axios";
import {
  LeaderboardResponse,
  RedeemStatus,
  RedeemOverdueRequest,
  RedeemOverdueResponse,
} from "@/types/level";

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

export const getRedeemStatus = async (): Promise<RedeemStatus> => {
  const response = await axiosInstance.get("/api/leaderboard/redeem-overdue");
  return response.data;
};
 
export const redeemOverdue = async (
  payload: RedeemOverdueRequest
): Promise<RedeemOverdueResponse> => {
  const response = await axiosInstance.post("/api/leaderboard/redeem-overdue", payload);
  return response.data;
};