"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, User, ChevronDown, Check } from "lucide-react";
import type { MissionQuestResponse } from "@/types/mission-quest";
import MissionSection from "@/components/mission-quest/mission-section";
import MissionCharts from "@/components/mission-quest/mission-charts";

type StaffOption = { id: string; username: string };

type Props = {
  userId: string;
  username: string;
  onBack: () => void;
  staffUsers: StaffOption[];
  onSelectUser: (id: string, username: string) => void;
};

export default function StaffDetailView({
  userId,
  username,
  onBack,
  staffUsers,
  onSelectUser,
}: Props) {
  const [data, setData] = useState<MissionQuestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/mission-quest?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          setData(await res.json());
        } else {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? `API error ${res.status}`);
        }
      } catch (err: any) {
        setError(err?.message ?? "Network error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="size-4" /> กลับ
          </button>
          <h1 className="text-xl font-bold text-slate-900">
            Mission & Quest — <span className="text-blue-600">@{username}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ดูความคืบหน้าและจุดที่ยังติดปัญหาของ Staff คนนี้ (มุมมอง Admin)
          </p>
        </div>

        {/* Dropdown สลับ Username — เฉพาะ STAFF (รายการมาจาก parent ที่ filter แล้ว) */}
        <div ref={dropdownRef} className="relative w-full md:w-64 shrink-0">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <span className="flex items-center gap-2">
              <User className="size-4 text-slate-400" />
              <span className="font-medium">@{username}</span>
            </span>
            <ChevronDown
              className={`size-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 border-b border-slate-100">
                Username
              </div>
              <div className="max-h-64 overflow-y-auto">
                {staffUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      if (u.id !== userId) onSelectUser(u.id, u.username);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0"
                  >
                    <span
                      className={`flex items-center justify-center size-4 rounded-full border shrink-0 ${
                        u.id === userId ? "border-slate-700 bg-slate-700" : "border-slate-300"
                      }`}
                    >
                      {u.id === userId && (
                        <Check className="size-2.5 text-white" strokeWidth={3} />
                      )}
                    </span>
                    <span className="text-slate-700">{u.username}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          โหลดข้อมูลไม่สำเร็จ: {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {data.sections.map((section) => (
            <MissionSection
              key={section.key}
              section={section}
              onClaim={() => {}}
              claimingId={null}
              readOnly
            />
          ))}

          <MissionCharts categoryChart={data.categoryChart} progressChart={data.progressChart} />
        </>
      )}
    </div>
  );
}