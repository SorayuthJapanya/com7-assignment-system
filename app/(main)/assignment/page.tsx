"use client";

import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Loader2, Coins, CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    setFiltered({
      ...filtered,
      [key]: value,
    });
  };

  return (
    <div className="w-full max-w-8xl mx-auto space-y-8">
      <div className="w-full flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
        <Header
          title={"My Assignment"}
          subTitle={"Your assignment management hub"}
        />

        {/* Filtered */}
        <AssignmentFilter
          filtered={filtered}
          handleFiltered={handleFiltered}
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
                <div className="w-full flex items-center justify-center">
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
      </div>

      <Dialog
        open={!!selectedAssignment}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAssignment(null);
            setFile(null);
            setPreview(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              Review the details and upload your work to submit.
            </DialogDescription>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg leading-none">
                  Title: {selectedAssignment.title}
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  Description: {selectedAssignment.description}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  <span suppressHydrationWarning>
                    Due{" "}
                    {new Date(selectedAssignment.deadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm font-medium">
                  <Coins className="w-4 h-4" />
                  {selectedAssignment.reward}
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="assignment-file" className="text-nowrap">
                  Upload File
                  <span className="text-xs text-destructive text-wrap">
                    (Allow only image and pdf file, Max 2MB)
                  </span>
                </Label>
                <Input
                  id="assignment-file"
                  type="file"
                  className="cursor-pointer"
                  onChange={handleFileChange}
                  accept="image/jpeg, image/png, image/jpg, application/pdf, .pdf"
                />
                {preview && file ? (
                  <div className="mt-2 rounded-md overflow-hidden border">
                    {file.type === "application/pdf" ? (
                      <iframe
                        src={preview}
                        className="w-full h-[calc(100vh-20rem)]"
                        title="PDF Preview"
                      />
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full max-h-[250px] object-contain bg-muted"
                        />
                      </>
                    )}
                  </div>
                ) : selectedAssignment.submissionUrl ? (
                  <div className="mt-2 rounded-md overflow-hidden border">
                    {selectedAssignment.submissionUrl
                      .toLowerCase()
                      .endsWith(".pdf") ? (
                      <iframe
                        src={selectedAssignment.submissionUrl}
                        className="w-full h-[400px]"
                        title="PDF Preview"
                      />
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedAssignment.submissionUrl}
                          alt="Preview"
                          className="w-full max-h-[250px] object-contain bg-muted"
                        />
                      </>
                    )}
                  </div>
                ) : (
                  file && (
                    <div className="mt-2 p-3 bg-muted rounded-md text-sm border break-all">
                      Selected file:{" "}
                      <span className="font-semibold">{file.name}</span> (
                      {(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAssignment(null);
                setFile(null);
                setPreview(null);
              }}
              className="cursor-pointer"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={handleOnSubmit}
              disabled={!file || isPending}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
