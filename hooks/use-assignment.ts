import {
  createAssignment,
  deleteAssignment,
  getAssignment,
  getAssignments,
  reviewAssignment,
  submissionAssignment,
} from "@/services/assignment-services";
import { AxiosErrorResponse } from "@/types";
import {
  CreateAssignment,
  GetAssignmentResponse,
  GetAssignmentsResponse,
  IFilteredAssignment,
  ReviewAssignmentRequest,
} from "@/types/assignment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import Swal from "sweetalert2";

export const useGetAssignments = ({
  search,
  limit,
  myAssignments,
  page,
  status,
  type,
}: IFilteredAssignment) => {
  return useQuery<GetAssignmentsResponse>({
    queryKey: ["assignment", search, limit, myAssignments, page, status, type],
    queryFn: () =>
      getAssignments({ search, limit, myAssignments, page, status, type }),
  });
};

export const useGetAssignment = ({ id }: { id: string }) => {
  return useQuery<GetAssignmentResponse>({
    queryKey: ["assignment", id],
    queryFn: () => getAssignment(id),
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string },
    AxiosError<AxiosErrorResponse>,
    CreateAssignment
  >({
    mutationFn: createAssignment,
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["assignment"],
      });
      Swal.fire({
        icon: "success",
        title: res.message || "Assignment created successfully",
        text: "You have successfully created an assignment. 😊",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Assignment creation failed",
        text: error?.response?.data?.message || "Something went wrong",
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });
};

export const useReviewAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation<
    {
      message: string;
    },
    AxiosError<AxiosErrorResponse>,
    {
      id: string;
      data: ReviewAssignmentRequest;
    }
  >({
    mutationFn: ({ id, data }) => reviewAssignment(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["assignment"],
      });
      Swal.fire({
        icon: "success",
        title: res.message || "Assignment reviewed successfully",
        text: "You have successfully reviewed an assignment. 😊",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Assignment review failed",
        text: error?.response?.data?.message || "Something went wrong",
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });
};

export const useSubmissionAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation<
    {
      message: string;
    },
    AxiosError<AxiosErrorResponse>,
    {
      id: string;
      file: File;
    }
  >({
    mutationFn: ({ id, file }) => submissionAssignment(id, file),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["assignment"],
      });
      Swal.fire({
        icon: "success",
        title: res.message || "Assignment submitted successfully",
        text: "You have successfully submitted an assignment. 😊",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Assignment submission failed",
        text: error?.response?.data?.message || "Something went wrong",
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation<
    {
      message: string;
    },
    AxiosError<AxiosErrorResponse>,
    { id: string }
  >({
    mutationFn: ({ id }) => deleteAssignment(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["assignment"],
      });
      Swal.fire({
        icon: "success",
        title: res.message || "Assignment deleted successfully",
        text: "You have successfully deleted an assignment. 😊",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Assignment deletion failed",
        text: error?.response?.data?.message || "Something went wrong",
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });
};
