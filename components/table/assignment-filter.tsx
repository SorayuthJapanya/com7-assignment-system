"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { IFilteredAssignment } from "@/types/assignment";
import { useGetUsers } from "@/hooks/use-auth";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useState } from "react";
import {
  Search,
  Users,
  User,
  ChevronDown,
  CalendarDays,
  LayoutList,
  X,
} from "lucide-react";

const LIMIT_OPTIONS = [15, 30, 60];

interface AssignmentFilterProps {
  filtered: IFilteredAssignment;
  handleFiltered: (
    key: keyof IFilteredAssignment,
    value: string | number | boolean
  ) => void;
  onClear: () => void;
  total?: number;
  isSuperAdmin?: boolean;
  // caller must also pass these so the filter can manage date-range externally
  dateRange?: DateRange | undefined;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

export default function AssignmentFilter({
  filtered,
  handleFiltered,
  onClear,
  total = 0,
  isSuperAdmin = false,
  dateRange,
  onDateRangeChange,
}: AssignmentFilterProps) {
  // If the parent didn't lift date-range state up, manage it internally
  const [localDateRange, setLocalDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const activeDateRange = dateRange ?? localDateRange;

  const { data: usersData } = useGetUsers({ search: "" });
  const usernames = usersData?.data?.map((u) => u.username).sort() ?? [];

  const handleDateSelect = (range: DateRange | undefined) => {
    if (onDateRangeChange) {
      onDateRangeChange(range);
    } else {
      setLocalDateRange(range);
    }

    // Push ISO strings into the shared filter so the API receives them
    if (range?.from) {
      handleFiltered("deadlineFrom" as keyof IFilteredAssignment, format(range.from, "yyyy-MM-dd"));
      handleFiltered(
        "deadlineTo" as keyof IFilteredAssignment,
        range.to ? format(range.to, "yyyy-MM-dd") : ""
      );
    } else {
      handleFiltered("deadlineFrom" as keyof IFilteredAssignment, "");
      handleFiltered("deadlineTo" as keyof IFilteredAssignment, "");
    }

    if (range?.from && range?.to) setCalendarOpen(false);
  };

  const clearDate = () => {
    handleDateSelect(undefined);
    setCalendarOpen(false);
  };

  const handleClearAll = () => {
    setLocalDateRange(undefined);
    onClear();
  };

  const dueDateLabel = (() => {
    if (!activeDateRange?.from) return "Due date";
    if (!activeDateRange.to)
      return format(activeDateRange.from, "d MMM yy", { locale: th });
    return `${format(activeDateRange.from, "d MMM", { locale: th })} – ${format(
      activeDateRange.to,
      "d MMM yy",
      { locale: th }
    )}`;
  })();

  const hasActiveFilters =
    !!filtered.search ||
    (filtered.type && filtered.type !== "all") ||
    !!filtered.username ||
    !!activeDateRange?.from;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">

      {/* Search */}
      <InputGroup className="flex-1 min-w-52">
        <InputGroupInput
          placeholder="ค้นหาชื่องาน หรือชื่อผู้รับมอบหมาย..."
          value={filtered.search}
          onChange={(e) => handleFiltered("search", e.target.value)}
        />
        <InputGroupAddon>
          <Search className="w-4 h-4" />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <p className="text-xs text-muted-foreground">
            {total} assignment{total !== 1 ? "s" : ""}
          </p>
        </InputGroupAddon>
      </InputGroup>

      <div className="flex items-center gap-2 flex-wrap">

        {/* Username — SUPER_ADMIN only */}
        {isSuperAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs gap-1.5",
                  filtered.username && "border-primary/50 text-primary bg-primary/5"
                )}
              >
                <User className="w-3.5 h-3.5" />
                {filtered.username || "Username"}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 max-h-60 overflow-y-auto">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Username</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={filtered.username ?? ""}
                onValueChange={(v) => handleFiltered("username", v)}
              >
                <DropdownMenuRadioItem value="" className="text-sm">All</DropdownMenuRadioItem>
                {usernames.map((u) => (
                  <DropdownMenuRadioItem key={u} value={u} className="text-sm">{u}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Type */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "text-xs gap-1.5",
                filtered.type && filtered.type !== "all" &&
                  "border-primary/50 text-primary bg-primary/5"
              )}
            >
              {filtered.type === "Individual"
                ? <User className="w-3.5 h-3.5" />
                : <Users className="w-3.5 h-3.5" />}
              {filtered.type === "all" || !filtered.type ? "Type" : filtered.type}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuLabel className="text-xs text-muted-foreground">ประเภทงาน</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={filtered.type ?? "all"}
              onValueChange={(v) => handleFiltered("type", v)}
            >
              <DropdownMenuRadioItem value="all" className="text-sm">ทั้งหมด</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Individual" className="text-sm">
                <User className="w-3.5 h-3.5 mr-1" /> Individual
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Group" className="text-sm">
                <Users className="w-3.5 h-3.5 mr-1" /> Group
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Due Date — Calendar Range Popover */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "text-xs gap-1.5 max-w-52",
                activeDateRange?.from &&
                  "border-primary/50 text-primary bg-primary/5"
              )}
            >
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{dueDateLabel}</span>
              {activeDateRange?.from ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); clearDate(); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); clearDate(); } }}
                  className="rounded-full hover:bg-primary/20 p-0.5"
                >
                  <X className="w-3 h-3" />
                </span>
              ) : (
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-auto p-0 shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
              <p className="text-xs font-medium text-foreground">
                เลือกช่วงวันที่ Deadline
              </p>
              {activeDateRange?.from && (
                <button
                  onClick={clearDate}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> ล้าง
                </button>
              )}
            </div>

            {/* Selected range pills */}
            <div className="flex items-center gap-2 px-3 pb-2 text-xs text-muted-foreground">
              <span className={cn(
                "px-2 py-0.5 rounded border",
                activeDateRange?.from
                  ? "border-primary/40 text-primary bg-primary/5"
                  : "border-dashed border-border"
              )}>
                {activeDateRange?.from
                  ? format(activeDateRange.from, "d MMM yyyy", { locale: th })
                  : "วันเริ่มต้น"}
              </span>
              <span>→</span>
              <span className={cn(
                "px-2 py-0.5 rounded border",
                activeDateRange?.to
                  ? "border-primary/40 text-primary bg-primary/5"
                  : "border-dashed border-border"
              )}>
                {activeDateRange?.to
                  ? format(activeDateRange.to, "d MMM yyyy", { locale: th })
                  : "วันสิ้นสุด"}
              </span>
            </div>

            <Calendar
              mode="range"
              selected={activeDateRange}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              locale={th}
              className="rounded-b-md"
            />
          </PopoverContent>
        </Popover>

        {/* Limit */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <LayoutList className="w-3.5 h-3.5" />
              {filtered.limit} / หน้า
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuLabel className="text-xs text-muted-foreground">แสดงต่อหน้า</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={String(filtered.limit)}
              onValueChange={(v) => handleFiltered("limit", Number(v))}
            >
              {LIMIT_OPTIONS.map((n) => (
                <DropdownMenuRadioItem key={n} value={String(n)} className="text-sm">
                  {n} รายการ
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear all */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}