import {
  createDailyReport,
  getMyDailyReports,
  getCalendarSummary,
  getDayDetail,
  reviewDailyReport,
} from "@/services/daily-report-services";
import { AxiosErrorResponse } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import Swal from "sweetalert2";

export const useCreateDailyReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDailyReport,
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ["daily-reports"], exact: false });
      Swal.fire({
        icon: "success",
        title: res.message || "Submitted!",
        text: "รายงานประจำวันของคุณถูกส่งเรียบร้อยแล้ว 😊",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error: AxiosError<AxiosErrorResponse>) => {
      Swal.fire({
        icon: "error",
        title: "Submit Failed",
        text: error?.response?.data?.error || "Something went wrong",
      });
    },
  });
};

export const useMyDailyReports = () => {
  return useQuery({
    queryKey: ["daily-reports", "me"],
    queryFn: getMyDailyReports,
  });
};

export const useCalendarSummary = (year: number, month: number) => {
  return useQuery({
    queryKey: ["daily-reports", "calendar", year, month],
    queryFn: () => getCalendarSummary(year, month),
  });
};

export const useDayDetail = (date: string | null) => {
  return useQuery({
    queryKey: ["daily-reports", "day", date],
    queryFn: () => getDayDetail(date as string),
    enabled: !!date,
  });
};

// ส่ง reviewedBy จากฝั่ง frontend โดยตรง (nickname ของ user ที่ login อยู่)
export const useReviewDailyReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { status: "Approved" | "Rejected"; feedback?: string; reviewedBy?: string };
    }) => reviewDailyReport(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["daily-reports"], exact: false });
      Swal.fire({
        icon: "success",
        title: "Updated",
        timer: 1200,
        showConfirmButton: false,
      });
    },
    onError: (error: AxiosError<AxiosErrorResponse>) => {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error?.response?.data?.error || "Something went wrong",
      });
    },
  });
};