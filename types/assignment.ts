import { IPagination } from ".";

export interface IFilteredAssignment {
  search?: string;
  page?: number;
  limit?: number;
  myAssignments?: boolean;
  status?: "not-submit" | "Pending" | "Approved" | "Rejected" | "all";
  type?: "Individual" | "Group" | "all";
  username?: string;
  deadlineMonth?: string;
}

export interface IAssignment {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: "Individual" | "Group";
  createdBy: string;
  assignTo: string;
  members: string[];
  reward: number;
  deadline: Date;
  submissionUrl: string;
  submitAt: Date;
  feedback: string;
  finalScore: number;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: Date;
  updatedAt: Date;
}

export interface GetAssignmentsResponse {
  assignments: IAssignment[];
  pagination: IPagination;
}

export interface GetAssignmentResponse {
  assignment: IAssignment;
}

export interface CreateAssignment {
  title: string;
  description: string;
  type: "Individual" | "Group";
  assignTo: string[];
  reward: number;
  deadline: Date;
}

export interface ReviewAssignmentRequest {
  feedback: string;
  finalScore: number;
  status: string;
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  reward?: number;
  deadline?: Date;
}

export interface SubmissionAssignmentResponse {
  message: string;
  assignment: IAssignment;
  file: {
    url: string;
    size: number;
    format: string;
  };
}

export interface INewAssignmentTemplate {
    username: string;
    type: string;
    title: string;
    description: string;
    reward: number;
    formattedDeadline: string;
    url: string;
}
