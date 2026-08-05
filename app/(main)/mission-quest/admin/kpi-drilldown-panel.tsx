"use client";

import { useMemo } from "react";
import { ArrowLeft, X } from "lucide-react";
import type { KpiScope } from "./admin-kpi-cards";

type ClaimRow = {
  id: string;
  userId: string;
  nickname: string;
  username: string;
  missionId: string;
  points: number;
  month: number;
  year: number;
  claimedAt: string;
};

type OverdueRow = {
  id: string;
  userId: string;
  nickname: string;
  username: string;
  points: number;
  pointsUsed: number;
  minutes: number;
  createdAt: string;
};

type DetailUser = {
  userId: string;
  username: string;
  nickname: string;
};

type Person = {
  userId: string;
  username: string;
  nickname: string;
  total: number;
  count: number;
};

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

function isThisMonth(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}

type Props = {
  scope: KpiScope;
  claims: ClaimRow[];
  overdue: OverdueRow[];
  detailUser: DetailUser | null;
  onSelectUser: (u: DetailUser) => void;
  onBackToPeople: () => void;
  onClose: () => void;
};

export default function KpiDrilldownPanel({
  scope,
  claims,
  overdue,
  detailUser,
  onSelectUser,
  onBackToPeople,
  onClose,
}: Props) {
  if (!scope) return null;

  const safeClaims = claims ?? [];
  const safeOverdue = overdue ?? [];

  const filteredClaims = useMemo(() => {
    if (!scope || scope.kind !== "claim") return [];
    if (scope.key === "claimsToday" || scope.key === "pointsToday") {
      return safeClaims.filter((c) => isToday(c.claimedAt));
    }
    return safeClaims.filter((c) => isThisMonth(c.claimedAt));
  }, [safeClaims, scope]);

  const filteredOverdue = useMemo(() => {
    if (!scope || scope.kind !== "overdue") return [];
    if (scope.key === "overdueCountToday" || scope.key === "overduePointsToday") {
      return safeOverdue.filter((r) => isToday(r.createdAt));
    }
    return safeOverdue.filter((r) => isThisMonth(r.createdAt));
  }, [safeOverdue, scope]);

  const people: Person[] = useMemo(() => {
    const map = new Map<string, Person>();

    if (scope.kind === "claim") {
      filteredClaims.forEach((c) => {
        const cur = map.get(c.userId) ?? {
          userId: c.userId,
          username: c.username,
          nickname: c.nickname,
          total: 0,
          count: 0,
        };
        cur.total += c.points ?? 0;
        cur.count += 1;
        map.set(c.userId, cur);
      });
    } else {
      filteredOverdue.forEach((r) => {
        const cur = map.get(r.userId) ?? {
          userId: r.userId,
          username: r.username,
          nickname: r.nickname,
          total: 0,
          count: 0,
        };
        cur.total += r.pointsUsed ?? Math.abs(r.points ?? 0);
        cur.count += 1;
        map.set(r.userId, cur);
      });
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [scope.kind, filteredClaims, filteredOverdue]);

  const personClaims = detailUser
    ? filteredClaims.filter((c) => c.userId === detailUser.userId)
    : [];
  const personOverdue = detailUser
    ? filteredOverdue.filter((r) => r.userId === detailUser.userId)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {detailUser ? (
              <button
                type="button"
                onClick={onBackToPeople}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 shrink-0"
              >
                <ArrowLeft className="size-4" />
              </button>
            ) : null}
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {detailUser
                ? `${detailUser.nickname} (@${detailUser.username})`
                : scope.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {!detailUser && (
            <ul className="divide-y divide-slate-100">
              {people.length === 0 && (
                <li className="py-8 text-center text-sm text-slate-400">ไม่มีข้อมูล</li>
              )}
              {people.map((p) => (
                <li key={p.userId}>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectUser({
                        userId: p.userId,
                        username: p.username,
                        nickname: p.nickname,
                      })
                    }
                    className="w-full flex items-center justify-between gap-3 py-2.5 px-1 text-left hover:bg-slate-50 rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {p.nickname}
                      </p>
                      <p className="text-xs text-slate-400">
                        @{p.username} · {p.count} ครั้ง
                      </p>
                    </div>
                    <span
                      className={
                        scope.kind === "claim"
                          ? "text-sm font-bold text-emerald-600 shrink-0"
                          : "text-sm font-bold text-red-600 shrink-0"
                      }
                    >
                      {scope.kind === "claim" ? "+" : "-"}
                      {p.total.toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {detailUser && scope.kind === "claim" && (
            <ul className="divide-y divide-slate-100">
              {personClaims.length === 0 && (
                <li className="py-8 text-center text-sm text-slate-400">ไม่มีรายการ</li>
              )}
              {personClaims.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">{c.missionId}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(c.claimedAt).toLocaleString("th-TH")} · {c.month}/{c.year}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-600 shrink-0">
                    +{(c.points ?? 0).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {detailUser && scope.kind === "overdue" && (
            <ul className="divide-y divide-slate-100">
              {personOverdue.length === 0 && (
                <li className="py-8 text-center text-sm text-slate-400">ไม่มีรายการ</li>
              )}
              {personOverdue.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">Redeem overdue</p>
                    <p className="text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleString("th-TH")} ·{" "}
                      {(r.minutes ?? 0).toLocaleString()} นาที
                    </p>
                  </div>
                  <span className="font-bold text-red-600 shrink-0">
                    -{(r.pointsUsed ?? Math.abs(r.points ?? 0)).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}