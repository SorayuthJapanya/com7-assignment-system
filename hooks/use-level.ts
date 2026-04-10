import { createLevel, deleteLevel, getLevels, updateLevel } from "@/services/level-services";
import { AxiosErrorResponse } from "@/types";
import { CreateLevelRequest, ILevel, UpdateLevelRequest } from "@/types/level";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import Swal from "sweetalert2";

export const useGetLevels = () => {
  return useQuery<ILevel[]>({
    queryKey: ["levels"],
    queryFn: getLevels,
  });
};

export const useCreateLevel = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; level: ILevel },
    AxiosError<AxiosErrorResponse>,
    CreateLevelRequest
  >({
    mutationFn: createLevel,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["levels"] });
      Swal.fire({
        icon: "success",
        title: res.message || "Level created successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Failed to create level",
        text: error?.response?.data?.error || "Something went wrong",
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });
};

export const useUpdateLevel = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; level: ILevel },
    AxiosError<AxiosErrorResponse>,
    { id: string; data: UpdateLevelRequest }
  >({
    mutationFn: ({ id, data }) => updateLevel(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["levels"] });
      Swal.fire({
        icon: "success",
        title: res.message || "Level updated successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Failed to update level",
        text: error?.response?.data?.error || "Something went wrong",
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });
};

export const useDeleteLevel = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string },
    AxiosError<AxiosErrorResponse>,
    { id: string }
  >({
    mutationFn: ({ id }) => deleteLevel(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["levels"] });
      Swal.fire({
        icon: "success",
        title: res.message || "Level deleted successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Failed to delete level",
        text: error?.response?.data?.error || "Something went wrong",
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });
};
