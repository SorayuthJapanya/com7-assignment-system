"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  TrendingUp,
  Clock,
  Star,
  ClipboardList,
  ArrowRight,
  AlertTriangle,
  X,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import KpiCard from "../card/kpi-card";
import type {
  AdminDashboardResponse,
  UserAssignmentStatus,
  StatusDistribution,
  MonthlyTrend,
  AverageScoreByMonth,
  UserScoreSummary,
} from "@/types/dashboard";

interface CustomUserStatus extends UserAssignmentStatus {
  notSubmit?: number;
}

interface SuperAdminDashboardProps {
  year: number | null;
  month: number | null;
}

// ─── Colour palettes ────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  Approved: "#22c55e",
  "In Progress": "#3b82f6",
  Overdue: "#ef4444",
  Completed: "#22c55e",
  Submitted: "#3b82f6",
  Rejected: "#ef4444",
  Pending: "#f59e0b",
  "Not Submit": "#8b5cf6",
  "Late Submit": "#94a3b8",
};

const CATEGORY_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#3b82f6",
  "#ef4444", "#8b5cf6", "#14b8a6", "#f97316", "#94a3b8",
  "#10b981", "#f43f5e", "#0ea5e9", "#a855f7", "#84cc16",
  "#fb923c", "#06b6d4", "#6366f1",
];

const LEVEL_BADGE: Record<string, { bg: string; text: string }> = {
  Elite: { bg: "#fef3c7", text: "#b45309" },
  Expert: { bg: "#ede9fe", text: "#7c3aed" },
  Pro: { bg: "#dbeafe", text: "#1d4ed8" },
  Beginner: { bg: "#f1f5f9", text: "#64748b" },
};

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Sub-components ─────────────────────────────────────────────────────────
function SectionCard({
  title,
  headerRight,
  children,
}: {
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a", letterSpacing: "0.01em" }}>{title}</p>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const cfg = LEVEL_BADGE[level] ?? { bg: "#f1f5f9", text: "#64748b" };
  return (
    <span style={{
      background: cfg.bg, color: cfg.text,
      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
    }}>
      {level}
    </span>
  );
}

// ─── Workload Modal ──────────────────────────────────────────────────────────
function WorkloadModal({
  isOpen,
  onClose,
  title,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: { name: string; value: number }[];
}) {
  if (!isOpen) return null;
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "90%", maxWidth: 480,
        maxHeight: "80vh", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            รายชื่อสถิติ {title}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
            <X size={18} color="#64748b" />
          </button>
        </div>
        <div style={{
          padding: "12px 20px", maxHeight: "calc(80vh - 120px)",
          overflowY: "auto", display: "flex", flexDirection: "column", gap: 8,
        }}>
          {data.map((d, i) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            return (
              <div key={d.name} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 12px", background: "#f8fafc", borderRadius: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#334155" }}>{i + 1}. {d.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
                  {d.value} งาน ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", textAlign: "right" }}>
          <button onClick={onClose} style={{
            padding: "7px 18px", background: "#6366f1", color: "#fff",
            border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13,
          }}>ปิด</button>
        </div>
      </div>
    </div>
  );
}

// ─── Overdue Modal ───────────────────────────────────────────────────────────
function OverdueModal({
  isOpen,
  onClose,
  overdueData,
}: {
  isOpen: boolean;
  onClose: () => void;
  overdueData: UserAssignmentStatus[];
}) {
  if (!isOpen) return null;

  const sortedOverdue = [...overdueData]
    .sort((a, b) => (b.rejected ?? 0) - (a.rejected ?? 0))
    .filter(u => (u.rejected ?? 0) > 0);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "90%", maxWidth: 520,
        maxHeight: "85vh", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={22} color="#ef4444" />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Overdue Alert</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} color="#64748b" />
          </button>
        </div>
        <div style={{ padding: 24, maxHeight: "calc(85vh - 70px)", overflowY: "auto" }}>
          {sortedOverdue.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sortedOverdue.map((u, i) => (
                <div key={u.username} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 18px", background: "#fef2f2", borderRadius: 12, border: "1px solid #fee2e2",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: i === 0 ? "#ef4444" : i === 1 ? "#f97316" : "#f59e0b",
                      color: "#fff", fontSize: 15, fontWeight: 700,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>{i + 1}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 15 }}>{u.nickname}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>@{u.username}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>{u.rejected}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>งาน</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
              ไม่มีงานที่ overdue ในขณะนี้
            </div>
          )}
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", textAlign: "right" }}>
          <button onClick={onClose} style={{
            padding: "10px 24px", background: "#ef4444", color: "#fff",
            border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer",
          }}>ปิด</button>
        </div>
      </div>
    </div>
  );
}

