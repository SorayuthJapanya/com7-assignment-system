"use client";
// 🎯 ประกาศไว้ด้านบนสุดของไฟล์ (อยู่นอกฟังก์ชันทั้งหมด) เพื่อให้ทุกส่วนดึงไปใช้งานได้ร่วมกัน
const selectStyle: React.CSSProperties = {
  height: 34,
  paddingLeft: 12,
  paddingRight: 28,
  borderRadius: 8,
  border: "1.5px solid #e2e8f0",
  fontSize: 13,
  fontWeight: 600,
  color: "#4f46e5",
  background: "#fff",
  cursor: "pointer",
  outline: "none",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
};

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Trophy, Target, Star, CheckCircle2, Clock, AlertCircle,
  ChevronDown, X, Search, Calendar,
  ChevronUp, ChevronRight, ChevronLeft, TrendingUp
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine
} from "recharts";
import type { UserDashboardResponse } from "@/types/dashboard";
import { useAuthUser } from "@/contexts/auth-context";
import { IUser } from "@/types/auth";
import { usePublicLeaderboard } from "@/hooks/use-leaderboard";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiStatus = "Approved" | "Rejected" | "Pending" | "In Progress";
type DisplayStatus = "Completed" | "Pending" | "Rejected" | "Not Submit";
type TimeFilter = "Today" | "Weekly" | "Monthly" | "All Time";

interface Assignment {
  id: number;
  title: string;
  description?: string;
  type: "Individual" | "Group";
  deadline: string;
  status: ApiStatus;
  submissionUrl?: string;
  feedback?: string;
  reward: number;
  finalScore?: number | null;
  assignTo?: string;
  createdBy?: string;
}

interface Badge {
  id: number;
  name: string;
  nameEn?: string;
  icon?: string;
  color?: string;
  description?: string;
}

