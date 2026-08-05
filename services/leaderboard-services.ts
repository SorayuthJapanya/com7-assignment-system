import { axiosInstance } from "@/lib/axios";
import {
  LeaderboardResponse,
  RedeemStatus,
  RedeemOverdueRequest,
  RedeemOverdueResponse,
  RedeemNegativeRequest,
  RedeemNegativeResponse,
} from "@/types/level";

interface LeaderboardParams {
  limit?: number;
  year?: number;
  month?: number;
  excludeRole?: string;
}

export const getAdminLeaderboard = async (
  params?: LeaderboardParams
): Promise<LeaderboardResponse> => {
  const response = await axiosInstance.get("/api/leaderboard", { params });
  return response.data;
};

export const getPublicLeaderboard = async (
  params?: LeaderboardParams
): Promise<LeaderboardResponse> => {
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

export const redeemNegativePoints = async (
  payload: RedeemNegativeRequest
): Promise<RedeemNegativeResponse> => {
  const response = await axiosInstance.post("/api/leaderboard/redeem-negative", payload);
  return response.data;
};