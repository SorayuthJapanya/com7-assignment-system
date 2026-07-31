import { axiosInstance } from "@/lib/axios";
import {
  MissionQuestResponse,
  MissionQuestParams,
  RedeemMissionRequest,
  RedeemMissionResponse,
} from "@/types/mission-quest";

export const getMissionQuest = async (
  params?: MissionQuestParams,
): Promise<MissionQuestResponse> => {
  const response = await axiosInstance.get("/api/mission-quest", { params });
  return response.data;
};

export const redeemMission = async (
  payload: RedeemMissionRequest,
): Promise<RedeemMissionResponse> => {
  const response = await axiosInstance.post(
    "/api/mission-quest/redeem",
    payload,
  );
  return response.data;
};