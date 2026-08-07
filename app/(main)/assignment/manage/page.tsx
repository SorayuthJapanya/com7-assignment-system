"use client";

import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { IFilteredAssignment, IAssignment } from "@/types/assignment";
import {
  useGetAssignments,
  useReviewAssignment,
  useDeleteAssignment,
} from "@/hooks/use-assignment";
import AssignmentFilter from "@/components/table/assignment-filter";
import Pagination from "@/components/pagination";
import AssignmentTable from "@/components/assignment-table";
import EditAssignment from "@/components/dialog/edit-assignment";
import DuplicateAssignment from "@/components/dialog/duplicate-assignment"; // 👈 เพิ่ม import
import Link from "next/link";
import { useIsSuperAdmin } from "@/hooks/use-current-user";

export default function ManageAssignmentPage() {
  const { isSuperAdmin } = useIsSuperAdmin();

  // State สำหรับควบคุมตัว Pop-up แก้ไขข้อมูล
  const [selectedAssignment, setSelectedAssignment] = useState<IAssignment | null>(null);

  // 👇 State สำหรับควบคุม Pop-up Duplicate
  const [duplicateSource, setDuplicateSource] = useState<IAssignment | null>(null);

  const [filtered, setFiltered] = useState<IFilteredAssignment>({
    search: "",
    type: "all",
    status: "all",
    page: 1,
    limit: 15,
    myAssignments: false,
    username: "",
    deadlineMonth: "",
  });

  const { data: assignmentsData, isLoading } = useGetAssignments(filtered);
  const { mutateAsync: reviewAssignment } = useReviewAssignment();
  const { mutateAsync: deleteAssignment } = useDeleteAssignment();

  const handleFiltered = (
    key: keyof IFilteredAssignment,
    value: string | number | boolean,
  ) => {
    if (key === "page") {
      setFiltered((prev) => ({ ...prev, page: value as number }));
    } else {
      setFiltered((prev) => ({ ...prev, [key]: value, page: 1 }));
    }
  };

  const handleClear = () => {
    setFiltered({
      search: "",
      type: "all",
      status: "all",
      page: 1,
      limit: filtered.limit,
      myAssignments: false,
      username: "",
      deadlineMonth: "",
    });
  };

  const handleStatusChange = async (id: string, status: string) => {
    await reviewAssignment({ id, data: { status, feedback: "", finalScore: 0 } });
  };

  const handleDelete = async (id: string) => {
    await deleteAssignment({ id });
  };

  const handleEdit = (id: string) => {
    const assignmentToEdit = assignmentsData?.assignments.find((item) => item.id === id);
    if (assignmentToEdit) {
      setSelectedAssignment(assignmentToEdit);
    }
  };

  // 👇 เรียกจาก AssignmentTable เมื่อกดปุ่ม Duplicate ใน Swal detail popup
  const handleDuplicate = (assignment: IAssignment) => {
    setDuplicateSource(assignment);
  };

  return (
    <div className="w-full max-w-7xl xl:max-w-360 mx-auto space-y-8">
      <div className="w-full flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
        <Header
          title={"Manage Assignment"}
          subTitle={"Overview and manage all assignments"}
        />

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 max-sm:mt-2">
          <AssignmentFilter
            filtered={filtered}
            handleFiltered={handleFiltered}
            onClear={handleClear}
            total={assignmentsData?.pagination?.total || 0}
            isSuperAdmin={isSuperAdmin}
          />
          <Link href="/assignment/add">
            <Button className="shrink-0 cursor-pointer">
              <Plus className="w-4 h-4" />
              New Assignment
            </Button>
          </Link>
        </div>
      </div>

      <div className="w-full">
        {isLoading ? (
          <p>Loading...</p>
        ) : assignmentsData?.assignments && assignmentsData.assignments.length > 0 ? (
          <>
            <AssignmentTable
              assignments={assignmentsData.assignments}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
            />
            {assignmentsData.pagination &&
              assignmentsData.pagination.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    pagination={assignmentsData.pagination}
                    onPageChange={(page) => handleFiltered("page", page)}
                  />
                </div>
              )}
          </>
        ) : (
          <p className="text-muted-foreground">No assignments found</p>
        )}
      </div>

      <EditAssignment
        selectedAssignment={selectedAssignment}
        setSelectedAssignment={setSelectedAssignment}
      />

      {/* 👇 เพิ่ม Duplicate Dialog */}
      <DuplicateAssignment
        selectedAssignment={duplicateSource}
        setSelectedAssignment={setDuplicateSource}
      />
    </div>
  );
}