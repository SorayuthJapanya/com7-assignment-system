import { resetUserScore } from "@/services/score-services";
import { AxiosErrorResponse } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import Swal from "sweetalert2";

export const useResetUserScore = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, AxiosError<AxiosErrorResponse>, { userId: string }>({
    mutationFn: ({ userId }) => resetUserScore(userId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      Swal.fire({
        icon: "success",
        title: res.message || "Score reset successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Reset score failed",
        text: error?.response?.data?.error || "Something went wrong",
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });
};
