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
  deadlineFrom?: string;
  deadlineTo?: string;
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
  username: string;
  earlyBirdModifier?: number | null;
  adjustedScore?: number | null;
  // มาจาก assignments/route.ts (GET) — คำนวณด้วย getRacingBucketIndex
  // เฉพาะตอน status === "Approved" และมี submitAt จริงเท่านั้น (ไม่งั้นเป็น
  // null) ใช้คู่กับ getBucketDisplay() ใน lib/early-bird-bonus-table.ts
  // เพื่อ render badge "กำลังแข่ง Record Bonus" บน AssignmentCard
  bucket?: number | null;
  // true ถ้า assignment นี้เคยชนะ Record Bonus +500 ไปแล้ว (มีแถวใน
  // Score table ที่ assignment_title = `Record Bonus [${id}]`)
  hasRecordBonus?: boolean;
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
  username?: string;
}

export interface SubmissionAssignmentResponse {
  message: string;
  assignment: IAssignment;
  file: {
    url: string;
    size: number;
    format: string;
    bucket?: number | null;       // 0-6 ตาม getRacingBucketIndex/getFullBucketIndex, null = ยังไม่ submit หรือยังไม่ approve
    hasRecordBonus?: boolean;
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