// ─── Workload Distribution Section (Canvas Donut + Tooltip) ─────────────────
interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  name: string;
  count: number;
  share: string;
  total: number;
  color: string;
}

interface Segment {
  a0: number;
  a1: number;
  ro: number;
  ri: number;
  color: string;
  name: string;
  value: number;
  pct: number;
  total: number;
}

function WorkloadDistributionSection({
  userStatusData,
}: {
  userStatusData: CustomUserStatus[];
}) {
  const [workloadFilter, setWorkloadFilter] = useState<
    "all" | "submitted" | "pending" | "approved" | "top5" | "bottom5"
  >("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, name: "", count: 0, share: "", total: 0, color: "",
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<Segment[]>([]);

  const SIZE = 160;
  const CX = SIZE / 2, CY = SIZE / 2;
  const RO = SIZE * 0.46, RI = SIZE * 0.28;
  const GAP = 0.025;

  const finalChartData = useMemo(() => {
    const mapped = userStatusData.map(u => {
      let value = 0;
      if (workloadFilter === "submitted") value = u.submitted ?? 0;
      else if (workloadFilter === "pending") value = u.pending ?? 0;
      else if (workloadFilter === "approved") value = u.approved ?? 0;
      else value = (u.approved ?? 0) + (u.pending ?? 0) + (u.rejected ?? 0) + (u.notSubmit ?? 0);
      return { name: u.nickname || u.username, value };
    });

    if (workloadFilter === "top5") return [...mapped].sort((a, b) => b.value - a.value).slice(0, 5);
    if (workloadFilter === "bottom5") return [...mapped].sort((a, b) => a.value - b.value).slice(0, 5);
    return mapped.sort((a, b) => b.value - a.value);
  }, [userStatusData, workloadFilter]);

  const workloadTotal = useMemo(
    () => finalChartData.reduce((s, d) => s + d.value, 0),
    [finalChartData]
  );

  const displayedList = useMemo(() => finalChartData.slice(0, 3), [finalChartData]);

  const getFilterLabel = () => {
    const map: Record<string, string> = {
      all: "งานทั้งหมด", submitted: "งานที่ Submitted", pending: "งานที่ Pending",
      approved: "งานที่ Approved", top5: "ภาระงานสูงสุด (Top 5)", bottom5: "ภาระงานต่ำสุด (Bottom 5)",
    };
    return map[workloadFilter] ?? "งานทั้งหมด";
  };

  const drawDonut = useCallback((hovered: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE * dpr, SIZE * dpr);
    segmentsRef.current = [];

    if (workloadTotal === 0) {
      ctx.beginPath();
      ctx.arc(CX * dpr, CY * dpr, ((RO + RI) / 2) * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = (RO - RI) * dpr;
      ctx.stroke();
      // Center text
      ctx.fillStyle = "#0f172a";
      ctx.font = `700 ${SIZE * 0.14 * dpr}px Inter,-apple-system,sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("0", CX * dpr, (CY - 6) * dpr);
      ctx.fillStyle = "#94a3b8";
      ctx.font = `400 ${SIZE * 0.075 * dpr}px Inter,-apple-system,sans-serif`;
      ctx.fillText("งาน", CX * dpr, (CY + SIZE * 0.1) * dpr);
      return;
    }

    let angle = -Math.PI / 2;
    finalChartData.forEach((d, i) => {
      if (d.value <= 0) return;
      const slice = (d.value / workloadTotal) * Math.PI * 2;
      const a0 = angle + GAP / 2;
      const a1 = angle + slice - GAP / 2;
      const isH = i === hovered;
      const ro = (isH ? RO + 7 : RO) * dpr;
      const ri = (isH ? RI - 2 : RI) * dpr;

      ctx.beginPath();
      ctx.arc(CX * dpr, CY * dpr, ro, a0, a1);
      ctx.arc(CX * dpr, CY * dpr, ri, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = CATEGORY_COLORS[i % CATEGORY_COLORS.length] + (isH ? "" : "cc");
      ctx.fill();

      segmentsRef.current.push({
        a0: angle, a1: angle + slice,
        ro: isH ? RO + 7 : RO, ri: isH ? RI - 2 : RI,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        name: d.name, value: d.value,
        pct: Math.round((d.value / workloadTotal) * 1000) / 10,
        total: workloadTotal,
      });
      angle += slice;
    });

    // Center text
    ctx.fillStyle = "#0f172a";
    ctx.font = `700 ${SIZE * 0.14 * dpr}px Inter,-apple-system,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(workloadTotal), CX * dpr, (CY - 6) * dpr);
    ctx.fillStyle = "#94a3b8";
    ctx.font = `400 ${SIZE * 0.075 * dpr}px Inter,-apple-system,sans-serif`;
    ctx.fillText("งาน", CX * dpr, (CY + SIZE * 0.1) * dpr);
  }, [finalChartData, workloadTotal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    drawDonut(hoveredIdx);
  }, [drawDonut, hoveredIdx]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - CX;
    const my = e.clientY - rect.top - CY;
    const dist = Math.sqrt(mx * mx + my * my);
    let angle = Math.atan2(my, mx) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;

    let found = -1;
    segmentsRef.current.forEach((seg, i) => {
      let a0 = seg.a0 + Math.PI / 2;
      let a1 = seg.a1 + Math.PI / 2;
      if (a0 < 0) a0 += Math.PI * 2;
      if (a1 < 0) a1 += Math.PI * 2;
      const inArc = a0 > a1 ? (angle >= a0 || angle <= a1) : (angle >= a0 && angle <= a1);
      if (inArc && dist >= seg.ri && dist <= seg.ro + 8) found = i;
    });

    if (found !== -1) {
      const seg = segmentsRef.current[found];
      const wrapRect = wrap.getBoundingClientRect();
      const ttW = 170;
      let tx = e.clientX - wrapRect.left + 14;
      let ty = e.clientY - wrapRect.top - 50;
      if (tx + ttW > wrapRect.width + 80) tx = e.clientX - wrapRect.left - ttW - 10;
      ty = Math.max(0, ty);

      setHoveredIdx(found);
      setTooltip({
        visible: true, x: tx, y: ty,
        name: seg.name, count: seg.value,
        share: `${seg.pct}%`, total: seg.total,
        color: seg.color,
      });
    } else {
      setHoveredIdx(-1);
      setTooltip(t => ({ ...t, visible: false }));
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredIdx(-1);
    setTooltip(t => ({ ...t, visible: false }));
  }, []);

  const selectStyle: React.CSSProperties = {
    width: "100%", fontSize: 13, fontWeight: 600, color: "#475569",
    border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "8px 12px",
    outline: "none", backgroundColor: "#fff", cursor: "pointer", marginBottom: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  };

  return (
    <SectionCard title="Workload Distribution by User">
      {/* Dropdown */}
      <select
        value={workloadFilter}
        onChange={e => setWorkloadFilter(e.target.value as any)}
        style={selectStyle}
      >
        <option value="all">แสดงข้อมูลบุคคลทั้งหมด</option>
        <option value="submitted">สถานะ Submitted</option>
        <option value="pending">สถานะ Pending</option>
        <option value="approved">Status Approved</option>
        <option value="top5">คนที่ได้งานเยอะที่สุด (Top 5)</option>
        <option value="bottom5">คนที่ได้งานน้อยที่สุด (Bottom 5)</option>
      </select>

      {/* Chart + Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Canvas Donut */}
        <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ display: "block", cursor: "crosshair" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />

          {/* Tooltip */}
          {tooltip.visible && (
            <div style={{
              position: "absolute", left: tooltip.x, top: tooltip.y,
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
              padding: "10px 14px", minWidth: 165, pointerEvents: "none",
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)", zIndex: 50,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: tooltip.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{tooltip.name}</span>
              </div>
              {[
                { label: "Count", val: `${tooltip.count} งาน` },
                { label: "Share", val: tooltip.share },
                { label: "Total", val: `${tooltip.total} งาน` },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 20, fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: "#94a3b8" }}>{row.label}</span>
                  <span style={{ color: "#0f172a", fontWeight: 600 }}>{row.val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend — top 3 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
          {displayedList.map((d, i) => {
            const pct = workloadTotal > 0 ? Math.round((d.value / workloadTotal) * 100) : 0;
            return (
              <div
                key={d.name}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 6px", borderRadius: 6, cursor: "pointer",
                  borderBottom: i < displayedList.length - 1 ? "0.5px solid #f1f5f9" : "none",
                  background: hoveredIdx === i ? "#f8fafc" : "transparent",
                  transition: "background .12s",
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(-1)}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: workloadTotal > 0 ? CATEGORY_COLORS[i % CATEGORY_COLORS.length] : "#cbd5e1",
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 12, color: "#475569", flex: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {d.name}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", flexShrink: 0 }}>{d.value}</span>
                <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 34, textAlign: "right", flexShrink: 0 }}>
                  {pct}%
                </span>
              </div>
            );
          })}

          {/* View all button */}
          {finalChartData.length > 3 && (
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                marginTop: 8, background: "#f8fafc", border: "1px solid #e2e8f0",
                borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
                color: "#475569", padding: "7px 10px",
                display: "flex", alignItems: "center", gap: 6, width: "100%",
                transition: "background .12s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
              onMouseLeave={e => (e.currentTarget.style.background = "#f8fafc")}
            >
              <Users size={13} />
              ดูทั้งหมด {finalChartData.length} คน
              <ArrowRight size={12} style={{ marginLeft: "auto" }} />
            </button>
          )}
        </div>
      </div>

      <WorkloadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={getFilterLabel()}
        data={finalChartData}
      />
    </SectionCard>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SuperAdminDashboard({
  year = null,
  month = null,
}: SuperAdminDashboardProps) {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardFilter, setLeaderboardFilter] = useState<"All Time" | "Monthly" | "Weekly">("All Time");
  const [isMobile, setIsMobile] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);

  const currentDisplayedYear = year ? `(${year})` : "(2026)";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (year) params.set("year", String(year));
        if (month) params.set("month", String(month));

        const res = await fetch(`/api/assignment/dashboard/admin?${params}`);
        if (res.ok) {
          setData(await res.json());
        } else {
          setData({
            role: "SUPER_ADMIN",
            period: { year, month },
            kpis: { totalAssignments: 0, totalSubmitted: 0, totalApproved: 0, averageScore: 0, lateSubmissions: 0 },
            charts: {
              monthlyTrend: { title: "Completion Rate Trend", type: "line", data: [] },
              statusDistribution: { title: "Assignment Status", type: "pie", data: [] },
              averageScoreByMonth: { title: "Avg Score Trend", type: "bar", data: [] },
              userAssignmentStatus: { title: "User Assignment Status", type: "bar", data: [] },
              userScoreSummary: { title: "User Score Summary", type: "table", data: [] },
            },
          } as unknown as AdminDashboardResponse);
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [year, month]);

  if (isLoading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)", gap: 14, padding: 24 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ height: 96, borderRadius: 16, background: "#f1f5f9", animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    );
  }

  const kpis = data?.kpis;
  const charts = data?.charts;

  const completionRate =
    kpis && kpis.totalAssignments > 0
      ? Math.round((kpis.totalSubmitted / kpis.totalAssignments) * 100)
      : 0;

  const monthlyTrendData = (charts?.monthlyTrend?.data as MonthlyTrend[]) || [];
  const statusDistData = (charts?.statusDistribution?.data as StatusDistribution[]) || [];
  const scoreByMonthData = (charts?.averageScoreByMonth?.data as AverageScoreByMonth[]) || [];
  const userStatusData = (charts?.userAssignmentStatus?.data as CustomUserStatus[]) || [];
  const userScoreData = (charts?.userScoreSummary?.data as UserScoreSummary[]) || [];

  const totalDonut = statusDistData.reduce((s, d) => s + d.value, 0);

  let processedScoreData = [...(userScoreData || [])];
  processedScoreData.sort((a, b) => b.totalScore - a.totalScore);

  const leaderboardRows = processedScoreData.map((u, i) => {
    const status = userStatusData.find(s => s.username === u.username);
    const total = (status?.submitted ?? 0) + (status?.pending ?? 0);
    const completionPct = total > 0 ? Math.round(((status?.approved ?? 0) / total) * 100) : 0;
    let calculatedLevel = "Beginner";
    if (u.totalScore >= 2000) calculatedLevel = "Elite";
    else if (u.totalScore >= 1500) calculatedLevel = "Expert";
    else if (u.totalScore >= 1000) calculatedLevel = "Pro";
    return {
      rank: i + 1, nickname: u.nickname, level: calculatedLevel,
      totalPoints: u.totalScore,
      avgScore: u.assignmentCount > 0 ? Math.round(u.totalScore / u.assignmentCount) : 0,
      completionRate: completionPct, overdue: status?.rejected ?? 0,
    };
  }).slice(0, 5);

  const topPerformers = [...processedScoreData].slice(0, 3);

  const overdueAlerts = [...userStatusData]
    .filter(u => (u.rejected ?? 0) > 0)
    .sort((a, b) => (b.rejected ?? 0) - (a.rejected ?? 0))
    .slice(0, 3);

  const bestCompletionUser = [...userStatusData]
    .map(u => {
      const total = (u.submitted ?? 0) + (u.pending ?? 0);
      return { ...u, completionPct: total > 0 ? Math.round(((u.approved ?? 0) / total) * 100) : 0 };
    })
    .sort((a, b) => b.completionPct - a.completionPct)[0];

  const overdueRate = kpis && kpis.totalAssignments > 0
    ? Math.round(((kpis.lateSubmissions ?? 0) / kpis.totalAssignments) * 100) : 0;
  const submissionRate = Math.round(((kpis?.totalSubmitted ?? 0) / (kpis?.totalAssignments ?? 1)) * 100);

  const insights = [
    `อัตราการส่งงานอยู่ที่ ${submissionRate}% จากงานทั้งหมด ${kpis?.totalAssignments ?? 0} ชิ้น`,
    `คะแนนเฉลี่ยของทีมอยู่ที่ ${kpis?.averageScore ?? 0} คะแนน`,
    `งาน Overdue ${overdueRate}% | เหลืองาน ${(kpis?.totalAssignments ?? 0) - (kpis?.totalApproved ?? 0)} / ${kpis?.totalAssignments ?? 0} งาน`,
    bestCompletionUser
      ? `${bestCompletionUser.nickname} มี Completion Rate สูงสุด ${bestCompletionUser.completionPct}%`
      : null,
  ].filter(Boolean) as string[];

  
const completionTrendWithLabel = monthlyTrendData.map(d => ({
  month: d.month.split("-")[1] || d.month,
  
  rate: Math.min(Number(d.approved) || 0, 100),
}));

  const parsedScoreByMonthData = scoreByMonthData.map(d => ({
    month: d.month.split("-")[1] || d.month, averageScore: d.averageScore,
  }));

  const dropDownStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#475569",
    border: "1.5px solid #e2e8f0", borderRadius: 8,
    padding: "4px 24px 4px 10px", cursor: "pointer", outline: "none",
    background: `#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 6px center`,
    appearance: "none",
  };

  return (
    <div style={{
      padding: isMobile ? "12px" : "24px",
      background: "#f0f4f9", minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif",
      display: "flex", flexDirection: "column", gap: 20,
    }}>

      {/* ROW 1: KPI Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(auto-fit, minmax(160px, 1fr))" : "repeat(5, 1fr)",
        gap: 14,
      }}>
        <KpiCard title="Total Assignments" value={kpis?.totalAssignments?.toString() || "0"} icon={<ClipboardList size={20} />} color="blue" />
        <KpiCard title="Completion Rate" value={completionRate.toString()} suffix="%" icon={<TrendingUp size={20} />} color="green" />
        <KpiCard title="Team Avg. Score" value={kpis?.averageScore?.toString() ?? "0"} suffix=" Points" icon={<Star size={20} />} color="purple" />
        <KpiCard title="Overdue Tasks" value={kpis?.lateSubmissions?.toString() || "0"} icon={<AlertTriangle size={20} />} color="orange" />
        <KpiCard title="Pending" value={userStatusData.reduce((acc, curr) => acc + (curr.pending ?? 0), 0).toString()} icon={<Clock size={20} />} color="orange" />
      </div>

      {/* ROW 2: Charts */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr 1.5fr", gap: 14 }}>
        <SectionCard title={`Completion Rate Trend (%) ${currentDisplayedYear}`}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={completionTrendWithLabel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [`${v}%`, "Rate"]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} />
              <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2.5}
                dot={{ fill: "#22c55e", r: 4, strokeWidth: 0 }}
                label={{ position: "top", fontSize: 10, fill: "#475569", fontWeight: 600, formatter: (v: any) => `${v}%` }}
              />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Assignment Status">
          <div style={{ position: "relative" }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusDistData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                  {statusDistData.map((entry, i) => <Cell key={`cell-${i}`} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />)}
                </Pie>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                  <tspan x="50%" dy="-0.3em" fontSize={26} fontWeight={700} fill="#0f172a">{totalDonut}</tspan>
                  <tspan x="50%" dy="1.5em" fontSize={12} fill="#94a3b8">Total</tspan>
                </text>
                <Tooltip formatter={(v: any, n: any) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {statusDistData.map(d => {
              const calculatedPercentage = totalDonut > 0
                ? ((d.value / totalDonut) * 100).toFixed(1) : "0.0";
              return (
                <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[d.name] || "#94a3b8", display: "inline-block" }} />
                    <span style={{ color: "#475569" }}>{d.name}</span>
                  </div>
                  <span style={{ color: "#0f172a", fontWeight: 600 }}>
                    {d.value} ({calculatedPercentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title={`Avg. Score Trend ${currentDisplayedYear}`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={parsedScoreByMonthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 150]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [v, "Avg Score"]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} />
              <Bar dataKey="averageScore" fill="#8b5cf6" radius={[6, 6, 0, 0]}
                label={{ position: "top", fontSize: 10, fill: "#475569", fontWeight: 600 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* ROW 3: Leaderboard + Top Performers */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 14, alignItems: "start" }}>
        <SectionCard
          title={
            leaderboardFilter === "All Time"
              ? "Team Leaderboard (Top 5) - All Time"
              : leaderboardFilter === "Monthly"
                ? `Team Leaderboard (Top 5) - ${month ? MONTH_NAMES_EN[Number(month) - 1] : ""} ${year || 2026}`
                : `Team Leaderboard (Top 5) - Weekly (${year || 2026})`
          }
          headerRight={
            <select value={leaderboardFilter} onChange={e => setLeaderboardFilter(e.target.value as any)} style={dropDownStyle}>
              <option>All Time</option>
              <option>Monthly</option>
              <option>Weekly</option>
            </select>
          }
        >
          <div style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: isMobile ? "600px" : "auto" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #f1f5f9" }}>
                  {["Rank", "Name", "Level", "Points", "Avg. Score", "Completion Rate", "Overdue"].map((h, i) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: i >= 3 ? "right" : "left", fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboardRows.map(row => (
                  <tr key={row.nickname} style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 12px", fontWeight: 700, fontSize: 15 }}>
                      {row.rank === 1 ? <span style={{ background: "#fbbf24", color: "#fff", width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>1</span>
                        : row.rank === 2 ? <span style={{ background: "#94a3b8", color: "#fff", width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>2</span>
                          : row.rank === 3 ? <span style={{ background: "#f97316", color: "#fff", width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>3</span>
                            : <span style={{ color: "#94a3b8", fontSize: 13 }}>{row.rank}</span>}
                    </td>
                    <td style={{ padding: "12px 12px", fontWeight: 600, color: "#0f172a" }}>{row.nickname}</td>
                    <td style={{ padding: "12px 12px" }}><LevelBadge level={row.level} /></td>
                    <td style={{ padding: "12px 12px", textAlign: "right", color: "#0f172a", fontWeight: 700 }}>{row.totalPoints.toLocaleString()}</td>
                    <td style={{ padding: "12px 12px", textAlign: "right", color: "#475569" }}>{row.avgScore}</td>
                    <td style={{ padding: "12px 12px", textAlign: "right", color: "#475569" }}>{row.completionRate}%</td>
                    <td style={{ padding: "12px 12px", textAlign: "right", color: row.overdue > 0 ? "#ef4444" : "#94a3b8", fontWeight: row.overdue > 0 ? 700 : 400 }}>{row.overdue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column" }}>
          <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
            Top Performers <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>({leaderboardFilter})</span>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {topPerformers.map((u, i) => {
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div key={u.username} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22 }}>{medals[i]}</span>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#475569", flexShrink: 0 }}>
                    {u.nickname.charAt(0)}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{u.nickname}</p>
                    <p style={{ margin: "1px 0 0", fontSize: 11, color: "#8b5cf6", fontWeight: 600 }}>{u.totalScore.toLocaleString()} Point</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 4: Overdue Alert + Team Insights + Workload Distribution */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 14 }}>
        <SectionCard
          title={
            leaderboardFilter === "All Time"
              ? "⚠ Overdue Alert - All Time"
              : leaderboardFilter === "Monthly"
                ? `⚠ Overdue Alert - ${month ? MONTH_NAMES_EN[Number(month) - 1] : ""} ${year || 2026}`
                : `⚠ Overdue Alert - Weekly (${year || 2026})`
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {overdueAlerts.length > 0 ? (
              overdueAlerts.map((u, i) => (
                <div key={u.username} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: i === 0 ? "#ef4444" : i === 1 ? "#f97316" : "#f59e0b",
                      color: "#fff", fontSize: 12, fontWeight: 700,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{u.nickname}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>
                    {u.rejected} <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>งาน</span>
                  </span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 13 }}>
                {leaderboardFilter === "Monthly"
                  ? `ไม่มีงาน Overdue ในเดือน ${month ? MONTH_NAMES_EN[Number(month) - 1] : ""} ${year || 2026}`
                  : "ไม่มีงาน Overdue ในขณะนี้"}
              </div>
            )}
          </div>
          {overdueAlerts.length > 0 && (
            <button
              onClick={() => setShowOverdueModal(true)}
              style={{ marginTop: 16, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#6366f1", display: "flex", alignItems: "center", gap: 4, padding: 0 }}
            >
              View All <ArrowRight size={13} />
            </button>
          )}
        </SectionCard>

        <SectionCard title="Team Insights">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>✓</span>
                <span style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>{ins}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <WorkloadDistributionSection userStatusData={userStatusData} />
      </div>

      <OverdueModal isOpen={showOverdueModal} onClose={() => setShowOverdueModal(false)} overdueData={userStatusData} />
    </div>
  );
}