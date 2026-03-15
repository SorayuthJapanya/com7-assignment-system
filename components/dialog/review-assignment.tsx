import React, { useState, useEffect } from "react";
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
import { CalendarDays, Coins } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import Swal from "sweetalert2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface ReviewAssignmentProps {
  selectedAssignment: IAssignment | null;
  setSelectedAssignment: React.Dispatch<
    React.SetStateAction<IAssignment | null>
  >;
  isPending: boolean;
  handleOnReview: (data: {
    status: string;
    finalScore: number;
    feedback: string;
  }) => Promise<void>;
}

export default function ReviewAssignment({
  selectedAssignment,
  setSelectedAssignment,
  isPending,
  handleOnReview,
}: ReviewAssignmentProps) {
  const [status, setStatus] = useState<string>("Pending");
  const [finalScore, setFinalScore] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    if (selectedAssignment) {
      setTimeout(() => {
        setStatus(selectedAssignment.status || "Pending");
        setFinalScore(selectedAssignment.finalScore?.toString() || "");
        setFeedback(selectedAssignment.feedback || "");
      }, 0);
    }
  }, [selectedAssignment]);

  const handleSubmit = async () => {
    // Save review data and assignment before closing dialog
    const reviewData = { status, finalScore: Number(finalScore), feedback };
    const currentAssignment = selectedAssignment;

    // Close dialog first to avoid Radix focus trap blocking SweetAlert
    setSelectedAssignment(null);

    Swal.fire({
      title: "Are you sure?",
      text: "You are about to submit the review for this assignment.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, submit it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await handleOnReview(reviewData);
      } else {
        // Reopen dialog with same assignment if cancelled
        setSelectedAssignment(currentAssignment);
      }
    });
  };

  return (
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
          <DialogTitle>Review Assignment</DialogTitle>
          <DialogDescription>
            Review the assignment submission, update status, and provide
            feedback.
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
              {selectedAssignment.feedback && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  <span className="font-semibold text-destructive">
                    Feedback:
                  </span>{" "}
                  {selectedAssignment.feedback}
                </p>
              )}
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
                Reward: {selectedAssignment.reward}
              </div>
            </div>

            {/* Submitted File Preview */}
            <div className="space-y-3">
              <Label>Submitted Work</Label>
              {selectedAssignment.submissionUrl ? (
                <div className="rounded-md overflow-hidden border">
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
                        className="w-full max-h-[350px] object-contain bg-muted"
                      />
                    </>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-muted text-sm text-muted-foreground rounded-md text-center">
                  No submission file provided.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="font-semibold">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === "Approved" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="finalScore"
                    className="font-semibold text-primary"
                  >
                    Final Score
                  </Label>
                  <Input
                    id="finalScore"
                    type="number"
                    min="0"
                    value={finalScore}
                    onChange={(e) => setFinalScore(e.target.value)}
                    className="border-primary"
                    placeholder="Enter final score"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback" className="font-semibold">
                Feedback
              </Label>
              <Textarea
                id="feedback"
                placeholder="Write your feedback regarding this submission..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setSelectedAssignment(null)}
            className="cursor-pointer"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cursor-pointer"
            onClick={handleSubmit}
            disabled={isPending}
          >
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
