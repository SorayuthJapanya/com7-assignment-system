import {
  addUser,
  deleteUser,
  getUsers,
  login,
  logout,
  register,
  resetPassword,
  toggleUserVisibility,
  updateUser,
  uploadProfileImage,
} from "@/services/auth-services";
import { AxiosErrorResponse } from "@/types";
import {
  IUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateRequest,
  UpdateResponse,
} from "@/types/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import Swal from "sweetalert2";

export const useLogin = () => {
  return useMutation<
    LoginResponse,
    AxiosError<AxiosErrorResponse>,
    LoginRequest
  >({
    mutationFn: login,
    onSuccess: async (res) => {
      await Swal.fire({
        icon: "success",
        title: res.message,
        text: "Welcome back to COM7 Assignment System. 😊",
        timer: 2000,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error?.response?.data?.error || "Something went wrong",
      });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation<
    LoginResponse,
    AxiosError<AxiosErrorResponse>,
    RegisterRequest
  >({
    mutationFn: register,
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["public-leaderboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-leaderboard"] });

      await Swal.fire({
        icon: "success",
        title: res.message || "Registration Successful",
        text: "Welcome to COM7 Assignment System. 😊",
        timer: 2000,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error?.response?.data?.error || "Something went wrong",
      });
    },
  });
};

export const useLogout = () => {
  return useMutation<{ message: string }, AxiosError<AxiosErrorResponse>, void>(
    {
      mutationFn: logout,
      onSuccess: async (res) => {
        localStorage.removeItem("authUser");
        Swal.fire({
          icon: "success",
          title: res.message || "Logout Successful",
          text: "You have been logged out successfully. 😊",
          timer: 2000,
          showConfirmButton: false,
        });
      },
      onError: (error) => {
        Swal.fire({
          icon: "error",
          title: "Logout Failed",
          text: error?.response?.data?.error || "Something went wrong",
          timer: 2000,
          showConfirmButton: false,
        });
      },
    }
  );
};

export const useAddUser = () => {
  const queryClient = useQueryClient();
  return useMutation<
    LoginResponse,
    AxiosError<AxiosErrorResponse>,
    RegisterRequest
  >({
    mutationFn: addUser,
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["public-leaderboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-leaderboard"] });

      await Swal.fire({
        icon: "success",
        title: res.message || "Add User Successful",
        text: "The user has been added successfully. 😊",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Add user Failed",
        text: error?.response?.data?.error || "Something went wrong",
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });
};

export const useGetUsers = ({
  search,
  includeHidden,
  enabled = true,
}: {
  search?: string;
  includeHidden?: boolean;
  enabled?: boolean;
}) => {
  return useQuery<{ data: IUser[] }>({
    queryKey: ["users", search, includeHidden],
    queryFn: () => getUsers(search, includeHidden),
    enabled,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateResponse,
    AxiosError<AxiosErrorResponse>,
    { id: string; data: UpdateRequest }
  >({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: async (res) => {
      /* สั่งล้าง Cache ของทั้งระบบให้ดึงข้อมูลใหม่แบบเรียลไทม์ */
      await queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["public-leaderboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-leaderboard"] });

      Swal.fire({
        icon: "success",
        title: res.message || "User updated successfully",
        text: "The user has been updated successfully. 😊",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error?.response?.data?.error || "Something went wrong",
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });
};

export const useUploadProfileImage = () => {
  return useMutation<{ url: string }, AxiosError<AxiosErrorResponse>, File>({
    mutationFn: uploadProfileImage,
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation<
    {
      message: string;
    },
    AxiosError<AxiosErrorResponse>,
    { id: string }
  >({
    mutationFn: ({ id }) => deleteUser(id),
    onSuccess: async (res) => {
      /* สั่งล้าง Cache ของทั้งระบบให้ดึงข้อมูลใหม่แบบเรียลไทม์ */
      await queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["public-leaderboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-leaderboard"] });

      Swal.fire({
        icon: "success",
        title: res.message || "User deleted successfully",
        text: "The user has been deleted successfully. 😊",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: error?.response?.data?.error || "Something went wrong",
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });
};

export const useResetPassword = () => {
  return useMutation<
    { message: string },
    AxiosError<AxiosErrorResponse>,
    { username: string; newPassword: string }
  >({
    mutationFn: resetPassword,
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Reset Password Failed",
        text: error?.response?.data?.error || "Something went wrong",
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });
};

export const useToggleUserVisibility = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; data: IUser },
    AxiosError<AxiosErrorResponse>,
    { id: string }
  >({
    mutationFn: ({ id }) => toggleUserVisibility(id),
    onSuccess: async (res) => {
      /* สั่งล้าง Cache ของทั้งระบบ เพื่อให้หน้า Dashboard / Leaderboard อัปเดตทันทีเมื่อกดซ่อน */
      await queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["public-leaderboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-leaderboard"] });

      Swal.fire({
        icon: "success",
        title: res.message,
        timer: 1500,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Action Failed",
        text: error?.response?.data?.error || "Something went wrong",
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });
};