import { login, logout, register } from "@/services/auth-services";
import { AxiosErrorResponse } from "@/types";
import { LoginRequest, LoginResponse, RegisterRequest } from "@/types/auth";
import { useMutation } from "@tanstack/react-query";
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
        text: error?.response?.data?.message || "Something went wrong",
      });
    },
  });
};

export const useRegister = () => {
  return useMutation<
    LoginResponse,
    AxiosError<AxiosErrorResponse>,
    RegisterRequest
  >({
    mutationFn: register,
    onSuccess: async (res) => {
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
        text: error?.response?.data?.message || "Something went wrong",
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
          text: error?.response?.data?.message || "Something went wrong",
          timer: 2000,
          showConfirmButton: false,
        });
      },
    },
  );
};
