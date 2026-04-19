"use client";

import Header from "@/components/header";
import { useState } from "react";
import { IAssignment, IFilteredAssignment } from "@/types/assignment";
import {
  useGetAssignments,
  useSubmissionAssignment,
} from "@/hooks/use-assignment";
import AssignmentCard from "@/components/card/assignment-card";
import AssignmentFilter from "@/components/table/assignment-filter";
import Pagination from "@/components/pagination";
import Swal from "sweetalert2";
import DetailAssignment from "@/components/dialog/submit-assignment";

export default function MyAssignmentPage() {
  const [filtered, setFiltered] = useState<IFilteredAssignment>({
    search: "",
    type: "all",
    status: "all",
    page: 1,
    limit: 15,
    myAssignments: true,
  });
  const [selectedAssignment, setSelectedAssignment] =
    useState<IAssignment | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { data: assignmentsData, isLoading } = useGetAssignments(filtered);
  const { mutateAsync: submitAssignment, isPending } =
    useSubmissionAssignment();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handleOnSubmit = async () => {
    if (!selectedAssignment || !file) return;

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File size too large",
        text: "File size must be less than 2MB",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    Swal.fire({
      title: "Submitting...",
      text: "Please wait while we upload your assignment.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await submitAssignment({ id: selectedAssignment.id, file });
      setSelectedAssignment(null);
      setFile(null);
      setPreview(null);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleFiltered = (
    key: keyof IFilteredAssignment,
    value: string | number | boolean,
  ) => {
    console.log(key, value);
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
      myAssignments: true,
    });
  };

  return (
    <div className="w-full max-w-7xl xl:max-w-360 mx-auto space-y-8">
      <div className="w-full flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
        <Header
          title={"My Assignment"}
          subTitle={"Your assignment management hub"}
        />

        {/* Filtered */}
        <AssignmentFilter
          filtered={filtered}
          handleFiltered={handleFiltered}
          onClear={handleClear}
          total={assignmentsData?.pagination?.total || 0}
        />
      </div>
      {/* Assignment List */}
      <div className="w-full">
        {isLoading ? (
          <div className="w-full">
            <p>Loading...</p>
          </div>
        ) : (
          <>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignmentsData?.assignments?.length === 0 ? (
                <p className="text-muted-foreground">No assignments found</p>
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
      </div>

      <DetailAssignment
        selectedAssignment={selectedAssignment}
        setSelectedAssignment={setSelectedAssignment}
        file={file}
        setFile={setFile}
        preview={preview}
        setPreview={setPreview}
        isPending={isPending}
        handleOnSubmit={handleOnSubmit}
        handleFileChange={handleFileChange}
      />
    </div>
  );
}
