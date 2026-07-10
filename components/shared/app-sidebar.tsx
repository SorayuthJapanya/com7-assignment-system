"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import { navbarItems } from "@/utils/navbarItem";
import Image from "next/image";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { ChevronRight, Clock } from "lucide-react"; 
import { usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { useAuth, useAuthUser } from "@/contexts/auth-context";
import { IUser } from "@/types/auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useGetLevels } from "@/hooks/use-level";
import { usePublicLeaderboard } from "@/hooks/use-leaderboard";
import { ILevel } from "@/types/level";

// ─── Types & Constants ────────────────────────────────────────────────────────

interface AssignmentItem {
  id: number;
  deadline: string;
  status: "Approved" | "Rejected" | "Pending" | "In Progress";
  submissionUrl?: string;
}

const CHALLENGE_TOTAL = 5;
const CHALLENGE_XP = 300;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRole = (role: string) => {
  switch (role) {
    case "SUPER_ADMIN": return "Super Admin";
    case "ADMIN": return "Admin";
    case "STAFF": return "Staff";
    case "INTERN": return "Intern";
    default: return role;
  }
};

function resolveLevel(score: number, levels: ILevel[]) {
  const sorted = [...levels].sort((a, b) => a.minScore - b.minScore);
  let matchedIndex = sorted.findIndex((l) => score >= l.minScore && score <= l.maxScore);

  if (matchedIndex === -1 && sorted.length > 0 && score > sorted[sorted.length - 1].maxScore) {
    matchedIndex = sorted.length - 1;
  }

  const current = sorted[matchedIndex] ?? null;
  if (!current) return null;

  const cleanedName = current.name.replace(/^LV\d+_/i, "").replace(/^Level\s*\d+_/i, "");

  return {
    ...current,
    name: cleanedName,
    displayLevelNumber: matchedIndex + 1
  };
}

function getWeekStart(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function getCurrentWeekDays(): Date[] {
  const monday = getWeekStart();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function calcWeeklyCompleted(assignments: AssignmentItem[]): number {
  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return assignments.filter((a) => {
    if (a.status !== "Approved") return false;
    const dl = new Date(a.deadline);
    return dl >= weekStart && dl < weekEnd;
  }).length;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AppSidebar() {
  const pathname = usePathname();
  const { isSuperAdmin, isAdmin, isIntern } = useAuth();
  const authUser = useAuthUser() as IUser | null;

  const { data: levels = [] } = useGetLevels();
  const { data: leaderboardData = { leaderboard: [] } } = usePublicLeaderboard({ limit: 200 });

  const myEntry = leaderboardData?.leaderboard?.find(
    (e: any) => e.userId === authUser?.id
  );
  const totalScore = myEntry?.totalScore ?? (authUser as any)?.totalScore ?? 0;
  const currentLevel = useMemo(
    () => resolveLevel(totalScore, levels),
    [totalScore, levels]
  );

  const [mounted, setMounted] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    fetch("/api/assignment?myAssignments=true&limit=100")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.assignments) setAssignments(json.assignments);
      })
      .catch(() => { });
  }, [mounted]);

  const weekDays = useMemo(() => getCurrentWeekDays(), []);
  const weeklyCompleted = useMemo(() => calcWeeklyCompleted(assignments), [assignments]);
  const challengeProgress = Math.min(weeklyCompleted, CHALLENGE_TOTAL);
  const challengeDone = challengeProgress >= CHALLENGE_TOTAL;

  const isActive = (url?: string) => {
    if (!url) return false;
    if (url === "/dashboard") return pathname === url;
    return pathname.startsWith(url);
  };
  const isSubItemActive = (url: string) => pathname === url;

  const filteredNavbarItems = useMemo(() => {
    if (isIntern) {
      return navbarItems.filter((item) => item.title === "Daily Report");
    }

    return navbarItems
      .map((item) => ({
        ...item,
        items: item.items?.filter((sub) => {
          if (sub.isSuperAdmin && !isSuperAdmin) return false;
          if (sub.isAdmin && !isAdmin) return false;
          return true;
        }),
      }))
      .filter((item) => {
        if (item.isSuperAdmin && !isSuperAdmin) return false;
        if (item.isAdmin && !isAdmin) return false;
        return true;
      });
  }, [isSuperAdmin, isAdmin, isIntern]);

  if (!mounted) return null;

  const avatarUrl = authUser?.profileImage;
  const initials = authUser?.nickname?.charAt(0).toUpperCase() ?? "U";

  return (
    <Sidebar className="flex flex-col h-screen overflow-hidden">

      {/* ───── Header: Logo + Profile ───── */}
      <SidebarHeader className="shrink-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image src="/logo.svg" alt="COM7 Logo" width={32} height={32} className="rounded-lg" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">COM7</span>
                  <span className="text-xs">Assignment System</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {authUser && (
          <div className="flex flex-col items-center gap-1.5 px-3 py-2 border-b border-sidebar-border">
            <Avatar className="size-14 ring-2 ring-primary/30">
              <AvatarImage src={avatarUrl || undefined} alt={authUser.nickname} />
              <AvatarFallback className="bg-primary text-white font-semibold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col items-center gap-0.5 text-center">
              <p className="font-semibold text-sm leading-tight">Hi, {authUser.nickname}</p>
              <p className="text-xs text-muted-foreground leading-tight">{authUser.email}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center rounded-full bg-primary text-white text-[10px] font-bold px-2 py-0.5">
                {formatRole(authUser.role)}
              </span>

              {currentLevel ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: `${currentLevel.color}15`,
                    color: currentLevel.color,
                    borderColor: `${currentLevel.color}40`,
                  }}
                >
                  {currentLevel.emoji} Lv.{currentLevel.displayLevelNumber}_{currentLevel.name}
                </span>
              ) : (
                totalScore > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {totalScore.toLocaleString()} XP
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </SidebarHeader>

      {/* ───── Content: เมนูนำทาง ───── */}
      <SidebarContent className="flex-1 overflow-y-auto overflow-x-hidden select-none pr-0">
        <SidebarGroup className="py-1.5">
          <SidebarGroupLabel className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {filteredNavbarItems.map((item) => {
                if (item.title === "Leaderboard") {
                  return (
                    <React.Fragment key="leaderboard-group">
                      {!isAdmin && !isSuperAdmin && !isIntern && (
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            size="default"
                            className={
                              isActive("/overdue-deduction")
                                ? "bg-primary/10 text-primary font-semibold hover:bg-primary/20 hover:text-primary"
                                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            }
                          >
                            <Link href="/overdue-deduction">
                              <Clock className="size-4" />
                              <span className="text-sm">Overdue Deduction</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}

                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          size="default"
                          className={
                            isActive(item.url)
                              ? "bg-primary/10 text-primary font-semibold hover:bg-primary/20 hover:text-primary"
                              : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }
                        >
                          <Link href={item.url ?? "#"}>
                            {item.icon && <item.icon className="size-4" />}
                            <span className="text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </React.Fragment>
                  );
                }

                return (
                  <Collapsible key={item.title} asChild defaultOpen={isActive(item.url)}>
                    <SidebarMenuItem>
                      {item.items?.length ? (
                        <>
                          <CollapsibleTrigger asChild className="group/collapsible">
                            <SidebarMenuButton
                              size="default"
                              data-active={isActive(item.url) ? "true" : "false"}
                              className={isActive(item.url) ? "bg-primary text-primary-foreground font-medium" : ""}
                            >
                              {item.icon && <item.icon className="size-4" />}
                              <span className="text-sm">{item.title}</span>
                              <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className="my-0.5 border-l border-sidebar-border ml-4 pl-2 gap-0.5">
                              {item.items.map((subItem) => (
                                <SidebarMenuItem key={subItem.title}>
                                  <SidebarMenuButton
                                    asChild
                                    size="default"
                                    className={
                                      isSubItemActive(subItem.url || "")
                                        ? "bg-primary/10 text-primary font-medium hover:bg-primary/20 hover:text-primary"
                                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground"
                                    }
                                  >
                                    <Link href={subItem.url ?? "#"}>
                                      <span className="text-sm">{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          size="default"
                          className={
                            isActive(item.url)
                              ? "bg-primary/10 text-primary font-semibold hover:bg-primary/20 hover:text-primary"
                              : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }
                        >
                          <Link href={item.url ?? "#"}>
                            {item.icon && <item.icon className="size-4" />}
                            <span className="text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ───── Footer ───── */}
      <SidebarFooter className="shrink-0 border-t border-sidebar-border bg-sidebar max-h-[45vh] overflow-y-auto p-0 gap-0">

        {/* ───── WEEKLY CHALLENGE Card ───── */}
        {!isIntern && (
          <SidebarGroup className="px-3 pt-1 pb-2">
            <div className={`rounded-xl border p-2.5 flex flex-col gap-1.5 ${challengeDone ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-100"}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{challengeDone ? "🏆" : "🎯"}</span>
                <span className={`text-[10px] font-bold tracking-wide uppercase ${challengeDone ? "text-green-700" : "text-yellow-700"}`}>
                  Weekly Challenge
                </span>
              </div>
              <p className="text-[10px] text-gray-700 leading-tight font-medium">
                {challengeDone
                  ? `Challenge completed! 🎉 (${challengeProgress}/${CHALLENGE_TOTAL})`
                  : `Complete ${CHALLENGE_TOTAL} assignments this week (${challengeProgress}/${CHALLENGE_TOTAL})`}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-1 rounded-full transition-all duration-500 ${challengeDone ? "bg-green-500" : "bg-orange-400"}`}
                  style={{ width: `${(challengeProgress / CHALLENGE_TOTAL) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between leading-none">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {challengeProgress} / {CHALLENGE_TOTAL}
                </span>
                <span className={`flex items-center gap-0.5 text-[10px] font-bold ${challengeDone ? "text-green-700" : "text-gray-700"}`}>
                  🎁 +{CHALLENGE_XP} XP
                </span>
              </div>
            </div>
          </SidebarGroup>
        )}

      </SidebarFooter>

    </Sidebar>
  );
}