function formatOverdueText(seconds: number) {
  const roundedSeconds = Math.round(seconds);
  if (roundedSeconds <= 0) return "0m";

  const totalMinutes = Math.floor(roundedSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${remainingHours}h ${remainingMinutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${totalMinutes}m`;
}

function parseMonthEntry(d: { month: string; score: number; year?: number }) {
  if (/^\d{4}-\d{2}$/.test(d.month)) {
    const [y, m] = d.month.split("-");
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", { month: "short" });
    return { monthLabel: label, year: Number(y), score: d.score };
  }
  return { monthLabel: d.month, year: d.year ?? new Date().getFullYear(), score: d.score };
}

interface UserDashboardProps {
  year?: number | null;
  month?: number | null;
}

const LEVEL_CONFIGS = [
  { level: 1, role: "Rookie", minXp: 0, maxXp: 500, badge: "👶🏻", color: "#7c3aed" },
  { level: 2, role: "Beginner", minXp: 501, maxXp: 1000, badge: "🏃🏻", color: "#7c3aed" },
  { level: 3, role: "Starter", minXp: 1001, maxXp: 1500, badge: "🐓", color: "#7c3aed" },
  { level: 4, role: "Contributor", minXp: 1501, maxXp: 2000, badge: "🏍️", color: "#0891b2" },
  { level: 5, role: "Performer", minXp: 2001, maxXp: 2500, badge: "🛩️", color: "#0891b2" },
  { level: 6, role: "Active Performer", minXp: 2501, maxXp: 3000, badge: "🚀", color: "#0891b2" },
  { level: 7, role: "Strong Performer", minXp: 3001, maxXp: 3500, badge: "🎟️", color: "#db2777" },
  { level: 8, role: "Key Contributor", minXp: 3501, maxXp: 4000, badge: "🎫", color: "#db2777" },
  { level: 9, role: "High Performer", minXp: 4001, maxXp: 4500, badge: "🎗️", color: "#db2777" },
  { level: 10, role: "Advanced Performer", minXp: 4501, maxXp: 5200, badge: "🔥", color: "#2563eb" },
  { level: 11, role: "Expert", minXp: 5201, maxXp: 5900, badge: "🌀", color: "#2563eb" },
  { level: 12, role: "Senior Expert", minXp: 5901, maxXp: 6600, badge: "❄️", color: "#2563eb" },
  { level: 13, role: "Top Performer", minXp: 6601, maxXp: 8000, badge: "⚜️", color: "#b45309" },
  { level: 14, role: "Elite Performer", minXp: 8001, maxXp: 9500, badge: "🔱", color: "#b45309" },
  { level: 15, role: "Legend", minXp: 9501, maxXp: 10500, badge: "👑", color: "#b45309" },
];

const STATUS_STYLE: Record<DisplayStatus, { bg: string; text: string; dot: string; label: string }> = {
  Completed: { bg: "#dcfce7", text: "#15803d", dot: "#22c55e", label: "Completed" },
  Pending: { bg: "#dbeafe", text: "#1d4ed8", dot: "#3b82f6", label: "Pending" },
  Rejected: { bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444", label: "Rejected" },
  "Not Submit": { bg: "#fef9c3", text: "#a16207", dot: "#eab308", label: "Not Submit" },
};

const DEFAULT_MOCK_BADGES: Badge[] = [
  { id: 1, name: "เสร็จไวที่สุด", nameEn: "Fast Finisher", icon: "⚡", color: "#7c3aed" },
  { id: 2, name: "ส่งงานตรงเวลา", nameEn: "On-time Hero", icon: "🎯", color: "#22c55e" },
  { id: 3, name: "คะแนนสูง", nameEn: "High Scorer", icon: "🔥", color: "#f59e0b" },
  { id: 4, name: "ต่อเนื่อง", nameEn: "Consistent", icon: "🛡️", color: "#3b82f6" },
];

function sanitizeBadge(badge: Badge): Badge {
  const sanitized = { ...badge };
  if (!sanitized.icon || sanitized.icon.startsWith("http") || sanitized.icon.length > 2) {
    const emojiMap: Record<string, string> = {
      "Fast Finisher": "⚡",
      "On-time Hero": "🎯",
      "High Scorer": "🔥",
      Consistent: "🛡️",
      Rookie: "👶🏻",
      Expert: "🎓",
      Master: "👑",
    };
    sanitized.icon = emojiMap[sanitized.nameEn || ""] || "⭐";
  }
  return sanitized;
}

function getDaysUntilDue(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(deadline);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / 86400000);
}

function toDisplayStatus(a: Assignment): DisplayStatus {
  if (a.status === "Approved") return "Completed";
  if (a.status === "Rejected") return "Rejected";
  const hasFeedback = !!(a.feedback && a.feedback.trim() !== "");
  if (hasFeedback) return "Not Submit";
  const hasSubmission = !!(a.submissionUrl && a.submissionUrl.trim() !== "");
  if (hasSubmission && a.status === "Pending") return "Pending";
  return "Not Submit";
}

function getLevelProgress(currentXp: number) {
  let cfg = LEVEL_CONFIGS[0];
  for (const c of LEVEL_CONFIGS) {
    if (currentXp >= c.minXp) cfg = c;
    else break;
  }
  const range = cfg.maxXp - cfg.minXp;
  const earned = currentXp - cfg.minXp;
  const pct = range > 0 ? Math.min(100, Math.round((earned / range) * 100)) : 100;
  return {
    level: cfg.level, role: cfg.role, badge: cfg.badge, color: cfg.color,
    maxXp: cfg.maxXp, xpPct: pct, xpRemaining: Math.max(0, cfg.maxXp - currentXp),
  };
}

function getUserAssignmentCounts(assignments: Array<Assignment & { _display: DisplayStatus }>) {
  const counts: Record<DisplayStatus | "All", number> = {
    All: 0, Completed: 0, Pending: 0, Rejected: 0, "Not Submit": 0,
  };
  assignments.forEach(a => {
    counts.All += 1;
    counts[a._display] += 1;
  });
  return counts;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatToDDMMYYYY(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

function DatePicker({
  value,
  onChange,
  placeholder = "DD-MM-YYYY",
}: {
  value: string;
  onChange: (isoValue: string) => void;
  placeholder?: string;
}) {
  const [display, setDisplay] = useState(value ? formatToDDMMYYYY(value) : "");
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplay(value ? formatToDDMMYYYY(value) : "");
  }, [value]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value;
    onChange(isoDate || "");
    setDisplay(isoDate ? formatToDDMMYYYY(isoDate) : "");
  };

  const openPicker = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.focus();
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <input
        ref={dateInputRef}
        type="date"
        value={value || ""}
        onChange={handleDateChange}
        style={{
          position: "absolute",
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      />
      <div
        onClick={openPicker}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "1.5px solid #e2e8f0",
          borderRadius: 8,
          padding: "8px 12px",
          background: "#fff",
          cursor: "pointer",
          minWidth: 120,
          height: 36,
          userSelect: "none",
        }}
      >
        <Calendar size={16} color="#64748b" />
        <span style={{ fontSize: 13, color: value ? "#0f172a" : "#94a3b8", flex: 1, textAlign: "center" }}>
          {display || placeholder}
        </span>
      </div>
    </div >
  );
}

function getCountdownString(deadlineIso: string): { text: string; isCritical: boolean; isOverdue: boolean } {
  const diffMs = new Date(deadlineIso).getTime() - new Date().getTime();
  if (diffMs <= 0) {
    return { text: "Overdue (เลยกำหนดส่งแล้ว)", isCritical: true, isOverdue: true };
  }
  const totalSecs = Math.floor(diffMs / 1000);
  const totalMins = Math.floor(totalSecs / 60);
  const totalHours = Math.floor(totalMins / 60);
  const days = Math.floor(totalHours / 24);
  const displayHours = totalHours % 24;
  const displayMins = totalMins % 60;
  const displaySecs = totalSecs % 60;
  if (days === 0) {
    const pad = (num: number) => String(num).padStart(2, "0");
    return {
      text: `เหลือเวลาส่ง ${pad(displayHours)} : ${pad(displayMins)} : ${pad(displaySecs)} น.`,
      isCritical: true,
      isOverdue: false,
    };
  }
  return {
    text: `เหลือเวลาอีก ${days} วัน ${displayHours} ชั่วโมง`,
    isCritical: false,
    isOverdue: false,
  };
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon, iconBg, iconColor, label, value, sub, subColor }: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  label: string; value: React.ReactNode; sub?: React.ReactNode; subColor?: string;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16, flex: "1 1 240px", minWidth: 240 }}>
      <div style={{ background: iconBg, padding: 12, borderRadius: 12, flexShrink: 0, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.06em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</p>
        <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: "#0f172a", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</p>
        {sub && <p style={{ margin: "4px 0 0", fontSize: 12, color: subColor ?? "#64748b", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Upcoming Task Card ───────────────────────────────────────────────────────

function UpcomingTaskCard({ tasks, onTriggerSubmit }: { tasks: Array<Assignment & { _display: DisplayStatus }>; onTriggerSubmit: (id: number) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    const timer = setInterval(() => { setTicker(prev => prev + 1); }, 1000);
    return () => clearInterval(timer);
  }, [tasks]);

  const urgentTasksIn24Hours = useMemo(() => {
    if (!tasks) return [];

    const now = new Date();
    const todayStr = now.toDateString();

    return tasks.filter(task => {
      const taskDeadline = new Date(task.deadline);
      const diffMs = taskDeadline.getTime() - now.getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      const isUrgent = diffMs > 0 && diffMs <= oneDayInMs;
      const isTaskFromToday = taskDeadline.toDateString() === todayStr;
      const isSubmittedToday = isTaskFromToday && (task._display === "Pending" || task._display === "Completed");

      return isUrgent || isSubmittedToday;
    });
  }, [tasks, ticker]);

  if (!urgentTasksIn24Hours || urgentTasksIn24Hours.length === 0) {
    return (
      <div style={{ background: "#ffffff", borderRadius: 24, padding: "32px 24px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.01)", textAlign: "center", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <div style={{ fontSize: 40, margin: 0 }}>🎉</div>
        <h4 style={{ margin: "4px 0 0", fontSize: 16, color: "#0f172a", fontWeight: 700 }}>You're all caught up!</h4>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>ไม่มีงานด่วนที่ต้องส่งภายใน 24 ชั่วโมงนี้</p>
      </div>
    );
  }

  const safeIndex = currentIndex >= urgentTasksIn24Hours.length ? 0 : currentIndex;
  const currentTask = urgentTasksIn24Hours[safeIndex];

  const isSubmitted = currentTask._display === "Pending" || currentTask._display === "Completed";
  const countdown = getCountdownString(currentTask.deadline);

  const handleNext = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % urgentTasksIn24Hours.length); };
  const handlePrev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + urgentTasksIn24Hours.length) % urgentTasksIn24Hours.length); };

  if (isSubmitted) {
    const isPendingStatus = currentTask._display === "Pending";

    const theme = {
      background: isPendingStatus
        ? "linear-gradient(135deg, #ffffff 0%, #f0f6ff 100%)"
        : "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
      borderColor: isPendingStatus ? "#bfdbfe" : "#bbf7d0",
      shadow: isPendingStatus ? "rgba(37, 99, 235, 0.05)" : "rgba(22, 163, 74, 0.05)",
      badgeBg: isPendingStatus ? "#2563eb" : "#16a34a",
      badgeText: "#ffffff",
      accentColor: isPendingStatus ? "#2563eb" : "#16a34a",
      textColor: isPendingStatus ? "#1e3a8a" : "#14532d",
      tagBg: isPendingStatus ? "#dbeafe" : "#dcfce7",
      tagText: isPendingStatus ? "#1e40af" : "#16a34a",
    };

    return (
      <div style={{
        background: theme.background,
        borderRadius: 24,
        padding: "24px",
        boxShadow: `0 10px 25px -5px ${theme.shadow}`,
        border: `1px solid ${theme.borderColor}`,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        position: "relative",
        transition: "all 0.3s ease"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {isPendingStatus ? <span style={{ fontSize: 14 }}>⏳</span> : <CheckCircle2 size={16} color={theme.accentColor} />}
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: theme.accentColor, letterSpacing: "0.05em" }}>
              {isPendingStatus ? "PENDING REVIEW" : "MISSION COMPLETED"}
            </p>
            {urgentTasksIn24Hours.length > 1 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: theme.tagText, background: theme.tagBg, padding: "2px 8px", borderRadius: 6 }}>
                {safeIndex + 1}/{urgentTasksIn24Hours.length} งานด่วน
              </span>
            )}
          </div>
          <div style={{ background: theme.badgeBg, padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: theme.badgeText }}>
            {isPendingStatus ? "Submitted" : "ส่งงานแล้ว"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingRight: urgentTasksIn24Hours.length > 1 ? "0px" : "0px" }}>
          <h4 style={{
            margin: "0 0 4px",
            fontSize: 18,
            fontWeight: 700,
            color: theme.textColor,
            letterSpacing: "-0.01em",
            lineHeight: 1.4,
            textDecoration: isPendingStatus ? "none" : "line-through",
            opacity: isPendingStatus ? 1 : 0.7
          }}>
            {currentTask.title}
          </h4>
          <p style={{ margin: 0, fontSize: 12, color: theme.accentColor, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            {isPendingStatus ? <><span>📝</span> กำลังรอเจ้าหน้าที่ตรวจสอบผลงานของคุณ</> : <><span>✨</span> งานของคุณได้รับการตรวจสอบแล้ว</>}
          </p>
        </div>

        {urgentTasksIn24Hours.length > 1 && (
          <div style={{ display: "flex", gap: 6, alignSelf: "flex-end", marginTop: -8 }}>
            <button onClick={handlePrev} style={{ background: "#fff", border: `1px solid ${theme.borderColor}`, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32 }}>
              <ChevronLeft size={14} color={theme.accentColor} />
            </button>
            <button onClick={handleNext} style={{ background: "#fff", border: `1px solid ${theme.borderColor}`, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32 }}>
              <ChevronRight size={14} color={theme.accentColor} />
            </button>
          </div>
        )}

        <button
          onClick={() => onTriggerSubmit(currentTask.id)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            border: isPendingStatus ? "none" : `1px solid ${theme.accentColor}`,
            background: isPendingStatus ? "#2563eb" : "#ffffff",
            color: isPendingStatus ? "#ffffff" : theme.accentColor,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s",
            marginTop: 4
          }}
          onMouseEnter={e => {
            if (!isPendingStatus) {
              e.currentTarget.style.background = theme.accentColor;
              e.currentTarget.style.color = "#ffffff";
            } else {
              e.currentTarget.style.background = "#1d4ed8";
            }
          }}
          onMouseLeave={e => {
            if (!isPendingStatus) {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.color = theme.accentColor;
            } else {
              e.currentTarget.style.background = "#2563eb";
            }
          }}
        >
          View Submission
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #fff5f5 100%)", borderRadius: 24, padding: "24px", boxShadow: "0 10px 30px -5px rgba(225, 29, 72, 0.08)", border: "1px solid #ffe4e6", display: "flex", flexDirection: "column", gap: 14, position: "relative", transition: "all 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14 }}>🚨</span>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#dc2626", letterSpacing: "0.05em" }}>URGENT TASK</p>
          {urgentTasksIn24Hours.length > 1 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", background: "#ffe4e6", padding: "2px 8px", borderRadius: 6 }}>
              {safeIndex + 1}/{urgentTasksIn24Hours.length} งานด่วน
            </span>
          )}
        </div>
        <div style={{ background: "#ffe4e6", padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#dc2626" }}>
          {countdown.isOverdue ? "Overdue" : "Expires Soon"}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {!countdown.isOverdue && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <span>⏰</span>
            <p style={{ margin: 0, fontSize: 13, color: "#dc2626", fontWeight: 700, fontFamily: "monospace", wordBreak: "break-all" }}>{countdown.text}</p>
          </div>
        )}
        <div>
          <h4 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", lineHeight: 1.4 }}>{currentTask.title}</h4>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
            <Clock size={14} style={{ color: "#94a3b8" }} /> {formatDate(currentTask.deadline)}
          </p>
        </div>
      </div>

      {urgentTasksIn24Hours.length > 1 && (
        <div style={{ display: "flex", gap: 6, alignSelf: "flex-end", marginTop: -4 }}>
          <button onClick={handlePrev} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32 }}>
            <ChevronLeft size={14} color="#64748b" />
          </button>
          <button onClick={handleNext} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32 }}>
            <ChevronRight size={14} color="#64748b" />
          </button>
        </div>
      )}

      <button
        onClick={() => onTriggerSubmit(currentTask.id)}
        disabled={countdown.isOverdue}
        style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: countdown.isOverdue ? "#94a3b8" : "#dc2626", color: "#fff", fontSize: 14, fontWeight: 700, cursor: countdown.isOverdue ? "default" : "pointer", transition: "background 0.2s", boxShadow: countdown.isOverdue ? "none" : "0 4px 12px rgba(220, 38, 38, 0.2)", marginTop: 4 }}
        onMouseEnter={e => { if (!countdown.isOverdue) e.currentTarget.style.background = "#b91c1c"; }}
        onMouseLeave={e => { if (!countdown.isOverdue) e.currentTarget.style.background = "#dc2626"; }}
      >
        {countdown.isOverdue ? "Submission Closed" : "Submit Assignment"}
      </button>
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DisplayStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{ background: s.bg, color: s.text, fontSize: 12, padding: "3px 10px", borderRadius: 999, fontWeight: 600, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

// ─── Assignment Row ───────────────────────────────────────────────────────────

function AssignmentRow({ a, expanded, onToggle }: {
  a: Assignment & { _display: DisplayStatus };
  expanded: boolean;
  onToggle: () => void;
}) {
  const s = STATUS_STYLE[a._display];
  const days = getDaysUntilDue(a.deadline);
  return (
    <>
      {/* Table Row Style for Desktop */}
      <tr
        id={`assignment-row-${a.id}`}
        onClick={onToggle}
        className="desktop-row"
        style={{ borderBottom: expanded ? "none" : "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <td style={{ padding: "14px 12px 14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontSize: 14, color: "#0f172a", fontWeight: 500 }}>{a.title}</span>
          </div>
        </td>
        <td style={{ padding: "14px 12px", fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Calendar size={12} style={{ opacity: 0.6 }} /> {formatDate(a.deadline)}
          </div>
          {a._display !== "Completed" && (
            <p style={{ margin: "2px 0 0 17px", fontSize: 11, color: days < 0 ? "#ef4444" : days <= 3 ? "#f59e0b" : "#94a3b8", fontWeight: 500 }}>
              {days < 0 ? (a._display === "Rejected" ? `${Math.abs(days)}d rejected` : `${Math.abs(days)}d not submit`) : days === 0 ? "Due today" : `${days}d left`}
            </p>
          )}
        </td>
        <td style={{ padding: "14px 12px" }}><StatusBadge status={a._display} /></td>
        <td style={{ padding: "14px 12px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#0f172a", width: "10%" }}>
          {a._display === "Completed" ? `+${(a.finalScore !== undefined && a.finalScore !== null) ? a.finalScore : a.reward}` : "–"}
        </td>
        <td style={{ padding: "14px 16px 14px 4px", textAlign: "center", color: "#94a3b8" }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>

      {/* Mobile Card Layout Style (Handled via dynamic responsive style block below) */}
      <tr className="mobile-card-row" style={{ display: "none" }}>
        <td colSpan={5} style={{ padding: "12px" }}>
          <div onClick={onToggle} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{a.title}</span>
              </div>
              {expanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Calendar size={12} /> {formatDate(a.deadline)}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <StatusBadge status={a._display} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  {a._display === "Completed" ? `+${(a.finalScore !== undefined && a.finalScore !== null) ? a.finalScore : a.reward} XP` : "–"}
                </span>
              </div>
            </div>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
          <td colSpan={5} style={{ padding: "12px 16px 16px 16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
              <div>
                <span style={{ color: "#94a3b8", display: "block", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>DESCRIPTION</span>
                <span style={{ color: "#475569", fontSize: 13, lineHeight: 1.5, wordBreak: "break-word" }}>{a.description || "No description provided."}</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "12px 16px", fontSize: 13 }}>
              <div>
                <span style={{ color: "#94a3b8", display: "block", fontSize: 11, marginBottom: 2 }}>STATUS</span>
                <span style={{ color: "#475569", fontWeight: 500 }}>{a.status}</span>
              </div>
              <div>
                <span style={{ color: "#94a3b8", display: "block", fontSize: 11, marginBottom: 2 }}>DEADLINE</span>
                <span style={{ color: "#475569", fontWeight: 500 }}>{formatDate(a.deadline)}</span>
              </div>
              <div>
                <span style={{ color: "#94a3b8", display: "block", fontSize: 11, marginBottom: 2 }}>XP REWARD</span>
                <span style={{ color: a._display === "Completed" ? "#7c3aed" : "#94a3b8", fontWeight: 700 }}>
                  {a._display === "Completed" ? `${a.reward} XP` : `${a.reward} XP (pending)`}
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── View All Dialog ──────────────────────────────────────────────────────────

function ViewAllDialog({ assignments, onClose }: { assignments: Array<Assignment & { _display: DisplayStatus }>; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | "All">("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [dialogTimeFilter, setDialogTimeFilter] = useState<TimeFilter>("All Time");

  const toDateObject = (value: string, endOfDay = false) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    if (isNaN(date.getTime())) return null;
    if (endOfDay) date.setHours(23, 59, 59, 999);
    return date;
  };

  const timeFiltered = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return assignments.filter(a => {
      const deadline = new Date(a.deadline);
      deadline.setHours(0, 0, 0, 0);
      if (dialogTimeFilter === "Today") return deadline.getTime() === now.getTime();
      if (dialogTimeFilter === "Weekly") {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 6);
        return deadline >= now && deadline <= weekEnd;
      }
      if (dialogTimeFilter === "Monthly") return deadline.getFullYear() === now.getFullYear() && deadline.getMonth() === now.getMonth();
      return true;
    });
  }, [assignments, dialogTimeFilter]);

  const visibleAssignments = useMemo(() => {
    const fromDate = toDateObject(dateFrom);
    const toDate = toDateObject(dateTo, true);
    return timeFiltered.filter(a => {
      const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
      const deadlineDate = new Date(a.deadline);
      const matchFrom = !fromDate || deadlineDate >= fromDate;
      const matchTo = !toDate || deadlineDate <= toDate;
      return matchSearch && matchFrom && matchTo;
    });
  }, [timeFiltered, search, dateFrom, dateTo]);

  const filtered = useMemo(() => visibleAssignments.filter(a => statusFilter === "All" || a._display === statusFilter), [visibleAssignments, statusFilter]);

  const toggle = (id: number) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const pills: Array<DisplayStatus | "All"> = ["All", "Completed", "Pending", "Rejected", "Not Submit"];

  const counts = useMemo(() => ({
    All: visibleAssignments.length,
    Completed: visibleAssignments.filter(a => a._display === "Completed").length,
    Pending: visibleAssignments.filter(a => a._display === "Pending").length,
    Rejected: visibleAssignments.filter(a => a._display === "Rejected").length,
    "Not Submit": visibleAssignments.filter(a => a._display === "Not Submit").length,
  }), [visibleAssignments]);

  const selectStyle: React.CSSProperties = {
    height: 32, paddingLeft: 12, paddingRight: 28, borderRadius: 8,
    border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 600,
    color: "#4f46e5", background: "#fff", cursor: "pointer", outline: "none", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
  };

  const hasDateFilter = !!dateFrom || !!dateTo;

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 780, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 0", borderBottom: "1px solid #f1f5f9", paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>All Assignments</h2>
            <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={15} color="#64748b" />
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexDirection: "column" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search assignments..."
                style={{ width: "100%", paddingLeft: 32, paddingRight: 12, height: 36, borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", width: "100%" }}>
              <Calendar size={13} style={{ color: "#64748b" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>From</span>
                <DatePicker value={dateFrom} onChange={setDateFrom} />
                <span style={{ fontSize: 12, color: "#64748b" }}>To</span>
                <DatePicker value={dateTo} onChange={setDateTo} />
              </div>
              {hasDateFilter && (
                <button onClick={() => { setDateFrom(""); setDateTo(""); }} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {pills.map(p => {
                const active = statusFilter === p;
                const style_dot = p !== "All" ? STATUS_STYLE[p as DisplayStatus] : null;
                return (
                  <button key={p} onClick={() => setStatusFilter(p)} style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500, cursor: "pointer", border: active ? "1.5px solid #c7d2fe" : "1.5px solid #e2e8f0", background: active ? "#eef2ff" : "#fff", color: active ? "#4f46e5" : "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                    {style_dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: style_dot.dot, flexShrink: 0 }} />}
                    {p} <span style={{ color: active ? "#818cf8" : "#94a3b8", fontWeight: 400 }}>({counts[p as keyof typeof counts] ?? 0})</span>
                  </button>
                );
              })}
            </div>

            <select value={dialogTimeFilter} onChange={e => { setDialogTimeFilter(e.target.value as TimeFilter); setStatusFilter("All"); }} style={selectStyle}>
              <option value="Today">Today</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="All Time">All Time</option>
            </select>
          </div>
        </div>

        <div style={{ padding: "10px 20px", fontSize: 12, color: "#94a3b8", borderBottom: "1px solid #f8fafc" }}>
          Showing {filtered.length} of {assignments.length} assignments
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "4px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No assignments match your filters</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead className="desktop-header" style={{ position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px 10px 16px", fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em" }}>ASSIGNMENT</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em" }}>DUE DATE</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em" }}>STATUS</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em" }}>XP</th>
                  <th style={{ width: 32 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const isExpanded = expanded.has(a.id);
                  const s = STATUS_STYLE[a._display];
                  const days = getDaysUntilDue(a.deadline);
                  return (
                    <tr key={`item-${a.id}`} style={{ borderBottom: isExpanded ? "none" : "1px solid #f1f5f9" }}>
                      <td colSpan={5} style={{ padding: 0 }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            {/* Desktop view row */}
                            <tr className="desktop-row" onClick={() => toggle(a.id)} style={{ cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                              <td style={{ padding: "14px 12px 14px 16px", width: "40%" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                                  <span style={{ fontSize: 14, color: "#0f172a", fontWeight: 500 }}>{a.title}</span>
                                </div>
                              </td>
                              <td style={{ padding: "14px 12px", fontSize: 13, color: "#64748b", whiteSpace: "nowrap", width: "25%" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                  <Calendar size={12} style={{ opacity: 0.6 }} /> {formatDate(a.deadline)}
                                </div>
                                {a._display !== "Completed" && (
                                  <p style={{ margin: "2px 0 0 17px", fontSize: 11, color: days < 0 ? "#ef4444" : days <= 3 ? "#f59e0b" : "#94a3b8", fontWeight: 500 }}>
                                    {days < 0 ? (a._display === "Rejected" ? `${Math.abs(days)}d rejected` : `${Math.abs(days)}d not submit`) : days === 0 ? "Due today" : `${days}d left`}
                                  </p>
                                )}
                              </td>
                              <td style={{ padding: "14px 12px", width: "20%" }}><StatusBadge status={a._display} /></td>
                              <td style={{ padding: "14px 12px", textAlign: "right", fontSize: 14, fontWeight: 700, color: a.reward ? "#0f172a" : "#cbd5e1", width: "10%" }}>
                                {a._display === "Completed" ? `+${a.reward}` : "–"}
                              </td>
                              <td style={{ padding: "14px 16px 14px 4px", textAlign: "center", color: "#94a3b8", width: "5%" }}>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </td>
                            </tr>

                            {/* Mobile card view row */}
                            <tr className="mobile-card-row" style={{ display: "none" }}>
                              <td colSpan={5} style={{ padding: "8px 12px" }}>
                                <div onClick={() => toggle(a.id)} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                                    <span style={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{a.title}</span>
                                    {isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                                    <div style={{ fontSize: 12, color: "#64748b" }}>{formatDate(a.deadline)}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <StatusBadge status={a._display} />
                                      <span style={{ fontWeight: 700, fontSize: 13 }}>{a._display === "Completed" ? `+${a.reward} XP` : "–"}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr style={{ background: "#f8fafc" }}>
                                <td colSpan={5} style={{ padding: "14px 16px 16px" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16, borderBottom: "1px dashed #e2e8f0", paddingBottom: 16 }}>
                                    <div>
                                      <span style={{ color: "#94a3b8", display: "block", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>TITLE</span>
                                      <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 600 }}>{a.title}</span>
                                    </div>
                                    <div>
                                      <span style={{ color: "#94a3b8", display: "block", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>DESCRIPTION</span>
                                      <span style={{ color: "#475569", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-line", wordBreak: "break-word" }}>{a.description || "No description provided for this assignment."}</span>
                                    </div>
                                  </div>
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "12px 16px", fontSize: 13 }}>
                                    <div><span style={{ color: "#94a3b8", display: "block", fontSize: 11, marginBottom: 2 }}>STATUS</span><span style={{ color: "#475569", fontWeight: 500 }}>{a.status}</span></div>
                                    <div><span style={{ color: "#94a3b8", display: "block", fontSize: 11, marginBottom: 2 }}>DEADLINE</span><span style={{ color: "#475569", fontWeight: 500 }}>{formatDate(a.deadline)}</span></div>
                                    <div><span style={{ color: "#94a3b8", display: "block", fontSize: 11, marginBottom: 2 }}>XP REWARD</span><span style={{ color: a._display === "Completed" ? "#7c3aed" : "#94a3b8", fontWeight: 700 }}>{a._display === "Completed" ? `${a.reward} XP` : `${a.reward} XP (pending)`}</span></div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── View All Badges Dialog ───────────────────────────────────────────────────

function ViewAllBadgesDialog({ badges, onClose }: { badges: Badge[]; onClose: () => void }) {
  const sanitizedBadges = useMemo(() => badges.map(sanitizeBadge), [badges]);
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>ตราประทับรางวัลทั้งหมด (My Badges)</h2>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>สถิติและรางวัลความสำเร็จสะสมรายบุคคล</p>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={14} color="#64748b" />
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {sanitizedBadges.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>คุณยังไม่ได้รับรางวัลความสำเร็จในขณะนี้</div>
          ) : (
            sanitizedBadges.map(b => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: "1px solid #f1f5f9", borderRadius: 12, background: "#fcfdfe" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: `2px solid ${b.color}20`, flexShrink: 0 }}>{b.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{b.nameEn}</p>
                    <span style={{ fontSize: 10, fontWeight: 600, color: b.color, background: `${b.color}10`, padding: "1px 6px", borderRadius: 6 }}>{b.name}</span>
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.4, wordBreak: "break-word" }}>{b.description || `ผ่านเกณฑ์ภารกิจสำเร็จรูปสอดคล้องตามเกณฑ์ประเมินกลุ่มงาน ${b.nameEn}`}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none", transition: "all 0.15s", background: active ? "#eef2ff" : "#f1f5f9", color: active ? "#4f46e5" : "#64748b", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

// ─── Rank Movement Chart ──────────────────────────────────────────────────────

interface RankEntry {
  userId: string;
  rank: number;
  totalScore: number;
  nickname?: string;
  username?: string;
  remainingOverdueSeconds?: number;
}

function RankBarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#1e293b", borderRadius: 10, padding: "8px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", border: "none" }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: d.isMe ? "#60a5fa" : "#fff" }}>
        {d.isMe ? "You" : (d.name || "—")}
      </p>
      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
        Rank <span style={{ color: d.isMe ? "#60a5fa" : "#e2e8f0", fontWeight: 700 }}>#{d.rank}</span>
      </p>
      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
        XP <span style={{ color: "#f8fafc", fontWeight: 700 }}>{d.score.toLocaleString()}</span>
      </p>
    </div>
  );
}

function RankMovementChart({ board, myUserId, currentRank }: {
  board: RankEntry[];
  myUserId?: string;
  currentRank: number | null;
}) {
  if (board.length === 0 || currentRank === null) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 120, gap: 8 }}>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#3b82f6", lineHeight: 1 }}>
          {currentRank != null ? `#${currentRank}` : "—"}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>No leaderboard data available</p>
      </div>
    );
  }

  const myIdx = board.findIndex((e) => e.userId === myUserId);
  const start = Math.max(0, myIdx - 3);
  const window7 = board.slice(start, Math.min(board.length, start + 7));

  const chartData = window7.map((e) => ({
    rank: e.rank,
    score: e.totalScore ?? 0,
    name: e.nickname ?? e.username ?? "—",
    isMe: e.userId === myUserId,
  }));

  const myData = chartData.find(d => d.isMe);
  const maxScore = Math.max(...chartData.map(d => d.score), 1);
  const minScore = Math.min(...chartData.map(d => d.score), 0);
  const yPad = Math.round((maxScore - minScore) * 0.15) || 200;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        {myData && (
          <>
            <div style={{ width: 1, height: 36, background: "#e2e8f0" }} className="desktop-header" />
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#7c3aed", lineHeight: 1 }}>
                {myData.score.toLocaleString()}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em" }}>YOUR XP</p>
            </div>
            {(() => {
              const above = board.find(d => d.rank === currentRank! - 1);
              if (!above) return null;
              const diff = above.totalScore - myData.score;
              return (
                <>
                  <div style={{ width: 1, height: 36, background: "#e2e8f0" }} />
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#f59e0b", lineHeight: 1 }}>
                      -{diff.toLocaleString()}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em" }}>TO #{currentRank! - 1}</p>
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>

      <div style={{ width: "100%", height: 130, overflowX: "auto", overflowY: "hidden" }}>
        <div style={{ minWidth: 280, height: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={24} margin={{ top: 14, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="rank"
                tick={({ x, y, payload, index }) => {
                  const d = chartData[index];
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={10} fontWeight={d?.isMe ? 700 : 400} fill={d?.isMe ? "#3b82f6" : "#94a3b8"}>
                        #{payload.value}
                      </text>
                    </g>
                  );
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#cbd5e1" }}
                axisLine={false}
                tickLine={false}
                domain={[Math.max(0, minScore - yPad), maxScore + yPad]}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
              />
              <Tooltip content={<RankBarTooltip />} cursor={{ fill: "rgba(241,245,249,0.6)", radius: 6 }} />
              {myData && (
                <ReferenceLine y={myData.score} stroke="#3b82f6" strokeDasharray="4 3" strokeWidth={1.5} strokeOpacity={0.5} />
              )}
              <Bar dataKey="score" radius={[6, 6, 2, 2]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.isMe ? "#3b82f6" : "#e2e8f0"} stroke={d.isMe ? "#2563eb" : "transparent"} strokeWidth={d.isMe ? 1.5 : 0} opacity={d.isMe ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 2, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#3b82f6", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "#64748b" }}>You</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#e2e8f0", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "#64748b" }}>Others nearby</span>
        </div>
        <span style={{ fontSize: 11, color: "#cbd5e1", marginLeft: "auto" }}>showing ±3 ranks</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserDashboard({ year = null, month = null }: UserDashboardProps) {
  const authUser = useAuthUser() as IUser | null;

  const { data: leaderboardData, isLoading: isLeaderboardLoading } = usePublicLeaderboard({ limit: 200 });
  const myLeaderboardEntry = leaderboardData?.leaderboard?.find((e: any) => e.userId === authUser?.id);
  const currentRank: number | null = myLeaderboardEntry?.rank ?? null;

  const [data, setData] = useState<UserDashboardResponse | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assignmentFilter, setAssignmentFilter] = useState<DisplayStatus | "All">("All");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showAllAssignments, setShowAllAssignments] = useState(false);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("All Time");
  const [chartYear, setChartYear] = useState<number | null>(null);
  const [useMockBadges, setUseMockBadges] = useState(false);

  const fetchAssignments = useCallback(async () => {
    const assignParams = new URLSearchParams();
    assignParams.set("myAssignments", "true");
    assignParams.set("limit", "100");
    if (month) assignParams.set("deadlineMonth", String(month));

    try {
      const res = await fetch(`/api/assignment?${assignParams}`);
      if (res.ok) {
        const json = await res.json();
        setAssignments(json.assignments ?? []);
      } else {
        setAssignments(prev => prev.length > 0 ? prev : [
          { id: 1, title: "Employer Branding Plan", deadline: "2026-06-23T23:59:00", status: "Approved", reward: 150, submissionUrl: "https://example.com", type: "Individual" },
          { id: 2, title: "Campus Recruitment Report", deadline: "2026-06-25T12:00:00", status: "Approved", reward: 140, submissionUrl: "https://example.com", type: "Individual" },
          { id: 3, title: "Sourcing Strategy Analysis", deadline: "2026-07-10T23:59:00", status: "Approved", reward: 130, submissionUrl: "https://example.com", type: "Individual" },
          { id: 4, title: "Competitor Benchmarking", deadline: "2026-07-20T23:59:00", status: "Pending", reward: 120, submissionUrl: "https://example.com", type: "Individual" },
          { id: 5, title: "Interview Quality Review", deadline: "2026-08-01T23:59:00", status: "Pending", reward: 100, submissionUrl: "", type: "Individual" },
        ]);
      }
    } catch (err) {
      console.error("fetchAssignments error:", err);
    }
  }, [month]);

  useEffect(() => {
    fetchAssignments();
    const pollId = setInterval(fetchAssignments, 30_000);
    return () => clearInterval(pollId);
  }, [fetchAssignments]);

  useEffect(() => {
    const init = async () => {
      try {
        const params = new URLSearchParams();
        if (year) params.set("year", String(year));
        if (month) params.set("month", String(month));

        if (useMockBadges) {
          setBadges(DEFAULT_MOCK_BADGES);
        } else {
          const resB = await fetch("/api/badge/my");
          if (resB.ok) {
            try {
              const j = await resB.json();
              let rawBadges: Badge[] = [];
              if (Array.isArray(j)) rawBadges = j;
              else if (j?.badges && Array.isArray(j.badges)) rawBadges = j.badges;
              else if (j?.data?.badges && Array.isArray(j.data.badges)) rawBadges = j.data.badges;
              setBadges(rawBadges.map(sanitizeBadge));
            } catch {
              setBadges(DEFAULT_MOCK_BADGES);
            }
          } else {
            setBadges(DEFAULT_MOCK_BADGES);
          }
        }

        const resD = await fetch(`/api/assignment/dashboard/user?${params}`);
        if (resD.ok) {
          setData(await resD.json());
        } else {
          const xp = (myLeaderboardEntry as any)?.totalScore ?? authUser?.totalScore ?? 2650;
          const yr = new Date().getFullYear();
          setData({
            kpis: { totalScore: xp, avgScore: 138 },
            charts: {
              scoreByMonth: {
                data: [
                  { month: `${yr}-01`, score: 360 },
                  { month: `${yr}-02`, score: 580 },
                  { month: `${yr}-03`, score: 860 },
                  { month: `${yr}-04`, score: 1420 },
                  { month: `${yr}-05`, score: xp },
                ],
              },
            },
          } as any);
        }
      } catch (err) {
        console.error("❌ Dashboard Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [year, month, authUser, useMockBadges, (myLeaderboardEntry as any)?.totalScore]);

  const allParsedMonths = useMemo(() => {
    const raw = (data?.charts?.scoreByMonth?.data ?? []) as Array<{ month: string; score: number; year?: number }>;
    return raw.map(parseMonthEntry);
  }, [data]);

  const availableYears = useMemo(() => [...new Set(allParsedMonths.map(d => d.year))].sort((a, b) => a - b), [allParsedMonths]);

  useEffect(() => {
    if (availableYears.length > 0) {
      setChartYear(prev => (prev === null || !availableYears.includes(prev)) ? availableYears[availableYears.length - 1] : prev);
    }
  }, [availableYears]);

  const withDisplay = useMemo(() => assignments.map(a => ({ ...a, _display: toDisplayStatus(a) })), [assignments]);

  //  1. บล็อกคำนวณสถิติรายเดือน (ย้ายขึ้นมาด้านบนสุดเพื่อเรียงลำดับ Scope บรรทัดให้ถูกต้อง)
  const thisMonthStats = useMemo(() => {
    const now = new Date();
    const currentYear = year ?? now.getFullYear();
    const currentMonth = month !== null ? month - 1 : now.getMonth();

    let completedCount = 0, totalAssignmentsThisMonth = 0, completedScore = 0, potentialScore = 0;

    withDisplay.forEach(a => {
      const d = new Date(a.deadline);
      if (!isNaN(d.getTime()) &&
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth) {
        totalAssignmentsThisMonth += 1;
        potentialScore += a.reward || 0;
        if (a._display === "Completed") {
          completedCount += 1;
          completedScore += (a.finalScore !== undefined && a.finalScore !== null)
            ? a.finalScore : (a.reward || 0);
        }
      }
    });

    const completionRate = totalAssignmentsThisMonth > 0
      ? Math.round((completedCount / totalAssignmentsThisMonth) * 100) : 0;

    return { completionRate, completedCount, totalAssignmentsThisMonth, completedScore, potentialScore };
  }, [withDisplay, year, month]);

  //  2. บล็อกคำนวณข้อมูลแกนกราฟ (ผูกสเกล score เดือนปัจจุบันให้สมมาตรกับ Tooltip และขยายแกน Y แก้อาการจุดจม)
  const chartData = useMemo(() => {
    const currentYear = chartYear ?? new Date().getFullYear();
    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthlyStats = monthsShort.map(m => ({
      month: m,
      score: 0,
      potential: 0,
      totalAssignments: 0
    }));

    withDisplay.forEach(a => {
      const d = new Date(a.deadline);
      if (!isNaN(d.getTime()) && d.getFullYear() === currentYear) {
        const monthIdx = d.getMonth();

        monthlyStats[monthIdx].totalAssignments += 1;
        monthlyStats[monthIdx].potential += a.reward || 0;

        if (a._display === "Completed" && a.reward) {
          monthlyStats[monthIdx].score += (a.finalScore !== undefined && a.finalScore !== null)
            ? a.finalScore
            : (a.reward || 0);
        }
      }
    });

    const now = new Date();
    if (currentYear === now.getFullYear()) {
      const currentMonthIdx = now.getMonth();
      if (thisMonthStats.completedScore > 0) {
        monthlyStats[currentMonthIdx].score = thisMonthStats.completedScore;
      }
    }

    return monthlyStats;
  }, [withDisplay, chartYear, thisMonthStats]);

  const currentDisplayedYearRange = useMemo(() =>
    chartYear !== null ? `(${chartYear})` : ""
    , [chartYear]);

  const currentXP = useMemo(() => {
    return (myLeaderboardEntry as any)?.totalScore ?? authUser?.totalScore ?? data?.kpis?.totalScore ?? 0;
  }, [myLeaderboardEntry, authUser?.totalScore, data?.kpis?.totalScore]);

  const currentOverdueSeconds = useMemo(() => {
    return (myLeaderboardEntry as any)?.remainingOverdueSeconds ?? 0;
  }, [myLeaderboardEntry]);

  const lv = getLevelProgress(currentXP);

  const timeFilteredAssignments = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return withDisplay.filter(a => {
      const deadline = new Date(a.deadline);
      deadline.setHours(0, 0, 0, 0);

      if (year !== null && deadline.getFullYear() !== year) return false;
      if (month !== null && (deadline.getMonth() + 1) !== month) return false;

      if (timeFilter === "Today") return deadline.getTime() === now.getTime();
      if (timeFilter === "Weekly") {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 6);
        return deadline >= now && deadline <= weekEnd;
      }
      if (timeFilter === "Monthly")
        return deadline.getFullYear() === now.getFullYear() &&
          deadline.getMonth() === now.getMonth();
      return true;
    });
  }, [withDisplay, timeFilter, year, month]);

  const assignmentCounts = useMemo(() => getUserAssignmentCounts(timeFilteredAssignments), [timeFilteredAssignments]);
  const completedCount = assignmentCounts.Completed;
  const pendingCount = assignmentCounts.Pending;
  const rejectedCount = assignmentCounts.Rejected;
  const notSubmitCount = assignmentCounts["Not Submit"];

  const filteredAssignments = useMemo(() => {
    return assignmentFilter === "All" ? timeFilteredAssignments : timeFilteredAssignments.filter(a => a._display === assignmentFilter);
  }, [timeFilteredAssignments, assignmentFilter]);

  const upcomingTasks = useMemo(() => {
    return [...withDisplay].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [withDisplay]);

  const toggleRow = (id: number) => setExpandedRows(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleQuickSubmit = (id: number) => {
    setAssignmentFilter("All");
    setTimeFilter("All Time");
    setTimeout(() => {
      setExpandedRows(new Set([id]));
      const rowElement = document.getElementById(`assignment-row-${id}`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
        rowElement.style.backgroundColor = "#fff5f5";
        setTimeout(() => { rowElement.style.backgroundColor = "transparent"; }, 1500);
      }
    }, 100);
  };

  const avgScoreStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthCompleted = withDisplay.filter(a => {
      const d = new Date(a.deadline);
      return (
        a._display === "Completed" &&
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth
      );
    });

    const thisMonthAvg = thisMonthCompleted.length > 0
      ? Math.round(
        thisMonthCompleted.reduce((sum, a) =>
          sum + ((a.finalScore !== undefined && a.finalScore !== null) ? a.finalScore : (a.reward || 0)), 0
        ) / thisMonthCompleted.length
      )
      : 0;

    const lastMonthCompleted = withDisplay.filter(a => {
      const d = new Date(a.deadline);
      if (a._display !== "Completed") return false;
      const nowAbsolute = currentYear * 12 + currentMonth;
      const assignAbsolute = d.getFullYear() * 12 + d.getMonth();
      return nowAbsolute - assignAbsolute === 1;
    });

    const lastMonthAvg = lastMonthCompleted.length > 0
      ? Math.round(
        lastMonthCompleted.reduce((sum, a) =>
          sum + ((a.finalScore !== undefined && a.finalScore !== null) ? a.finalScore : (a.reward || 0)), 0
        ) / lastMonthCompleted.length
      )
      : 0;

    const diff = thisMonthAvg - lastMonthAvg;

    return {
      thisMonthAvg,
      lastMonthAvg,
      diff,
      label: lastMonthCompleted.length === 0
        ? "No data last month"
        : diff > 0
          ? `▲ ${diff} pts vs last month`
          : diff < 0
            ? `▼ ${Math.abs(diff)} pts vs last month`
            : "= same as last month",
      labelColor: lastMonthCompleted.length === 0
        ? "#94a3b8"
        : diff > 0
          ? "#7c3aed"
          : diff < 0
            ? "#ef4444"
            : "#64748b",
    };
  }, [withDisplay]);

  return (
    <div style={{ padding: "16px 12px", background: "#ffffff", minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", maxWidth: 1480, margin: "0 auto" }}>
      {/* Dynamic Mobile CSS Overrides Injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 768px) {
          .desktop-row { display: none !important; }
          .desktop-header { display: none !important; }
          .mobile-card-row { display: table-row !important; }
        }
      `}} />

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexDirection: "column" }}>

        {/* KPI Top Bar Row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", width: "100%" }}>
          <KpiCard
            icon={<Trophy size={22} />}
            iconBg="#fef3c7"
            iconColor="#d97706"
            label="MY SCORE (XP)"
            value={currentXP.toLocaleString()}
            sub={currentRank != null ? `🔹 Rank #${currentRank}` : undefined}
            subColor="#3b82f6"
          />
          <KpiCard
            icon={<Target size={22} />}
            iconBg="#dcfce7"
            iconColor="#16a34a"
            label="THIS MONTH SCORE"
            value={`${thisMonthStats.completionRate}%`}
            sub={`📋 ${thisMonthStats.completedCount}/${thisMonthStats.totalAssignmentsThisMonth} completed`}
            subColor="#16a34a"
          />
          <KpiCard
            icon={<Star size={22} />}
            iconBg="#ede9fe"
            iconColor="#7c3aed"
            label="AVG. SCORE"
            value={
              <>
                {avgScoreStats.thisMonthAvg}
                <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 400 }}> XP/Task</span>
              </>
            }
            sub={avgScoreStats.label}
            subColor={avgScoreStats.labelColor}
          />
        </div>

        {/* Core Layout Grid Block splitting to Full on Small Screen */}
        <div style={{ display: "flex", gap: 16, width: "100%", flexDirection: "column" }}>

          {/* Status Metric Grid Counter */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, width: "100%" }}>
            {[
              { icon: <CheckCircle2 size={16} />, bg: "#dcfce7", color: "#16a34a", label: "COMPLETED", count: completedCount },
              { icon: <Clock size={16} />, bg: "#dbeafe", color: "#1d4ed8", label: "PENDING", count: pendingCount },
              { icon: <AlertCircle size={16} />, bg: "#fee2e2", color: "#b91c1c", label: "REJECTED", count: rejectedCount },
              { icon: <Calendar size={16} />, bg: "#f1f5f9", color: "#eab308", label: "NOT SUBMIT", count: notSubmitCount },
            ].map(({ icon, bg, color, label, count }) => (
              <div key={label} style={{ background: "#fff", borderRadius: 14, padding: "10px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                <div style={{ background: bg, padding: 8, borderRadius: 10, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{label}</p>
                  <p style={{ margin: "1px 0 0", fontSize: 18, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>{count}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ==================== SCORE TREND CHART ==================== */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "16px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", width: "100%", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em" }}>
                SCORE TREND {currentDisplayedYearRange}
              </p>
            </div>

            <div style={{ width: "100%", height: 160, overflowX: "auto", overflowY: "hidden" }}>
              <div style={{ minWidth: 320, height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, (dataMax: number) => Math.max(dataMax + Math.ceil(dataMax * 0.15), 10)]}
                      tickFormatter={(v) => {
                        if (v >= 1000) {
                          // ถ้าหารแล้วลงตัวไม่มีเศษ ให้แสดงเป็นเลขกลมๆ เช่น 10k แต่ถ้ามีเศษค่อยโชว์ทศนิยม เช่น 12.5k
                          return v % 1000 === 0 ? `${v / 1000}k` : `${(v / 1000).toFixed(1)}k`;
                        }
                        return String(v);
                      }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const dataPoint = payload[0].payload;
                        const isCurrentMonth = label === new Date().toLocaleString('en-US', { month: 'short' });
                        return (
                          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", minWidth: 160 }}>
                            <p style={{ margin: "0 0 6px 0", fontWeight: 700, color: "#0f172a", fontSize: 13 }}>
                              {label}{isCurrentMonth ? " • เดือนนี้" : ""}
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                <span style={{ color: "#64748b" }}>XP ที่ได้รับ</span>
                                <span style={{ fontWeight: 700, color: "#7c3aed" }}>
                                  {isCurrentMonth ? thisMonthStats.completedScore.toLocaleString() : dataPoint.score.toLocaleString()} XP
                                </span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px dashed #e2e8f0", paddingTop: 4, marginTop: 2 }}>
                                <span style={{ color: "#64748b" }}>งานทั้งหมด</span>
                                <span style={{ fontWeight: 700, color: "#0f172a" }}>{dataPoint.totalAssignments} งาน</span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Line type="monotone" dataKey="potential" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 2, fill: "#94a3b8" }} name="XP รวมทั้งหมด" />
                    <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, fill: "#7c3aed", stroke: "#fff", strokeWidth: 1.5 }} name="XP ที่ได้จริง" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legend Component Indicators */}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 10, fontSize: 11, color: "#64748b", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 12, height: 3, background: "#7c3aed", borderRadius: 999 }} />
                <span>XP ที่ได้รับภายในเดือนนั้น</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 12, height: 3, background: "#94a3b8", borderRadius: 999, opacity: 0.75 }} />
                <span>งานทั้งหมดที่ได้รับภายในเดือน</span>
              </div>
            </div>
          </div>
          {/* ==================== END SCORE TREND CHART ==================== */}

        </div>

        {/* Right Dynamic Sidebar Context Layout */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em" }}>MY PROGRESS</p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, flexShrink: 0, background: `linear-gradient(145deg, ${lv.color}, #1e1b4b)`, clipPath: "polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>{lv.badge}</span>
                <span style={{ fontSize: 9, fontWeight: 700, marginTop: 2 }}>Lv.{lv.level}</span>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b", fontWeight: 500 }}>{lv.role}</p>
                <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 700, color: lv.color, lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {currentXP.toLocaleString()}
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400, marginLeft: 4 }}>/ {lv.maxXp.toLocaleString()} XP</span>
                </p>
              </div>
            </div>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <div style={{ background: "#e2e8f0", borderRadius: 999, height: 8 }}>
                <div style={{ background: lv.color, borderRadius: 999, height: 8, width: `${lv.xpPct}%`, transition: "width 0.5s ease" }} />
              </div>
              <span style={{ position: "absolute", right: 0, top: -18, fontSize: 11, fontWeight: 700, color: lv.color }}>{lv.xpPct}%</span>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
              <strong style={{ color: "#0f172a" }}>{lv.xpRemaining.toLocaleString()} XP</strong> to next level 🎁
            </p>
          </div>

          <UpcomingTaskCard tasks={upcomingTasks} onTriggerSubmit={handleQuickSubmit} />
        </div>

      </div>

      {/* Badges and Ranking Movement Flex Block Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 16, width: "100%" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em" }}>MY BADGES</p>
            <button onClick={() => setShowAllBadges(true)} style={{ background: "none", border: "none", color: "#4f46e5", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}>
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {badges.length === 0
              ? <p style={{ color: "#94a3b8", fontSize: 12 }}>ยังไม่มี badge</p>
              : badges.slice(0, 4).map(b => (
                <div key={b.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 60px", minWidth: 60 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: `2px solid ${b.color}20`, marginBottom: 6 }}>
                    {b.icon || "⭐"}
                  </div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#0f172a", textAlign: "center", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%" }}>{b.nameEn}</p>
                </div>
              ))
            }
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}>
              <TrendingUp size={13} /> RANK MOVEMENT
            </p>
          </div>
          <RankMovementChart board={leaderboardData?.leaderboard ?? []} myUserId={authUser?.id} currentRank={currentRank} />
        </div>
      </div>

      {/* Main Bottom Assignment Content Table Wrapper Section */}
      <div id="my-assignments-table" style={{ background: "#fff", borderRadius: 16, padding: "20px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em" }}>MY ASSIGNMENTS</p>
          <button onClick={() => setShowAllAssignments(true)} style={{ display: "flex", alignItems: "center", gap: 2, background: "none", border: "none", color: "#4f46e5", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            View all <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <select value={timeFilter} onChange={e => { setTimeFilter(e.target.value as TimeFilter); setAssignmentFilter("All"); }} style={selectStyle}>
            <option value="Today">Today</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="All Time">All Time</option>
          </select>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <FilterPill label={`All (${timeFilteredAssignments.length})`} active={assignmentFilter === "All"} onClick={() => setAssignmentFilter("All")} />
            <FilterPill label={`Completed (${completedCount})`} active={assignmentFilter === "Completed"} onClick={() => setAssignmentFilter("Completed")} />
            <FilterPill label={`Pending (${pendingCount})`} active={assignmentFilter === "Pending"} onClick={() => setAssignmentFilter("Pending")} />
            <FilterPill label={`Rejected (${rejectedCount})`} active={assignmentFilter === "Rejected"} onClick={() => setAssignmentFilter("Rejected")} />
            {notSubmitCount > 0 && <FilterPill label={`Not Submit (${notSubmitCount})`} active={assignmentFilter === "Not Submit"} onClick={() => setAssignmentFilter("Not Submit")} />}
          </div>
        </div>

        <div style={{ width: "100%", overflowX: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead className="desktop-header">
              <tr style={{ borderBottom: "1.5px solid #f1f5f9" }}>
                <th style={{ textAlign: "left", padding: "10px 12px 10px 16px", fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em" }}>ASSIGNMENT</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em" }}>DUE DATE</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em" }}>STATUS</th>
                <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em" }}>XP</th>
                <th style={{ width: 32 }} />
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>No assignments {timeFilter === "All Time" ? "in this category" : `due ${timeFilter.toLowerCase()}`}</td></tr>
              ) : filteredAssignments.map(a => (
                <AssignmentRow key={a.id} a={a} expanded={expandedRows.has(a.id)} onToggle={() => toggleRow(a.id)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAllAssignments && <ViewAllDialog assignments={withDisplay} onClose={() => setShowAllAssignments(false)} />}
      {showAllBadges && <ViewAllBadgesDialog badges={badges} onClose={() => setShowAllBadges(false)} />}

      
    </div>
  );
}