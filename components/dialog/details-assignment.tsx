import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { IAssignment } from "@/types/assignment";
import { Button } from "../ui/button";
import {
  CalendarDays,
  Coins,
  Edit,
  Expand,
  Trash2,
  Users,
  User,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { Label } from "../ui/label";

interface ManageAssignmentProps {
  selectedAssignment: IAssignment | null;
  setSelectedAssignment: React.Dispatch<
    React.SetStateAction<IAssignment | null>
  >;
  handleEdit: (assignment: IAssignment) => void;
  handleDelete: (id: string) => void;
}

export default function ManageAssignment({
  selectedAssignment,
  setSelectedAssignment,
  handleEdit,
  handleDelete,
}: ManageAssignmentProps) {
  const [fullscreen, setFullscreen] = useState(false);

  const submissionUrl = selectedAssignment?.submissionUrl || null;
  const isPdf = submissionUrl?.toLowerCase().endsWith(".pdf") ?? false;
  const isApproved = selectedAssignment?.status === "Approved";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Submit":
        return "bg-orange-100 text-orange-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Approved":
        return "bg-primary/10 text-primary";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const hasFeedback = !!selectedAssignment?.feedback?.trim();
  const hasSubmission = selectedAssignment?.submissionUrl !== "";
  const resultStatus =
    !hasSubmission || (hasFeedback && selectedAssignment?.status !== "Approved")
      ? "Not Submit"
      : selectedAssignment?.status || "";

  return (
    <>
    <Dialog
      open={!!selectedAssignment}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedAssignment(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assignment Details</DialogTitle>
          <DialogDescription>
            View full details of this assignment.
          </DialogDescription>
        </DialogHeader>
        {selectedAssignment && (
          <div className="space-y-5 py-2">
            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg leading-none">
                Title: {selectedAssignment.title}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                Description: {selectedAssignment.description}
              </p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="font-medium">{selectedAssignment.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Created By
                  </Label>
                  <p className="font-medium">{selectedAssignment.createdBy}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Deadline
                  </Label>
                  <p className="font-medium" suppressHydrationWarning>
                    {format(
                      new Date(selectedAssignment.deadline),
                      "dd/MM/yyyy HH:mm",
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Coins className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Reward
                  </Label>
                  <p className="font-medium text-primary">
                    {selectedAssignment.reward} points
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Created At
                  </Label>
                  <p className="font-medium" suppressHydrationWarning>
                    {format(
                      new Date(selectedAssignment.createdAt),
                      "dd/MM/yyyy HH:mm:ss",
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Assign To
                  </Label>
                  <p className="font-medium">{selectedAssignment.assignTo}</p>
                </div>
              </div>
            </div>

            {/* Members (Group only) */}
            {selectedAssignment.type === "Group" &&
              selectedAssignment.members?.length > 0 && (
                <div className="flex items-start gap-2 text-sm bg-secondary/40 border rounded-md p-3">
                  <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Members
                    </Label>
                    <p className="font-medium">
                      {selectedAssignment.members.join(", ")}
                    </p>
                  </div>
                </div>
              )}

            {/* Status */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Status:</Label>
              <span
                className={`${getStatusColor(resultStatus)} px-2.5 py-1 rounded-md text-xs font-medium`}
              >
                {resultStatus}
              </span>
            </div>

            {/* Submitted At */}
            {selectedAssignment.submissionUrl !== "" && (
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <Label className="text-muted-foreground">Submitted At:</Label>
                <span className="font-medium" suppressHydrationWarning>
                  {format(new Date(selectedAssignment.submitAt), "dd/MM/yyyy HH:mm:ss")}
                </span>
                {new Date(selectedAssignment.submitAt) > new Date(selectedAssignment.deadline) && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700">
                    Late Submit
                  </span>
                )}
              </div>
            )}

            {/* Feedback */}
            {selectedAssignment.feedback && (
              <div className="space-y-1 bg-muted/50 border rounded-md p-3">
                <Label className="text-xs text-muted-foreground">
                  Feedback
                </Label>
                <p className="text-sm whitespace-pre-wrap">
                  {selectedAssignment.feedback}
                </p>
              </div>
            )}

            {/* Final Score */}
            {selectedAssignment.finalScore > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Coins className="w-4 h-4 text-primary" />
                <Label className="text-muted-foreground">Final Score:</Label>
                <span className="font-semibold text-primary">
                  {selectedAssignment.finalScore}
                </span>
              </div>
            )}

            {/* Submission Preview */}
            {submissionUrl && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Submission
                </Label>
                <div className="relative rounded-md overflow-hidden border group">
                  {isPdf ? (
                    <iframe
                      src={submissionUrl}
                      className="w-full h-[300px]"
                      title="PDF Preview"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={submissionUrl}
                      alt="Submission Preview"
                      className="w-full max-h-[250px] object-contain bg-muted"
                    />
                  )}
                  {/* Expand button */}
                  <button
                    type="button"
                    onClick={() => isPdf ? window.open(submissionUrl, "_blank") : setFullscreen(true)}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={isPdf ? "Open in new tab" : "View fullscreen"}
                  >
                    <Expand className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (selectedAssignment) handleEdit(selectedAssignment);
            }}
            className="cursor-pointer"
            disabled={isApproved}
            title={isApproved ? "Cannot edit an approved assignment" : undefined}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (selectedAssignment) handleDelete(selectedAssignment.id);
            }}
            className="cursor-pointer"
            disabled={isApproved}
            title={isApproved ? "Cannot delete an approved assignment" : undefined}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Fullscreen preview dialog */}
    {submissionUrl && (
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="w-full max-h-[90vh] p-0 flex flex-col rounded-lg">
          <div className="w-full h-auto rounded-lg flex-1 overflow-auto bg-muted flex items-center justify-center">
            {isPdf ? (
              <iframe
                src={submissionUrl}
                className="w-full h-full rounded-lg"
                title="PDF Fullscreen"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={submissionUrl}
                alt="Fullscreen Preview"
                className="w-full h-full object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}
