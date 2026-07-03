import { axiosInstance } from "@/lib/axios";
import {
  CreateAssignment,
  GetAssignmentsResponse,
  GetAssignmentResponse,
  IFilteredAssignment,
  ReviewAssignmentRequest,
  SubmissionAssignmentResponse,
  UpdateAssignmentRequest,
} from "@/types/assignment";

export const getAssignments = async ({
  search,
  page,
  limit,
  myAssignments,
  status,
  type,
  username,
  deadlineMonth,
  deadlineFrom,
  deadlineTo,
}: IFilteredAssignment): Promise<GetAssignmentsResponse> => {
  const response = await axiosInstance.get("/api/assignment", {
    params: {
      search,
      page,
      limit,
      myAssignments,
      status,
      type,
      username,
      deadlineMonth,
      deadlineFrom,
      deadlineTo,
    },
  });

  return response.data;
};

export const createAssignment = async (
  data: CreateAssignment,
): Promise<{ message: string }> => {
  const response = await axiosInstance.post("/api/assignment", data);
  return response.data;
};

export const getAssignment = async (
  id: string,
): Promise<GetAssignmentResponse> => {
  const response = await axiosInstance.get(`/api/assignment/${id}`);
  return response.data;
};

export const submissionAssignment = async (
  id: string,
  file: File | null,
): Promise<SubmissionAssignmentResponse> => {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  const response = await axiosInstance.put(
    `/api/assignment/submission/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const reviewAssignment = async (
  id: string,
  data: ReviewAssignmentRequest,
): Promise<{ message: string }> => {
  const response = await axiosInstance.put(
    `/api/assignment/review/${id}`,
    data,
  );
  return response.data;
};

export const updateAssignment = async (
  id: string,
  data: UpdateAssignmentRequest,
): Promise<{ message: string }> => {
  const response = await axiosInstance.put(`/api/assignment/${id}`, data);
  return response.data;
};

export const deleteAssignment = async (
  id: string,
): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`/api/assignment/${id}`);
  return response.data;
};

export const rebuildAssignment = async (
  id: string,
  deadline: Date,
): Promise<{ message: string }> => {
  const response = await axiosInstance.post(`/api/assignment/${id}/rebuild`, { deadline });
  return response.data;
};
