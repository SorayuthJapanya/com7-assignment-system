"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useAuthUser } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useDayDetail, useReviewDailyReport } from "@/hooks/use-daily-report";

interface DayDetailDialogProps {
  date: string | null;
  open: boolean;
  onClose: () => void;
}

interface ReportPreview {
  reportId: string;
  nickname: string;
  username: string;
  description: string;
  imageUrl?: string | null;
  status?: string;
  reviewedBy?: string | null;
}

// ตัดให้เหลือแค่บรรทัดแรก แล้วเติม ... ถ้ามีมากกว่า 1 บรรทัดหรือยาวเกินไป
function getFirstLinePreview(text: string, maxLength = 60): { text: string; truncated: boolean } {
  if (!text) return { text: "", truncated: false };
  const firstLine = text.split("\n")[0];
  const hasMoreLines = text.includes("\n");
  if (firstLine.length > maxLength) {
    return { text: firstLine.slice(0, maxLength) + "...", truncated: true };
  }
  return { text: firstLine + (hasMoreLines ? "..." : ""), truncated: hasMoreLines };
}

// เช็คว่าค่าที่ได้มาเป็น UUID (userId) หรือไม่ ถ้าใช่ไม่ต้องแสดง (กันข้อมูลเก่าที่เคยเก็บผิดพลาด)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function displayReviewedBy(value?: string | null): string | null {
  if (!value) return null;
  if (UUID_REGEX.test(value)) return null;
  return value;
}

const statusColor = (status?: string) => {
  if (status === "Approved") return "bg-green-100 text-green-700 border-green-200";
  if (status === "Rejected") return "bg-red-100 text-red-700 border-red-200";
  return "bg-yellow-100 text-yellow-700 border-yellow-200";
};

