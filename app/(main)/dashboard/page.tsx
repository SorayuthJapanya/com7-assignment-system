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
import { Filter } from "lucide-react";
import { useState } from "react";

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

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function DashboardPage() {
  const isSuperAdmin = useIsSuperAdmin();

  // set default year and month
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  return (
    <div className="w-full max-w-8xl mx-auto space-y-8">
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
              <Filter /> {months.find((m) => m.value === month)?.label} {year}
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
                    value={year.toString()}
                    onValueChange={(v) => setYear(parseInt(v))}
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
              <DropdownMenuSubTrigger>Month</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={month.toString()}
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
