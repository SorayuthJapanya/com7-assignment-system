"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useAuthUser } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { ShieldAlert, User, ChevronDown, Check } from "lucide-react";
import { useGetUsers } from "@/hooks/use-auth";
import StaffDetailView from "./staff-detail-view";

type UserOption = { id: string; username: string; nickname: string; role: string };

export default function MissionQuestAdminPage() {
  const authUser = useAuthUser();
  const router = useRouter();

  // ── เลือกดู Mission Board ของ staff คนไหน ──
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { data: usersData } = useGetUsers({
    search: "",
    includeHidden: false,
    enabled: authUser?.role === "SUPER_ADMIN",
  });

  useEffect(() => {
    if (authUser && authUser.role !== "SUPER_ADMIN") {
      router.replace("/mission-quest");
    }
  }, [authUser, router]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // แสดงเฉพาะ STAFF — ไม่นับ INTERN และ SUPER_ADMIN
  const sortedUsers = useMemo((): UserOption[] => {
    const raw = (usersData as { data?: UserOption[] } | undefined)?.data;
    const list: UserOption[] = Array.isArray(raw) ? raw : [];

    return list
      .filter((u) => u.role === "STAFF")
      .sort((a, b) => (a.username || "").localeCompare(b.username || "", "en"));
  }, [usersData]);

  const handleSelectAll = useCallback(() => {
    setIsOpen(false);
    setSelectedUser(null);
  }, []);

  const handleSelectUser = useCallback((id: string, username: string) => {
    setIsOpen(false);
    setSelectedUser({ id, username });
  }, []);

  if (!authUser || authUser.role !== "SUPER_ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert className="size-8 text-red-500" />
        <p className="text-sm text-slate-500">เฉพาะ Super Admin เท่านั้น</p>
      </div>
    );
  }

  if (selectedUser) {
    return (
      <StaffDetailView
        userId={selectedUser.id}
        username={selectedUser.username}
        onBack={() => setSelectedUser(null)}
        staffUsers={sortedUsers.map((u) => ({ id: u.id, username: u.username }))}
        onSelectUser={handleSelectUser}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mission Quest Admin</h1>
          <p className="text-sm text-slate-500 mt-1">
            ภาพรวมตารางคะแนนและสถานะประจำวัน
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div ref={dropdownRef} className="relative w-full md:w-64">
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <User className="size-4 text-slate-400" />
                <span className="font-medium">Username</span>
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
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-slate-50 border-b border-slate-50"
                  >
                    <span className="flex items-center justify-center size-4 rounded-full border border-slate-700 bg-slate-700">
                      <Check className="size-2.5 text-white" strokeWidth={3} />
                    </span>
                    <span className="font-medium text-slate-700">All</span>
                  </button>

                  {sortedUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUser(u.id, u.username)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0"
                    >
                      <span className="flex items-center justify-center size-4 rounded-full border border-slate-300 shrink-0" />
                      <span className="text-slate-700">{u.username}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}