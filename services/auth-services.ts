import { axiosInstance } from "@/lib/axios";
import {
  IUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateRequest,
  UpdateResponse,
} from "@/types/auth";

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>(
    "/api/auth/login",
    data,
    {
      headers: { Authorization: "" } // 🎯 พิมพ์เพิ่ม: สั่งล้าง Token เก่าทิ้งเฉพาะ Request นี้
    }
  );
  return response.data;
};

export const register = async (
  data: RegisterRequest,
): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>(
    "/api/auth/register",
    data,
    {
      headers: { Authorization: "" } // 🎯 พิมพ์เพิ่ม: สั่งล้าง Token เก่าทิ้งเฉพาะ Request นี้
    }
  );
  return response.data;
};

export const logout = async (): Promise<{ message: string }> => {
  const response = await axiosInstance.post<{ message: string }>(
    "/api/auth/logout",
  );
  return response.data;
};

export const addUser = async (
  data: RegisterRequest,
): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>(
    "/api/auth",
    data,
  );
  return response.data;
};

export const getUsers = async (search?: string): Promise<{ data: IUser[] }> => {
  const response = await axiosInstance.get("/api/auth/get-users", {
    params: { search },
  });
  return response.data;
};

export const updateUser = async (
  id: string,
  data: UpdateRequest,
): Promise<UpdateResponse> => {
  const response = await axiosInstance.put<UpdateResponse>(
    `/api/auth/update/${id}`,
    data,
  );
  return response.data;
};

export const uploadProfileImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post<{ url: string }>(
    "/api/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
};

export const deleteUser = async (id: string): Promise<{ message: string }> => {
  const response = await axiosInstance.delete<{ message: string }>(
    `/api/auth/delete/${id}`,
  );
  return response.data;
};

export const resetPassword = async (data: {
  username: string;
  newPassword: string;
}): Promise<{ message: string }> => {
  const response = await axiosInstance.post<{ message: string }>(
    "/api/auth/reset-password",
    data,
  );
  return response.data;
};