export default function DayDetailDialog({ date, open, onClose }: DayDetailDialogProps) {
  const { data, isLoading } = useDayDetail(date);
  const { mutate: review, isPending } = useReviewDailyReport();
  const currentUser = useAuthUser();

  // ไม่ใช้ Dialog ซ้อน Dialog แล้ว — ใช้ state นี้สลับ "มุมมอง" ภายใน Dialog เดียวแทน
  // null = แสดงหน้ารายการ, มีค่า = แสดงหน้ารายละเอียด
  const [selectedReport, setSelectedReport] = useState<ReportPreview | null>(null);

  // เก็บผลของการตรวจล่าสุดไว้ที่ฝั่ง client ด้วย (key = reportId)
  // เพื่อให้ "ตรวจโดย" ยังโชว์ค้างอยู่ทั้งในหน้ารายการและหน้ารายละเอียด ทันทีที่กดตรวจ
  const [reviewOverrides, setReviewOverrides] = useState<
    Record<string, { status: string; reviewedBy: string }>
  >({});

  // ใช้ username ของ user ที่ login อยู่ตอนนี้ ส่งไปเป็นผู้ตรวจโดยตรง
  const handleToggleApprove = (reportId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Approved" ? "Rejected" : "Approved";
    const reviewerName = currentUser?.username ?? "Unknown";

    setReviewOverrides((prev) => ({
      ...prev,
      [reportId]: { status: newStatus, reviewedBy: reviewerName },
    }));

    setSelectedReport((prev) =>
      prev && prev.reportId === reportId
        ? { ...prev, status: newStatus, reviewedBy: reviewerName }
        : prev
    );

    review(
      {
        id: reportId,
        data: { status: newStatus, reviewedBy: reviewerName },
      },
      {
        onSuccess: () => {
          // รอให้ข้อความ "Updated" (timer 1200ms ใน useReviewDailyReport) แสดงเสร็จก่อน แล้วค่อยกลับไปหน้ารายการ
          setTimeout(() => {
            setSelectedReport((prev) => (prev?.reportId === reportId ? null : prev));
          }, 1200);
        },
      }
    );
  };

  // รวมค่าจาก server กับค่าที่เพิ่งตรวจไปด้วย local override (override ชนะเสมอถ้ามี)
  const getEffectiveReport = (reportId: string, status?: string, reviewedBy?: string | null) => {
    const override = reviewOverrides[reportId];
    return {
      status: override?.status ?? status,
      reviewedBy: override?.reviewedBy ?? reviewedBy,
    };
  };

  const handleDialogClose = () => {
    setSelectedReport(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleDialogClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        {!selectedReport ? (
          <>
            {/* ===== หน้ารายการ ===== */}
            <DialogHeader>
              <DialogTitle>รายละเอียดวันที่ {date}</DialogTitle>
              <DialogDescription>
                รายชื่อ Intern ทั้งหมด — สถานะการส่งงานและการตรวจ
              </DialogDescription>
            </DialogHeader>

            {isLoading && <p className="text-sm text-muted-foreground py-4">Loading...</p>}

            <div className="flex flex-col gap-3 pt-2">
              {data?.data?.map((item) => {
                const initials = item.nickname?.charAt(0).toUpperCase() ?? "U";
                const submitted = !!item.report;
                const effective = submitted
                  ? getEffectiveReport(item.report!.id, item.report?.status, item.report?.reviewedBy)
                  : null;
                const preview = submitted
                  ? getFirstLinePreview(item.report?.description ?? "")
                  : null;

                return (
                  <div key={item.userId} className="flex flex-col gap-2 rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                          {item.profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.profileImage}
                              alt={item.nickname}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-primary">{initials}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{item.nickname}</p>
                          <p className="text-xs text-muted-foreground">@{item.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!submitted ? (
                          <span className="text-xs px-2 py-0.5 rounded-full border text-muted-foreground">
                            ยังไม่ส่ง
                          </span>
                        ) : (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(
                              effective?.status
                            )}`}
                          >
                            {effective?.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {submitted && (
                      <div className="pl-11.5 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedReport({
                              reportId: item.report!.id,
                              nickname: item.nickname,
                              username: item.username,
                              description: item.report?.description ?? "",
                              imageUrl: item.report?.imageUrl,
                              status: effective?.status,
                              reviewedBy: effective?.reviewedBy,
                            })
                          }
                          className="group flex items-center gap-1.5 text-left text-sm text-gray-700 hover:text-primary w-fit max-w-full"
                        >
                          <span className="truncate underline decoration-dotted underline-offset-2">
                            {preview?.text}
                          </span>
                          {preview?.truncated && (
                            <span className="shrink-0 text-[11px] text-primary font-medium whitespace-nowrap">
                              ตรวจสอบรายละเอียดงาน →
                            </span>
                          )}
                        </button>

                        {displayReviewedBy(effective?.reviewedBy) && (
                          <p className="text-[11px] text-muted-foreground">
                            ตรวจโดย: {displayReviewedBy(effective?.reviewedBy)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* ===== หน้ารายละเอียด (สลับมาแทนที่หน้ารายการ ไม่ได้เปิด Dialog ซ้อน) ===== */}
            <DialogHeader>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2 w-fit"
              >
                <ChevronLeft className="size-4" />
                กลับไปหน้ารายการ
              </button>
              <DialogTitle>{selectedReport.nickname}</DialogTitle>
              <DialogDescription>@{selectedReport.username}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border w-fit ${statusColor(
                    selectedReport.status
                  )}`}
                >
                  {selectedReport.status}
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedReport.status === "Approved"}
                    disabled={isPending}
                    onChange={() =>
                      handleToggleApprove(selectedReport.reportId, selectedReport.status ?? "Pending")
                    }
                    className="size-4 rounded border-input accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-xs text-muted-foreground">อนุมัติ</span>
                </label>
              </div>

              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {selectedReport.description}
              </p>

              {displayReviewedBy(selectedReport.reviewedBy) && (
                <p className="text-[11px] text-muted-foreground">
                  ตรวจโดย: {displayReviewedBy(selectedReport.reviewedBy)}
                </p>
              )}

              {selectedReport.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedReport.imageUrl}
                  alt="report image"
                  className="rounded-lg border object-cover w-full max-h-80"
                />
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}