"use client";

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Filter, Search, User, Users2, X } from "lucide-react";
import { IFilteredAssignment } from "@/types/assignment";
import { useGetUsers } from "@/hooks/use-auth";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

interface AssignmentFilterProps {
  filtered: IFilteredAssignment;
  handleFiltered: (
    key: keyof IFilteredAssignment,
    value: string | number | boolean
  ) => void;
  onClear: () => void;
  total?: number;
  isSuperAdmin?: boolean;
}

export default function AssignmentFilter({
  filtered,
  handleFiltered,
  onClear,
  total = 0,
  isSuperAdmin = false,
}: AssignmentFilterProps) {
  const activeMonthLabel = MONTHS.find((m) => m.value === filtered.deadlineMonth)?.label;
  const { data: usersData } = useGetUsers({ search: "" });
  const usernames = usersData?.data?.map((u) => u.username).sort() ?? [];

  const hasActiveFilters =
    !!filtered.search ||
    (filtered.type && filtered.type !== "all") ||
    (filtered.status && filtered.status !== "all") ||
    !!filtered.username ||
    !!filtered.deadlineMonth;

  return (
    <div className="flex items-center justify-center sm:justify-end gap-2">

      {/* Search */}
      <InputGroup>
        <InputGroupInput
          placeholder="Search..."
          value={filtered.search}
          onChange={(e) => handleFiltered("search", e.target.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupAddon align={"inline-end"}>
          <p className="text-xs font-normal text-muted-foreground">
            {total} assignment{total !== 1 ? "s" : ""}
          </p>
        </InputGroupAddon>
      </InputGroup>

      {/* Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Filter /> Filters
            {(filtered.deadlineMonth || filtered.username) && (
              <span className="ml-1 size-2 rounded-full bg-primary inline-block" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="flex items-center justify-between px-2 py-1">
            <DropdownMenuLabel className="p-0">Filter Options</DropdownMenuLabel>
            {hasActiveFilters && (
              <Button variant="outline" size="sm"
                onClick={onClear}
              >
                <X className="size-3" /> Clear
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />

          {/* Username — SUPER_ADMIN only */}
          {isSuperAdmin && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                Username
                {filtered.username && (
                  <span className="ml-auto text-xs text-primary truncate max-w-16">{filtered.username}</span>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="max-h-60 overflow-y-auto">
                  <DropdownMenuRadioGroup
                    value={filtered.username ?? ""}
                    onValueChange={(v) => handleFiltered("username", v)}
                  >
                    <DropdownMenuRadioItem value="">All</DropdownMenuRadioItem>
                    {usernames.map((u) => (
                      <DropdownMenuRadioItem key={u} value={u}>
                        {u}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          )}

          {/* Type */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Type {filtered.type && (
                  <span className="ml-auto text-xs text-primary truncate max-w-16">{filtered.type}</span>
                )}</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={filtered.type}
                  onValueChange={(v) => handleFiltered("type", v)}
                >
                  <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Individual">
                    <User /> Individual
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Group">
                    <Users2 /> Group
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          {/* Status */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Status
              {filtered.status && (
                  <span className="ml-auto text-xs text-primary truncate max-w-16">{filtered.status}</span>
                )}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={filtered.status}
                  onValueChange={(v) => handleFiltered("status", v)}
                >
                  <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="not-submit">🟠 Not Submit</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Pending">🟡 Pending</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Approved">🟢 Approved</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Rejected">🔴 Rejected</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          {/* Deadline Month */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              Deadline Month
              {activeMonthLabel && (
                <span className="ml-auto text-xs text-primary">{activeMonthLabel.slice(0, 3)}</span>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                <DropdownMenuRadioGroup
                  value={filtered.deadlineMonth ?? "all"}
                  onValueChange={(v) => handleFiltered("deadlineMonth", v === "all" ? "" : v)}
                >
                  <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                  {MONTHS.map((m) => (
                    <DropdownMenuRadioItem key={m.value} value={m.value}>
                      {m.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          {/* Limit */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Limit {filtered.limit && (
                  <span className="ml-auto text-xs text-primary truncate max-w-16">{filtered.limit}</span>
                )}</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={filtered?.limit?.toString()}
                  onValueChange={(v) => handleFiltered("limit", parseInt(v))}
                >
                  <DropdownMenuRadioItem value="15">15</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="30">30</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="60">60</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
