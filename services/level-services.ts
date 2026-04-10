import { axiosInstance } from "@/lib/axios";
import { ILevel, CreateLevelRequest, UpdateLevelRequest } from "@/types/level";

export const getLevels = async (): Promise<ILevel[]> => {
  const response = await axiosInstance.get("/api/level");
  return response.data;
};

export const createLevel = async (data: CreateLevelRequest): Promise<{ message: string; level: ILevel }> => {
  const response = await axiosInstance.post("/api/level", data);
  return response.data;
};

export const updateLevel = async (id: string, data: UpdateLevelRequest): Promise<{ message: string; level: ILevel }> => {
  const response = await axiosInstance.put(`/api/level/${id}`, data);
  return response.data;
};

export const deleteLevel = async (id: string): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`/api/level/${id}`);
  return response.data;
};
