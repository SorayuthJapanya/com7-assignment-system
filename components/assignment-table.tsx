"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { IAssignment } from "@/types/assignment";
import { ChevronDown, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";

type AssignmentStatus = "Pending" | "Approved" | "Rejected";

const STATUS_OPTIONS: AssignmentStatus[] = ["Pending", "Approved", "Rejected"];

const STATUS_STYLES: Record<AssignmentStatus, string> = {
  Pending:  "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  Rejected: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
};

const STATUS_DOT: Record<AssignmentStatus, string> = {
  Pending:  "bg-amber-400",
  Approved: "bg-emerald-500",
  Rejected: "bg-red-500",
};

const STATUS_BADGE_HTML: Record<AssignmentStatus, string> = {
  Pending:  `<span style="background:#fffbeb;color:#b45309;border:1px solid #fde68a;padding:2px 10px;border-radius:999px;font-size:13px;font-weight:500;">Pending</span>`,
  Approved: `<span style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;padding:2px 10px;border-radius:999px;font-size:13px;font-weight:500;">Approved</span>`,
  Rejected: `<span style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:2px 10px;border-radius:999px;font-size:13px;font-weight:500;">Rejected</span>`,
};

const fmt = (date: Date | string | undefined) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("th-TH", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
};

const fmtShort = (date: Date | string | undefined) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("th-TH", {
    day: "numeric", month: "short", year: "numeric",
  });
};

const isLate = (submitAt: Date | string, deadline: Date | string) =>
  new Date(submitAt) > new Date(deadline);

// 👇 เพิ่ม onDuplicate: เมื่อกดปุ่ม Duplicate ใน Swal จะปิด Swal แล้วส่ง assignment
// กลับไปให้ parent เปิด React dialog (DuplicateAssignment) ต่อ
const handleShowDetail = (
  assignment: IAssignment,
  onDuplicate: (assignment: IAssignment) => void,
) => {
  const status = (assignment.status ?? "Pending") as AssignmentStatus;
  const late = assignment.submitAt && assignment.deadline
    ? isLate(assignment.submitAt, assignment.deadline)
    : false;

  const submissionSection = assignment.submissionUrl
  ? `
    <div style="margin-top:16px;">
      <p style="font-size:13px;color:#6b7280;margin-bottom:8px;">
        Submission
      </p>

      <div
        style="
          position:relative;
          border:1px solid #e5e7eb;
          border-radius:12px;
          overflow:hidden;
          text-align:center;
          padding:12px;
          background:#f9fafb;
        "
      >
        <img
          src="${assignment.submissionUrl}"
          alt="submission"
          style="
            max-width:100%;
            max-height:280px;
            object-fit:contain;
            border-radius:8px;
          "
        />

        <button
          id="expand-image-btn"
          style="
            position:absolute;
            top:12px;
            right:12px;
            width:38px;
            height:38px;
            border:none;
            border-radius:10px;
            background:rgba(17, 24, 39, 0.8);
            color:white;
            cursor:pointer;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:0;
            line-height:0;
            transition: background 0.2s;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          "
          onmouseover="this.style.background='rgba(17, 24, 39, 0.95)'"
          onmouseout="this.style.background='rgba(17, 24, 39, 0.8)'"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2.5" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            style="display:block;margin:auto;"
          >
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
      </div>
    </div>
  `
  : "";

  Swal.fire({
    title: "",
    width: 560,
    padding: "28px",
    showConfirmButton: false,
    showCloseButton: true,
    html: `
      <div style="text-align:left;font-family:inherit;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
          <div>
            <p style="font-size:13px;color:#6b7280;margin:0 0 6px;">View full details of this assignment.</p>
            <h2 style="font-size:18px;font-weight:700;margin:0 0 4px;">
              Title: ${assignment.title}
            </h2>
          </div>
          <button
            id="duplicate-assignment-btn"
            style="
              display:flex;
              align-items:center;
              gap:6px;
              white-space:nowrap;
              background:#eff6ff;
              color:#2563eb;
              border:1px solid #bfdbfe;
              padding:6px 12px;
              border-radius:8px;
              font-size:13px;
              font-weight:600;
              cursor:pointer;
              margin-right:28px;
            "
            onmouseover="this.style.background='#dbeafe'"
            onmouseout="this.style.background='#eff6ff'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
        <p style="font-size:13px;color:#374151;margin:0 0 20px;line-height:1.6;">
          Description: ${assignment.description ?? "-"}
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
          <div>
            <p style="font-size:11px;color:#9ca3af;margin:0 0 2px;">Type</p>
            <p style="font-size:14px;font-weight:500;margin:0;">${assignment.type}</p>
          </div>
          <div>
            <p style="font-size:11px;color:#9ca3af;margin:0 0 2px;">Created By</p>
            <p style="font-size:14px;font-weight:500;margin:0;">${assignment.createdBy ?? "-"}</p>
          </div>
          <div>
            <p style="font-size:11px;color:#9ca3af;margin:0 0 2px;">Deadline</p>
            <p style="font-size:14px;font-weight:500;margin:0;">${fmt(assignment.deadline)}</p>
          </div>
          <div>
            <p style="font-size:11px;color:#9ca3af;margin:0 0 2px;">Reward</p>
            <p style="font-size:14px;font-weight:600;color:#16a34a;margin:0;">${assignment.reward ?? 0} points</p>
          </div>
          <div>
            <p style="font-size:11px;color:#9ca3af;margin:0 0 2px;">Created At</p>
            <p style="font-size:14px;font-weight:500;margin:0;">${fmt(assignment.createdAt)}</p>
          </div>
          <div>
            <p style="font-size:11px;color:#9ca3af;margin:0 0 2px;">Assign To</p>
            <p style="font-size:14px;font-weight:500;margin:0;">${assignment.assignTo ?? "-"}</p>
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <span style="font-size:14px;font-weight:500;margin-right:8px;">Status:</span>
          ${STATUS_BADGE_HTML[status] ?? status}
        </div>

        ${assignment.submitAt ? `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="font-size:14px;font-weight:500;">Submitted At:</span>
          <span style="font-size:14px;">${fmt(assignment.submitAt)}</span>
          ${late ? `<span style="background:#fee2e2;color:#dc2626;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:500;">Late Submit</span>` : ""}
        </div>` : ""}

        ${assignment.finalScore != null ? `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="font-size:14px;font-weight:500;">Final Score:</span>
          <span style="font-size:15px;font-weight:700;color:#2563eb;">${assignment.finalScore}</span>
        </div>` : ""}

        ${submissionSection}
      </div>
    `,
    didOpen: () => {
      const expandBtn = document.getElementById("expand-image-btn");

      expandBtn?.addEventListener("click", () => {
        Swal.fire({
          width: "auto",
          customClass: {
            popup: "bg-transparent shadow-none border-none overflow-visible",
            closeButton: "text-white hover:text-gray-300 focus:shadow-none !absolute !top-4 !right-4 !z-50"
          },
          background: "transparent",
          showCloseButton: true,
          showConfirmButton: false,
          padding: "0",
          html: `
            <div
              style="
                height: 85vh;
                max-width: 90vw;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
              "
            >
              <img
                src="${assignment.submissionUrl}"
                alt="submission"
                style="
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
                  border-radius: 12px;
                  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
                  border: 1px solid rgba(255, 255, 255, 0.15);
                  background: #ffffff;
                "
              />
            </div>
          `,
        });
      });

      // 👇 ปุ่ม Duplicate: ปิด Swal แล้วเรียก callback กลับไปที่ React state
      const duplicateBtn = document.getElementById("duplicate-assignment-btn");
      duplicateBtn?.addEventListener("click", () => {
        Swal.close();
        onDuplicate(assignment);
      });
    },
  });
};

