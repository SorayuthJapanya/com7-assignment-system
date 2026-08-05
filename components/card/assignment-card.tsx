import { IAssignment } from "@/types/assignment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Coins, CalendarDays, CalendarCheck, Clock, User, Users, AlertCircle, Trophy } from "lucide-react";
import { getEarlyBirdCondition, getBucketDisplay } from "@/lib/early-bird-bonus-table";

interface AssignmentCardProps {
  assignment: IAssignment;
  onSelected: (assignment: IAssignment) => void;
  studentMode?: boolean;
  reviewMode?: boolean;
}

export default function AssignmentCard({
  assignment,
  onSelected,
  studentMode = false,
  reviewMode = false,
}: AssignmentCardProps) {
  const feedbackPresent = !!assignment.feedback;
  const isSubmitted = assignment.submitAt > assignment.createdAt;

  const hasSubmission =
    (!!assignment.submissionUrl && assignment.submissionUrl.trim() !== "") ||
    isSubmitted;

  const shouldTreatAsNotSubmit =
    !hasSubmission || (studentMode && feedbackPresent && assignment.status !== "Approved");
  const resultStatus = shouldTreatAsNotSubmit ? "Not Submit" : assignment.status;

  const isLate = isSubmitted && assignment.submitAt > assignment.deadline;

  // 1. ดักจับการเปลี่ยนแปลงข้อมูลจากหน้า Manage Assignment (เปรียบเทียบค่าเดิมกับค่าปัจจุบัน)
  const originalDeadline = (assignment as any).originalDeadline || null;
  const originalTitle = (assignment as any).originalTitle || null;
  const originalDescription = (assignment as any).originalDescription || null;
  const originalReward = (assignment as any).originalReward || null;

  const isDeadlineChanged =
    (originalDeadline && new Date(assignment.deadline).getTime() !== new Date(originalDeadline).getTime());
  const isTitleChanged = originalTitle && assignment.title !== originalTitle;
  const isDescriptionChanged = originalDescription && assignment.description !== originalDescription;
  const isRewardChanged = originalReward && assignment.reward !== originalReward;

  // ตรวจสอบ Flag รวมว่ามีการแก้ไขจากหน้า Manage หรือไม่
  const isDataChanged = isDeadlineChanged || isTitleChanged || isDescriptionChanged || isRewardChanged || (assignment as any).isUpdated;

  // ครื่องหมายตกใจจะขึ้นเตือนเมื่อ: ถูก Rejected, มี Feedback หรือมีการแก้ไขข้อมูลใดๆ จากหน้า Manage
  // และจะซ่อนอัตโนมัติเมื่อนักศึกษากดส่งงานรอบใหม่ (สถานะกลับไปเป็น Pending หรือ Approved)
  const hasAlert =
    (resultStatus as string) !== "Pending" &&
    (resultStatus as string) !== "Approved" &&
    ((resultStatus as string) === "Rejected" || !!assignment.feedback || isDataChanged);

  // 🆕 Early Bird condition — คำนวณเฉพาะตอน Approved เท่านั้น (ตรงกับ backend ที่ set ค่า null ถ้ายังไม่ approve)
  const earlyBirdCondition =
    resultStatus === "Approved" ? getEarlyBirdCondition(assignment.earlyBirdModifier) : null;

  // 🆕 Bucket display (racing status / record bonus) — คนละ concept กับ
  // earlyBirdCondition ด้านบน (นั่นคือ penalty ที่หักจริง ส่วนนี้คือสถานะ
  // การแข่ง Record Bonus +500 ซึ่งไม่ผูกกับ penalty เลย)
  const bucketInfo =
    resultStatus === "Approved" ? getBucketDisplay(assignment.bucket) : null;

  // 🆕 คะแนนผลลัพธ์ที่แสดงบน badge:
  //   Approved → finalScore + latePenalty (+ Record Bonus ถ้ามี)
  //   อื่น ๆ   → finalScore เดิม หรือ reward
  const displayScore = (() => {
    if (resultStatus !== "Approved") {
      return assignment.finalScore || assignment.reward;
    }

    // ฐาน = adjustedScore (มี late penalty แล้ว) หรือ finalScore ถ้ายังไม่มี
    let total =
      assignment.adjustedScore != null
        ? assignment.adjustedScore
        : (assignment.finalScore ?? 0);

    // รวม Record Bonus +500 เข้าไปในผลลัพธ์
    if (assignment.hasRecordBonus) {
      total += 500;
    }

    return total;
  })();

  const getRemainingDays = () => {
    const now = Date.now();
    const deadlineTime = new Date(assignment.deadline).getTime();
    const diffMs = deadlineTime - now;

    if (diffMs <= 0) return "เลยกำหนดส่งงานแล้ว";

    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `ต้องส่งภายในอีก ${days} วัน ${hours} ชั่วโมง`;
    if (hours > 0) return `ต้องส่งภายในอีก ${hours} ชั่วโมง ${minutes} นาที`;
    return `ต้องส่งภายในอีก ${minutes} นาทีสุดท้าย`;
  };

  const getDelay = () => {
    const diffMs = new Date(assignment.submitAt).getTime() - new Date(assignment.deadline).getTime();
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    if (days > 0) return `${days}d ${time}`;
    return time;
  };

  const getRemainingTime = () => {
    const now = Date.now();
    const deadlineTime = new Date(assignment.deadline).getTime();
    const diffMs = deadlineTime - now;
    if (diffMs <= 0) return "เลยกำหนดส่งงานแล้ว";

    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `ต้องส่งภายในอีก ${days} วัน ${hours} ชั่วโมง`;
    if (hours > 0) return `ต้องส่งภายในอีก ${hours} ชั่วโมง ${minutes} นาที`;
    return `ต้องส่งภายในอีก ${minutes} นาทีสุดท้าย`;
  };

  const isDeadlineOverdue = new Date(assignment.deadline).getTime() < Date.now();

  const isNotSubmit = resultStatus === "Not Submit";
  const showAlertBox = hasAlert && !(isNotSubmit && feedbackPresent);

  const getStatusStyle = (status: string) => {
    if (status === "Pending") {
      return "bg-amber-100 text-amber-800";
    }
    switch (status) {
      case "Not Submit": return "bg-amber-100 text-amber-900 border border-amber-200";
      case "Approved": return "bg-emerald-100 text-emerald-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const StatusBadge = () => {
    const badge = (
      <span className={`${getStatusStyle(resultStatus)} px-3 py-0.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0`}>
        {resultStatus}
      </span>
    );

    return resultStatus === "Not Submit" ? (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent sideOffset={4}>
          {getRemainingTime()}
        </TooltipContent>
      </Tooltip>
    ) : (
      badge
    );
  };

  return (
    <Card
      className="rounded-xl hover:shadow-md hover:scale-[1.02] hover:shadow-primary/10 transition-all duration-200 active:scale-[0.98] cursor-pointer"
      onClick={() => onSelected(assignment)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-medium leading-snug line-clamp-1 max-w-[160px]">
            {assignment.title}
          </CardTitle>

          {/* เครื่องหมายตกใจสีแดง แสดงข้างขวาใกล้ปุ่ม Score */}
          <div className="flex items-center gap-1.5 shrink-0">
            {hasAlert && (
              <div title="ระบบแจ้งเตือน: มีการปรับปรุงข้อมูลงานจากระบบ">
                <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
              </div>
            )}
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
              <Coins className="w-3 h-3" />
              {resultStatus === "Approved"
                ? `Score: ${displayScore}`
                : displayScore
                  ? `Score: ${displayScore}`
                  : `${assignment.reward}`}
            </div>
          </div>
        </div>

        <CardDescription className="text-xs line-clamp-2 mt-1 leading-relaxed">
          {assignment.description}
        </CardDescription>

        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="inline-flex text-xs bg-secondary/50 border border-border/50 px-2 py-0.5 rounded-md text-muted-foreground">
            <span className="font-medium text-foreground mr-1">By:</span>{assignment.createdBy}
          </span>
          {assignment.assignTo && (
            <span className="inline-flex text-xs bg-secondary/50 border border-border/50 px-2 py-0.5 rounded-md text-muted-foreground">
              <span className="font-medium text-foreground mr-1">To:</span>{assignment.assignTo}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs bg-secondary/50 border border-border/50 px-2 py-0.5 rounded-md text-muted-foreground">
            {assignment.type === "Individual" ? <User className="w-3 h-3 text-primary" /> : <Users className="w-3 h-3 text-primary" />}
            {assignment.type}
          </span>
        </div>

        {earlyBirdCondition && (
          <div
            className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg w-fit ${earlyBirdCondition.colorClass} ${earlyBirdCondition.textColorClass}`}
          >
            <span>{earlyBirdCondition.emoji}</span>
            <span>
              {earlyBirdCondition.modifierLabel} → {assignment.adjustedScore} Points
            </span>
          </div>
        )}

        {/* 🆕 Bucket / Record Bonus badge — แยกจาก earlyBirdCondition ด้านบน
            แสดงเฉพาะ 4 bucket ที่แข่งได้ (super_early/early/before/ontime)
            ถ้า hasRecordBonus = true จะโชว์ว่าได้ +500 ไปแล้ว
            ถ้ายัง = โชว์ว่ากำลังอยู่ในสถานะที่มีสิทธิ์แข่ง */}
        {bucketInfo && bucketInfo.isRacing && (
          <div
            className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg w-fit ${
              assignment.hasRecordBonus
                ? "bg-amber-50 text-amber-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {assignment.hasRecordBonus ? (
              <Trophy className="w-3 h-3" />
            ) : (
              <span>{bucketInfo.emoji}</span>
            )}
            <span>
              {bucketInfo.situation}
              {assignment.hasRecordBonus
                ? " · 🏆 ได้ Record Bonus +500!"
                : " · กำลังแข่งชิง +500"}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-end justify-between gap-2 border-t border-border/50 pt-2.5">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3 h-3 shrink-0" />
              <span className={hasAlert && isDeadlineChanged ? "text-amber-600 font-semibold" : ""}>
                Due: {format(new Date(assignment.deadline), "dd/MM/yyyy HH:mm")}
              </span>
            </div>
            {isSubmitted && (
              <div className="flex items-center gap-1.5">
                <CalendarCheck className="w-3 h-3 shrink-0" />
                <span>Sent: {format(new Date(assignment.submitAt), "dd/MM/yyyy HH:mm")}</span>
              </div>
            )}
            {isLate && (
              <div className="flex items-center gap-1.5 text-red-500"><Clock className="w-3 h-3 shrink-0" /><span>Delay: {getDelay()}</span></div>
            )}
          </div>
          <StatusBadge />
        </div>

        {isNotSubmit && (
          <div className={`mt-3 rounded-xl border p-3 text-sm ${isDeadlineOverdue
              ? "border-red-200/80 bg-red-50 text-red-900"
              : "border-amber-200/80 bg-amber-50 text-amber-900"
            }`}>
            <div className="font-semibold">ยังไม่ได้ส่งงาน</div>
            <div className={`mt-1 text-xs ${isDeadlineOverdue
                ? "text-red-700 font-bold"
                : "text-amber-700"
              }`}>
              {getRemainingTime()}
            </div>
            {assignment.feedback && (
              <div className="mt-3 font-bold text-red-700 text-sm border-t border-red-200/50 pt-2 break-words whitespace-pre-wrap">
                📌 Feedback: {assignment.feedback}
              </div>
            )}
          </div>
        )}

        {/* ── กล่องข้อความแสดงรายการที่แก้ไขจากหน้า Manage Assignment ── */}
        {showAlertBox && (
          <div className="mt-2.5 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg text-[11px] text-red-700 dark:text-red-400 border border-red-100/50 space-y-1">
            <div className="flex items-start gap-1">
              <span className="font-bold shrink-0">⚠️ ข้อมูลมีการอัปเดตใหม่:</span>
              <span>
                {assignment.feedback
                  ? "ผู้ดูแลระบบให้ Feedback โปรดแก้ไขและส่งงานใหม่"
                  : resultStatus === "Rejected"
                    ? "งานของคุณไม่ผ่านการอนุมัติ (Rejected) โปรดตรวจแก้ชิ้นงาน"
                    : "ผู้ดูแลระบบได้เข้ามาแก้ไขรายละเอียดข้อมูลงานนี้"}
              </span>
            </div>

            <div className="text-orange-600 dark:text-orange-400 font-semibold pl-4 text-[10.5px] flex items-center gap-1">
              <Clock className="w-3 h-3 shrink-0 text-orange-500" />
              <span>กำหนดส่ง: {getRemainingDays()}</span>
            </div>

            {/* รายการแสดงผลความเปลี่ยนแปลงเจาะจงรายฟิลด์ */}
            <div className="pl-4 text-muted-foreground text-[10.5px] space-y-0.5">
              {isTitleChanged && <div>• มีการแก้ไข <span className="font-medium text-foreground">"ชื่อหัวข้อชื่องาน"</span></div>}
              {isDescriptionChanged && <div>• มีการแก้ไข <span className="font-medium text-foreground">"รายละเอียดคำสั่งงาน (Description)"</span></div>}
              {isRewardChanged && <div>• มีการปรับเปลี่ยน <span className="font-medium text-foreground">"คะแนน/Reward"</span> ของงาน</div>}
              {isDeadlineChanged && originalDeadline && (
                <div>
                  • ขยายเวลา Due date: <span className="line-through">{format(new Date(originalDeadline), "dd/MM/yyyy HH:mm")}</span> ➔ <span className="text-amber-600 font-medium">{format(new Date(assignment.deadline), "dd/MM/yyyy HH:mm")}</span>
                </div>
              )}
            </div>

            {/* ข้อความ Feedback แนบท้ายตัวเดิม */}
            {assignment.feedback && (
              <div className="pl-4 text-foreground/80 italic border-l border-red-200/50 ml-1.5 mt-1">
                • หมายเหตุเพิ่มเติม: "{assignment.feedback}"
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}