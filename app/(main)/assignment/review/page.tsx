"use client";

import AssignmentCard from "@/components/card/assignment-card";
import Header from "@/components/header";
import Pagination from "@/components/pagination";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useGetAssignments, useReviewAssignment } from "@/hooks/use-assignment";
import { IAssignment, IFilteredAssignment } from "@/types/assignment";
import { Search, FileX } from "lucide-react";
import { useRef, useState } from "react";
import ReviewAssignment from "@/components/dialog/review-assignment";
import Swal from "sweetalert2";

export default function ReviewAssignmentPage() {
  const [filtered, setFiltered] = useState<IFilteredAssignment>({
    search: "",
    type: "all",
    status: "Pending", // ยังคงสถานะเริ่มต้นไว้ดึงข้อมูลตาม logic เดิม
    page: 1,
    limit: 15,
    myAssignments: false,
  });

  const [selectedAssignment, setSelectedAssignment] =
    useState<IAssignment | null>(null);
  const selectedAssignmentRef = useRef<IAssignment | null>(null);

  const { data: assignmentsData, isLoading } = useGetAssignments(filtered);
  const { mutateAsync: reviewAssignment } = useReviewAssignment();

  const handleFiltered = (
    key: keyof IFilteredAssignment,
    value: string | number | boolean
  ) => {
    const resetPage = key !== "page";
    setFiltered((prev) => ({
      ...prev,
      [key]: value,
      ...(resetPage ? { page: 1 } : {}),
    }));
  };

  const handleSelectAssignment = (assignment: IAssignment | null) => {
    if (assignment !== null) {
      selectedAssignmentRef.current = assignment;
    }
    setSelectedAssignment(assignment);
  };

  const handleReviewAssignment = async (data: {
    status: string;
    finalScore: number;
    feedback: string;
  }) => {
    const assignment = selectedAssignmentRef.current;
    if (!assignment) return;
    Swal.fire({
      title: "Updating...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    await reviewAssignment({ id: assignment.id, data });
  };

  // ดึงรายการงานตามเงื่อนไขค้นหา เรียงลำดับพื้นฐานตาม deadline
  const displayedAssignments = (() => {
    let list = [...(assignmentsData?.assignments ?? [])];

    list = list.filter((assignment) => assignment.status === "Pending");

    list.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    return list;
  })();

  return (
    <div className="w-full max-w-7xl xl:max-w-360 mx-auto space-y-5">

      {/* Top bar: title left, search right */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Header
          title="Review Assignment"
          subTitle="Review & Approve Assignments"
        />
        <InputGroup className="w-full sm:w-72">
          <InputGroupAddon>
            <Search className="w-4 h-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="ค้นหาชื่องาน หรือชื่อผู้รับ"
            value={filtered.search}
            onChange={(e) => handleFiltered("search", e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {displayedAssignments.length} assignment
              {displayedAssignments.length !== 1 ? "s" : ""}
            </p>
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          Loading...
        </div>
      ) : displayedAssignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <FileX className="w-8 h-8 opacity-40" />
          <p className="text-sm">ไม่พบ assignment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onSelected={handleSelectAssignment}
              reviewMode
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {assignmentsData?.pagination &&
        assignmentsData.pagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              pagination={assignmentsData.pagination}
              onPageChange={(page) => handleFiltered("page", page)}
            />
          </div>
        )}

      {/* Review dialog */}
      <ReviewAssignment
        selectedAssignment={selectedAssignment}
        setSelectedAssignment={handleSelectAssignment}
        isPending={false}
        handleOnReview={handleReviewAssignment}
      />
    </div>
  );
}