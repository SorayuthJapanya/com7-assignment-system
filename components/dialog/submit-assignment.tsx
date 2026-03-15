import React from "react";
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
import { CalendarDays } from "lucide-react";
import { Coins } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

interface SubmitAssignmentProps {
  selectedAssignment: IAssignment | null;
  setSelectedAssignment: React.Dispatch<
    React.SetStateAction<IAssignment | null>
  >;
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  preview: string | null;
  setPreview: React.Dispatch<React.SetStateAction<string | null>>;
  isPending: boolean;
  handleOnSubmit: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SubmitAssignment({
  selectedAssignment,
  setSelectedAssignment,
  file,
  setFile,
  preview,
  setPreview,
  isPending,
  handleOnSubmit,
  handleFileChange,
}: SubmitAssignmentProps) {
  return (
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
                {selectedAssignment.finalScore
                  ? `Your Score: ${selectedAssignment.finalScore}`
                  : `Reward: ${selectedAssignment.reward}`}
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
  );
}
