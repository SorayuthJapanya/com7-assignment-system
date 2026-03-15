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
import { Search } from "lucide-react";
import { useState } from "react";
import ReviewAssignment from "@/components/dialog/review-assignment";
import Swal from "sweetalert2";

export default function ReviewAssignmentPage() {
  const [filtered, setFiltered] = useState<IFilteredAssignment>({
    search: "",
    type: "all",
    status: "Pending",
    page: 1,
    limit: 15,
    myAssignments: false,
  });
  const [selectedAssignment, setSelectedAssignment] =
    useState<IAssignment | null>(null);

  const { data: assignmentsData, isLoading } = useGetAssignments(filtered);
  const { mutateAsync: reviewAssignment } = useReviewAssignment();

  const handleFiltered = (
    key: keyof IFilteredAssignment,
    value: string | number | boolean,
  ) => {
    setFiltered({
      ...filtered,
      [key]: value,
    });
  };

  const handleReviewAssignment = async (data: {
    status: string;
    finalScore: number;
    feedback: string;
  }) => {
    if (!selectedAssignment) return;
    Swal.fire({
      title: "Updating...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    await reviewAssignment({
      id: selectedAssignment.id,
      data,
    });
    setSelectedAssignment(null);
  };

  return (
    <div className="w-full max-w-8xl mx-auto space-y-8">
      <div className="w-full flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
        <Header
          title={"Review Assignment"}
          subTitle={"Review & Approve Assignments"}
        />

        <div className="flex items-center justify-center sm:justify-end gap-2">
          {/* Search */}
          <InputGroup>
            <InputGroupInput
              placeholder="Search..."
              value={filtered.search}
              onChange={(e) => handleFiltered("search", e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupAddon align={"inline-end"}>
              <p className="text-xs font-normal text-muted-foreground">
                {assignmentsData?.assignments.length} assignment
                {assignmentsData?.assignments.length !== 1 ? "s" : ""}
              </p>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full">
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignmentsData?.assignments?.length === 0 ? (
              <div className="w-full flex items-center justify-start">
                <p className="text-muted-foreground">No assignments found</p>
              </div>
            ) : (
              assignmentsData?.assignments?.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onSelected={setSelectedAssignment}
                />
              ))
            )}
          </div>
          {assignmentsData?.pagination &&
            assignmentsData.pagination.totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  pagination={assignmentsData.pagination}
                  onPageChange={(page) => handleFiltered("page", page)}
                />
              </div>
            )}
        </>
      )}

      <ReviewAssignment
        selectedAssignment={selectedAssignment}
        setSelectedAssignment={setSelectedAssignment}
        isPending={false}
        handleOnReview={async (data: {
          status: string;
          finalScore: number;
          feedback: string;
        }) => {
          await handleReviewAssignment(data);
        }}
      />
    </div>
  );
}
