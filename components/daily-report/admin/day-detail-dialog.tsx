"use client";

import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Maximize2, ImageOff, ZoomIn, ZoomOut, RotateCcw, Download, Loader2 } from "lucide-react";
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
  updatedAt?: string | null;
}

// จัดรูปแบบวันที่-เวลาให้อ่านง่าย เช่น 10/7/2569 14:32
function formatReviewedAt(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

// เช็คว่าค่าที่ได้มาเป็น UUID (userId) หรือไม่ ถ้าใช่ไม่ต้องแสดง
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

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

export default function DayDetailDialog({ date, open, onClose }: DayDetailDialogProps) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useDayDetail(date);
  const { mutate: review, isPending } = useReviewDailyReport();
  const currentUser = useAuthUser();

  // null = แสดงหน้ารายการ, มีค่า = แสดงหน้ารายละเอียด
  const [selectedReport, setSelectedReport] = useState<ReportPreview | null>(null);

  // เก็บ url รูปที่กำลังดูแบบเต็มจอ (lightbox)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // เก็บว่ารูปของ report ไหนโหลดไม่สำเร็จบ้าง (key = imageUrl)
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // ===== state สำหรับซูม/แพนรูปใน lightbox =====
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const handleZoomIn = () => setZoom((z) => clampZoom(z + ZOOM_STEP));
  const handleZoomOut = () =>
    setZoom((z) => {
      const next = clampZoom(z - ZOOM_STEP);
      if (next === MIN_ZOOM) setPan({ x: 0, y: 0 });
      return next;
    });

  // ซูมด้วยลูกกลิ้งเมาส์ (scroll)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    setZoom((z) => {
      const next = clampZoom(z + delta);
      if (next === MIN_ZOOM) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  // ดับเบิลคลิกเพื่อสลับซูมเข้า/รีเซ็ต
  const handleDoubleClick = () => {
    setZoom((z) => (z > MIN_ZOOM ? MIN_ZOOM : 2));
    setPan({ x: 0, y: 0 });
  };

  // ลาก (pan) รูปตอนซูมเข้า
  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom <= MIN_ZOOM) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // ===== ดาวน์โหลดรูปภาพ =====
  const [isDownloading, setIsDownloading] = useState(false);

  const getDownloadFilename = (url: string) => {
    try {
      const pathname = new URL(url, window.location.origin).pathname;
      const base = pathname.split("/").pop() || "image";
      return base.includes(".") ? base : `${base}.jpg`;
    } catch {
      return `report-image-${Date.now()}.jpg`;
    }
  };

  const handleDownload = async (url: string) => {
    setIsDownloading(true);
    try {
      // ใช้ fetch -> blob เพื่อให้ดาวน์โหลดได้จริงแม้รูปจะอยู่คนละโดเมน (cross-origin)
      // ต่างจากการใส่ attribute download ตรงๆ ที่ browser มักจะเปิดรูปแทนการดาวน์โหลด
      const res = await fetch(url);
      if (!res.ok) throw new Error("โหลดรูปไม่สำเร็จ");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = getDownloadFilename(url);
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // fallback: เปิดรูปในแท็บใหม่ให้ผู้ใช้บันทึกเอง กรณีดาวน์โหลดตรงไม่สำเร็จ (เช่น CORS)
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleToggleApprove = (reportId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Approved" ? "Rejected" : "Approved";
    const reviewerName = currentUser?.username ?? "Unknown";
    const updatedAt = new Date().toISOString();

    setSelectedReport((prev) =>
      prev && prev.reportId === reportId
        ? { ...prev, status: newStatus, reviewedBy: reviewerName, updatedAt }
        : prev
    );

    review(
      {
        id: reportId,
        data: { status: newStatus, reviewedBy: reviewerName },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["day-detail", date] });
          queryClient.invalidateQueries({ queryKey: ["calendar-summary"] });

          setTimeout(() => {
            setSelectedReport((prev) => (prev?.reportId === reportId ? null : prev));
          }, 1200);
        },
      }
    );
  };

  const handleDialogClose = () => {
    setSelectedReport(null);
    onClose();
  };

  const openFullscreen = (url: string) => {
    resetZoom();
    setFullscreenImage(url);
  };

  return (
    <>
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
                    ? {
                        status: item.report?.status,
                        reviewedBy: item.report?.reviewedBy,
                        updatedAt: item.report?.updatedAt,
                      }
                    : null;

                  const preview = submitted
                    ? getFirstLinePreview(item.report?.description ?? "")
                    : null;

                  const openDetail = () => {
                    if (!submitted) return;
                    setSelectedReport({
                      reportId: item.report!.id,
                      nickname: item.nickname,
                      username: item.username,
                      description: item.report?.description ?? "",
                      imageUrl: item.report?.imageUrl,
                      status: effective?.status,
                      reviewedBy: effective?.reviewedBy,
                      updatedAt: effective?.updatedAt,
                    });
                  };

                  return (
                    <div
                      key={item.userId}
                      role={submitted ? "button" : undefined}
                      tabIndex={submitted ? 0 : undefined}
                      onClick={openDetail}
                      onKeyDown={(e) => {
                        if (submitted && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          openDetail();
                        }
                      }}
                      className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors ${
                        submitted ? "cursor-pointer hover:border-primary hover:bg-primary/5" : ""
                      }`}
                    >
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
                          <div className="flex items-center gap-1.5 text-sm text-gray-700 w-fit max-w-full">
                            <span className="truncate underline decoration-dotted underline-offset-2">
                              {preview?.text}
                            </span>
                            {preview?.truncated && (
                              <span className="shrink-0 text-[11px] text-primary font-medium whitespace-nowrap">
                                ตรวจสอบรายละเอียดงาน →
                              </span>
                            )}
                          </div>

                          {effective?.status !== "Pending" && displayReviewedBy(effective?.reviewedBy) && (
                            <p className="text-[11px] text-muted-foreground">
                              ตรวจโดย: {displayReviewedBy(effective?.reviewedBy)}
                              {formatReviewedAt(effective?.updatedAt) &&
                                ` เมื่อ ${formatReviewedAt(effective?.updatedAt)}`}
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
              {/* ===== หน้ารายละเอียด ===== */}
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

                {selectedReport.status !== "Pending" && displayReviewedBy(selectedReport.reviewedBy) && (
                  <p className="text-[11px] text-muted-foreground">
                    ตรวจโดย: {displayReviewedBy(selectedReport.reviewedBy)}
                    {formatReviewedAt(selectedReport.updatedAt) &&
                      ` เมื่อ ${formatReviewedAt(selectedReport.updatedAt)}`}
                  </p>
                )}

                {selectedReport.imageUrl && (
                  <div className="relative w-full">
                    {brokenImages[selectedReport.imageUrl] ? (
                      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed h-48 text-muted-foreground">
                        <ImageOff className="size-6" />
                        <p className="text-xs">ไม่สามารถโหลดรูปภาพได้</p>
                      </div>
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedReport.imageUrl}
                          alt="report image"
                          onError={() =>
                            setBrokenImages((prev) => ({ ...prev, [selectedReport.imageUrl!]: true }))
                          }
                          className="rounded-lg border object-contain bg-muted/30 w-full max-h-80"
                        />
                        <button
                          type="button"
                          onClick={() => openFullscreen(selectedReport.imageUrl!)}
                          aria-label="ขยายดูรูปภาพ"
                          className="absolute top-2 right-2 size-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                        >
                          <Maximize2 className="size-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/*
        ===== Lightbox แสดงรูปภาพเต็มจอ =====
        - เอากรอบดำ/พื้นหลังกล่องออก ให้พื้นหลังโปร่งใสเห็นแค่ overlay ของ Dialog เอง
        - เพิ่มปุ่มซูมเข้า/ออก + ซูมด้วย scroll wheel + ดับเบิลคลิก + ลากรูป (pan) ตอนซูม
        - รูปไม่แตก: ใช้ object-contain รักษาสัดส่วนเดิม ไม่ stretch, ไม่ crop
          และปิด native drag ของ browser (draggable=false, select-none) ป้องกันภาพเบลอ/ขาดตอนลาก
      */}
      <Dialog
        open={!!fullscreenImage}
        onOpenChange={(v) => {
          if (!v) {
            setFullscreenImage(null);
            resetZoom();
          }
        }}
      >
        <DialogContent
          className="max-w-[95vw] w-[95vw] h-[95vh] p-0 border-none bg-transparent shadow-none flex items-center justify-center z-[100] [&>button]:text-white [&>button]:bg-black/80 [&>button]:hover:bg-black [&>button]:rounded-full [&>button]:p-2 [&>button]:top-4 [&>button]:right-4 [&>button]:ring-1 [&>button]:ring-white/30 [&>button]:shadow-lg [&>button]:opacity-100 [&>button]:transition-colors [&>button_svg]:size-5"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>ดูรูปภาพขนาดเต็ม</DialogTitle>
            <DialogDescription>แสดงรูปภาพแนบจากรายงานประจำวัน สามารถซูมเข้า-ออกได้</DialogDescription>
          </DialogHeader>

          {fullscreenImage && (
            <div
              className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none"
              onWheel={handleWheel}
              onDoubleClick={handleDoubleClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullscreenImage}
                alt="report image full"
                draggable={false}
                className="max-w-full max-h-full object-contain rounded-lg select-none"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transition: isDragging.current ? "none" : "transform 0.15s ease-out",
                  cursor: zoom > MIN_ZOOM ? "grab" : "default",
                }}
              />

              {/* ===== แถบควบคุมซูม ===== */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur px-2 py-1.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  aria-label="ซูมออก"
                  className="size-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ZoomOut className="size-4" />
                </button>
                <span className="text-xs text-white w-10 text-center tabular-nums select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  aria-label="ซูมเข้า"
                  className="size-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ZoomIn className="size-4" />
                </button>
                <div className="w-px h-5 bg-white/20 mx-1" />
                <button
                  type="button"
                  onClick={resetZoom}
                  disabled={zoom === MIN_ZOOM}
                  aria-label="รีเซ็ตซูม"
                  className="size-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <RotateCcw className="size-4" />
                </button>
                <div className="w-px h-5 bg-white/20 mx-1" />
                <button
                  type="button"
                  onClick={() => handleDownload(fullscreenImage)}
                  disabled={isDownloading}
                  aria-label="ดาวน์โหลดรูปภาพ"
                  className="size-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                  {isDownloading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}