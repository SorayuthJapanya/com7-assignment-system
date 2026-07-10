"use client";

import SuperAdminDashboard from "@/components/dashboard/super-admin-dashboard";
import UserDashboard from "@/components/dashboard/user-dashboard";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsSuperAdmin } from "@/hooks/use-current-user";
import { useAuth } from "@/contexts/auth-context"; 
import { Filter, X } from "lucide-react";
// 1. นำเข้า useRouter และ useEffect สำหรับทำ Redirect
import { useRouter } from "next/navigation"; 
import { useMemo, useState, useEffect } from "react";

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function DashboardPage() {
  const { isSuperAdmin, isLoading: isSuperAdminLoading } = useIsSuperAdmin();
  const { isIntern, isLoading: isAuthLoading } = useAuth(); 
  // 2. เรียกใช้งาน router
  const router = useRouter(); 

  const [currentYear] = useState(() => new Date().getFullYear());
  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => currentYear - 2 + i),
    [currentYear]
  );

  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);

  const isLoading = isSuperAdminLoading || isAuthLoading;

  
  useEffect(() => {
    if (!isLoading && isIntern) {
      router.replace("/daily-report");
    }
  }, [isIntern, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center p-6">
        <span className="text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  // 4. ระหว่างที่กำลังเปลี่ยนเส้นทาง ไม่ต้องเรนเดอร์ UI แดชบอร์ด
  if (isIntern) return null;

  const filterLabel = year
    ? month
      ? `${months.find((m) => m.value === month)?.label} ${year}`
      : `All ${year}`
    : "All Time";

  return (
    <div className="w-full max-w-7xl xl:max-w-360 mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
        <Header
          title={isSuperAdmin ? "Overview Dashboard" : "Dashboard"}
          subTitle={
            isSuperAdmin
              ? "Analytics and system overview"
              : "Your assignment management hub"
          }
        />

        {/* Filtered */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter /> {filterLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Year</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={year?.toString() ?? ""}
                    onValueChange={(v) => {
                      setYear(parseInt(v));
                      setMonth(null);
                    }}
                  >
                    {years.map((y) => (
                      <DropdownMenuRadioItem key={y} value={y.toString()}>
                        {y}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={!year}>Month</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={month?.toString() ?? ""}
                    onValueChange={(v) => setMonth(parseInt(v))}
                  >
                    {months.map((m) => (
                      <DropdownMenuRadioItem
                        key={m.value}
                        value={m.value.toString()}
                      >
                        {m.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            {(year || month) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel
                  className="flex items-center gap-1 cursor-pointer font-normal text-muted-foreground hover:text-foreground"
                  onClick={() => { setYear(null); setMonth(null); }}
                >
                  <X className="w-3 h-3" /> Clear filter
                </DropdownMenuLabel>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isSuperAdmin ? (
        <SuperAdminDashboard year={year} month={month} />
      ) : (
        <UserDashboard year={year} month={month} />
      )}
    </div>
  );
}