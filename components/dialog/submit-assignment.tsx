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
import { CalendarDays, Coins, Expand } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

interface SubmitAssignmentProps {
  selectedAssignment: IAssignment | null;
  setSelectedAssignment: React.Dispatch<React.SetStateAction<IAssignment | null>>;
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
  const isApproved = selectedAssignment?.status === "Approved";
  const [fullscreen, setFullscreen] = useState(false);
  const [confirmNoFileOpen, setConfirmNoFileOpen] = useState(false);

  const previewSrc = (preview && file) ? preview : selectedAssignment?.submissionUrl || null;
  const isPdf = (preview && file)
    ? file.type === "application/pdf"
    : selectedAssignment?.submissionUrl?.toLowerCase().endsWith(".pdf") ?? false;

  const closeMainDialog = () => {
    setSelectedAssignment(null);
    setFile(null);
    setPreview(null);
  };

  const handleSubmitClick = () => {
    if (!file) {
      setConfirmNoFileOpen(true);
      return;
    }
    handleOnSubmit();
  };

  const handleConfirmSubmitWithoutFile = () => {
    // ปิด popup ยืนยันก่อน แต่ "ห้าม" แตะ state ของ Dialog หลัก
    setConfirmNoFileOpen(false);
    // เรียกส่งจริง — selectedAssignment / file ยังอยู่ครบตอนนี้
    handleOnSubmit();
  };

  return (
    <>
      <Dialog
        open={!!selectedAssignment}
        onOpenChange={(open) => {
          // กันไม่ให้ Dialog หลักปิดตัวเองตอน popup ยืนยันกำลังเปิดอยู่
          if (confirmNoFileOpen) return;
          if (!open) {
            closeMainDialog();
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
              {/* Title & Description */}
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

              {/* Meta */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  <span suppressHydrationWarning>
                    Due{" "}
                    {new Date(selectedAssignment.deadline).toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm font-medium">
                  <Coins className="w-4 h-4" />
                  {selectedAssignment.finalScore
                    ? `Your Score: ${selectedAssignment.finalScore}`
                    : `Reward: ${selectedAssignment.reward}`}
                </div>
              </div>

              {/* Submission preview */}
              {previewSrc && (
                <div className="relative rounded-md overflow-hidden border group">
                  {isPdf ? (
                    <iframe
                      src={previewSrc}
                      className="w-full h-[400px]"
                      title="PDF Preview"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewSrc}
                      alt="Preview"
                      className="w-full max-h-[250px] object-contain bg-muted"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => isPdf && previewSrc ? window.open(previewSrc, "_blank") : setFullscreen(true)}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={isPdf ? "Open in new tab" : "View fullscreen"}
                  >
                    <Expand className="size-4" />
                  </button>
                </div>
              )}

              {/* Upload section — hidden when Approved */}
              {!isApproved && (
                <div className="space-y-3">
                  <Label htmlFor="assignment-file" className="text-nowrap">
                    Upload File
                    <span className="text-xs text-destructive text-wrap ml-1">
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
                  {file && !preview && (
                    <div className="p-3 bg-muted rounded-md text-sm border break-all">
                      Selected file:{" "}
                      <span className="font-semibold">{file.name}</span> (
                      {(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeMainDialog}
              className="cursor-pointer"
              disabled={isPending}
            >
              Close
            </Button>
            {!isApproved && (
              <Button
                type="button"
                className="cursor-pointer"
                onClick={handleSubmitClick}
                disabled={isPending}
              >
                Submit
              </Button>
            )}
          </DialogFooter>

          {/* Confirm popup: ยังไม่ได้แนบไฟล์ — nest ไว้ข้างใน Dialog หลัก */}
          <Dialog open={confirmNoFileOpen} onOpenChange={setConfirmNoFileOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>ยังไม่ได้แนบไฟล์</DialogTitle>
                <DialogDescription>
                  คุณยังไม่ได้แนบไฟล์งาน ยืนยันที่จะส่งโดยไม่มีไฟล์แนบใช่หรือไม่?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmNoFileOpen(false)}
                  className="cursor-pointer"
                  disabled={isPending}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  className="cursor-pointer"
                  onClick={handleConfirmSubmitWithoutFile}
                  disabled={isPending}
                >
                  ยืนยันส่ง
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>

      {/* Fullscreen preview dialog */}
      {previewSrc && (
        <Dialog open={fullscreen} onOpenChange={setFullscreen}>
          <DialogContent className="w-full max-h-[90vh] p-0 flex flex-col rounded-lg">
            <div className="w-full h-auto rounded-lg flex-1 overflow-auto bg-muted flex items-center justify-center">
              {isPdf ? (
                <iframe
                  src={previewSrc}
                  className="w-full h-full rounded-lg"
                  title="PDF Fullscreen"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
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