"use client";

/**
 * CustomFilterDropdown
 * ============================================================================
 * ใช้แทน <select> เดิมใน WorkloadDistributionSection
 * ฟังก์ชันเหมือนเดิมทุกอย่าง: อ่าน/เซ็ต workloadFilter state ตัวเดิม
 * ("all" | "submitted" | "pending" | "approved" | "top5" | "bottom5")
 *
 * วิธีใช้ (ใน dashboard.tsx เดิม):
 * 1. import CustomFilterDropdown from "./custom-filter-dropdown";
 * 2. ลบ <select> เดิมและ selectStyle object ออก
 * 3. แทนที่ด้วย:
 *      <CustomFilterDropdown value={workloadFilter} onChange={setWorkloadFilter} />
 * ============================================================================
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  BadgeCheck,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Check,
} from "lucide-react";

export type WorkloadFilterValue =
  | "all"
  | "submitted"
  | "pending"
  | "approved"
  | "top5"
  | "bottom5";

interface OptionConfig {
  value: WorkloadFilterValue;
  label: string;
  icon: React.ReactNode;
  iconColor: string;
}

interface GroupConfig {
  groupLabel: string;
  options: OptionConfig[];
}

const GROUPS: GroupConfig[] = [
  {
    groupLabel: "สถานะ",
    options: [
      { value: "all", label: "แสดงข้อมูลบุคคลทั้งหมด", icon: <Users size={14} />, iconColor: "#6366f1" },
      { value: "submitted", label: "สถานะ Submitted", icon: <CheckCircle2 size={14} />, iconColor: "#22c55e" },
      { value: "pending", label: "สถานะ Pending", icon: <Clock size={14} />, iconColor: "#f59e0b" },
      { value: "approved", label: "Status Approved", icon: <BadgeCheck size={14} />, iconColor: "#6366f1" },
    ],
  },
  {
    groupLabel: "อันดับ",
    options: [
      { value: "top5", label: "คนที่ได้งานเยอะที่สุด (Top 5)", icon: <TrendingUp size={14} />, iconColor: "#475569" },
      { value: "bottom5", label: "คนที่ได้งานน้อยที่สุด (Bottom 5)", icon: <TrendingDown size={14} />, iconColor: "#475569" },
    ],
  },
];

const ALL_OPTIONS: OptionConfig[] = GROUPS.flatMap(g => g.options);

interface CustomFilterDropdownProps {
  value: WorkloadFilterValue;
  onChange: (value: WorkloadFilterValue) => void;
}

export function CustomFilterDropdown({ value, onChange }: CustomFilterDropdownProps)  {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = ALL_OPTIONS.find(o => o.value === value) ?? ALL_OPTIONS[0];

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ปิดด้วย Esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const handleSelect = (option: OptionConfig) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", marginBottom: 16 }}>
      {/* --- Trigger button (แทนที่ตัว select เดิม) --- */}
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          fontSize: 13,
          fontWeight: 600,
          color: "#475569",
          border: "1.5px solid #e2e8f0",
          borderRadius: 10,
          padding: "8px 12px",
          outline: "none",
          backgroundColor: "#fff",
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
          <span style={{ color: selected.iconColor, display: "flex", flexShrink: 0 }}>{selected.icon}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selected.label}
          </span>
        </span>
        <ChevronDown
          size={15}
          color="#94a3b8"
          style={{ flexShrink: 0, transition: "transform .15s", transform: isOpen ? "rotate(180deg)" : "none" }}
        />
      </button>

      {/* --- Dropdown list --- */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 40,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            overflow: "hidden",
            padding: "4px 0",
          }}
        >
          {GROUPS.map((group, gi) => (
            <div key={group.groupLabel}>
              {gi > 0 && <div style={{ borderTop: "0.5px solid #f1f5f9", margin: "4px 0" }} />}
              <div
                style={{
                  padding: "6px 12px 4px",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {group.groupLabel}
              </div>
              {group.options.map(option => {
                const isSelected = option.value === value;
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => handleSelect(option)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect(option);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? "#4338ca" : "#475569",
                      background: isSelected ? "#eef2ff" : "transparent",
                      cursor: "pointer",
                      transition: "background .12s",
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={{ color: option.iconColor, display: "flex", flexShrink: 0 }}>{option.icon}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {option.label}
                    </span>
                    {isSelected && <Check size={13} color="#4338ca" style={{ flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}