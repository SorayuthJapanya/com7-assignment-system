"use client";

import { useState } from "react";
import { useMyDailyReports } from "@/hooks/use-daily-report";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ReportItem {
  id: string;
  date: string;
  description: string;
  imageUrl?: string | null;
  status: string;
  feedback?: string | null;
}

// ตัดให้เหลือแค่บรรทัดแรก แล้วเติม ... ถ้ามีมากกว่า 1 บรรทัดหรือยาวเกินไป
function getFirstLinePreview(text: string, maxLength = 70): { text: string; truncated: boolean } {
  if (!text) return { text: "", truncated: false };
  const firstLine = text.split("\n")[0];
  const hasMoreLines = text.includes("\n");
  if (firstLine.length > maxLength) {
    return { text: firstLine.slice(0, maxLength) + "...", truncated: true };
  }
  return { text: firstLine + (hasMoreLines ? "..." : ""), truncated: hasMoreLines };
}

const formatThaiDate = (date: string) =>
  new Date(date).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const statusColor = (status: string) => {
  if (status === "Approved") return "bg-green-100 text-green-700 border-green-200";
  if (status === "Rejected") return "bg-red-100 text-red-700 border-red-200";
  return "bg-yellow-100 text-yellow-700 border-yellow-200";
};

export default function MyReportHistory() {
  const { data, isLoading } = useMyDailyReports();
  const [selected, setSelected] = useState<ReportItem | null>(null);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const reports: ReportItem[] = data?.data ?? [];

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
        ยังไม่มีประวัติการส่งรายงาน
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">ประวัติการส่งรายงาน</h3>

        <div className="flex flex-col gap-2">
          {reports.map((r) => {
            const preview = getFirstLinePreview(r.description);

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelected(r)}
                className="text-left rounded-xl border p-3 flex items-center justify-between gap-3 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-semibold">{formatThaiDate(r.date)}</span>
                  <span className="text-sm text-gray-600 truncate">{preview.text}</span>
                </div>

                <span
                  className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${statusColor(
                    r.status
                  )}`}
                >
                  {r.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Popup แสดงรายละเอียดเต็มของรายงานที่เลือก */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected && formatThaiDate(selected.date)}</DialogTitle>
            <DialogDescription>รายละเอียดรายงานประจำวัน</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="flex flex-col gap-3">
              <span
                className={`text-xs px-2 py-0.5 rounded-full border w-fit ${statusColor(
                  selected.status
                )}`}
              >
                {selected.status}
              </span>

              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {selected.description}
              </p>

              {selected.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.imageUrl}
                  alt="report"
                  className="rounded-lg border object-cover w-full max-h-80"
                />
              )}

              {selected.feedback && (
                <p className="text-xs text-muted-foreground italic border-t pt-2">
                  Feedback: {selected.feedback}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}