interface AssignmentTableProps {
  assignments: IAssignment[];
  onStatusChange: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
  onDuplicate: (assignment: IAssignment) => void; // 👈 เพิ่มบรรทัดนี้
}

export default function AssignmentTable({
  assignments,
  onStatusChange,
  onDelete,
  onEdit,
  onDuplicate, // 👈 เพิ่มบรรทัดนี้
}: AssignmentTableProps) {
  const handleDelete = async (id: string, title: string) => {
    const result = await Swal.fire({
      title: "ลบ Assignment?",
      text: `"${title}" จะถูกลบออกอย่างถาวร`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (result.isConfirmed) {
      await onDelete(id);
    }
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-10 text-center">No.</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Assign To</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment, index) => {
            const status = (assignment.status ?? "Pending") as AssignmentStatus;
            return (
              <TableRow
                key={assignment.id}
                className="cursor-pointer"
                onDoubleClick={() => handleShowDetail(assignment, onDuplicate)}
              >
                <TableCell className="text-center text-muted-foreground text-sm font-medium">
                  {index + 1}
                </TableCell>

                <TableCell className="font-medium">{assignment.title}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {assignment.type}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {assignment.createdBy ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {assignment.assignTo ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {fmtShort(assignment.deadline)}
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors",
                          STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-border"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_DOT[status])} />
                        {status}
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-36">
                      <DropdownMenuRadioGroup
                        value={status}
                        onValueChange={(v) => onStatusChange(assignment.id, v)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <DropdownMenuRadioItem key={s} value={s} className="text-sm">
                            <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 shrink-0", STATUS_DOT[s])} />
                            {s}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => onEdit(assignment.id)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(assignment.id, assignment.title)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}