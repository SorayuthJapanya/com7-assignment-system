import { axiosInstance } from "@/lib/axios";

export const resetUserScore = async (userId: string): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`/api/score/reset/${userId}`);
  return response.data;
};
