"use client";

import Header from "@/components/header";
import { useState, useEffect } from "react";
import { IAssignment, IFilteredAssignment } from "@/types/assignment";
import {
  useGetAssignments,
  useSubmissionAssignment,
} from "@/hooks/use-assignment";
import AssignmentCard from "@/components/card/assignment-card";
import Pagination from "@/components/pagination";
import Swal from "sweetalert2";
import DetailAssignment from "@/components/dialog/submit-assignment";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
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
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Search,
  Users,
  User,
  ChevronDown,
  CalendarDays,
  LayoutList,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Status tab config ──────────────────────────────────────────────────────────
type StatusValue = IFilteredAssignment["status"];

const STATUS_TABS: {
  label: string;
  value: StatusValue;
  activeClass: string;
  dotClass: string;
}[] = [
  {
    label: "All",
    value: "all",
    activeClass:
      "bg-foreground/10 text-foreground border-foreground/20",
    dotClass: "",
  },
  {
    label: "Pending",
    value: "Pending",
    activeClass:
      "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-700",
    dotClass: "bg-amber-500",
  },
  {
    label: "Approved",
    value: "Approved",
    activeClass:
      "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-700",
    dotClass: "bg-emerald-500",
  },
  {
    label: "Rejected",
    value: "Rejected",
    activeClass:
      "bg-red-100 text-red-600 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-700",
    dotClass: "bg-red-500",
  },
  {
    label: "Not Submitted",
    value: "not-submit",
    activeClass:
      "bg-orange-100 text-orange-600 border-orange-300 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-700",
    dotClass: "bg-orange-500",
  },
];

const LIMIT_OPTIONS = [15, 30, 60];

// ── Page ───────────────────────────────────────────────────────────────────────
export default function MyAssignmentPage() {
  // แก้ไข: เพิ่ม state เพื่อดักจับ Hydration ให้ทำงานเสร็จสมบูรณ์ฝั่ง Client ก่อนเรนเดอร์ Radix UI Element
  const [isMounted, setIsMounted] = useState(false);

  const [filtered, setFiltered] = useState<IFilteredAssignment>({
    search: "",
    type: "all",
    status: "all",
    page: 1,
    limit: 15,
    myAssignments: true,
  });
  const [activeTab, setActiveTab] = useState<StatusValue>("all");

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [selectedAssignment, setSelectedAssignment] =
    useState<IAssignment | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { data: assignmentsData, isLoading } = useGetAssignments(filtered);
  const { mutateAsync: submitAssignment, isPending } = useSubmissionAssignment();

  // แก้ไข: สั่งรันหลังจากคอมโพเนนต์โหลดลงเบราว์เซอร์
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── helpers ──────────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handleOnSubmit = async () => {
    if (!selectedAssignment || !file) return;
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File size too large",
        text: "File size must be less than 2MB",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    Swal.fire({
      title: "Submitting...",
      text: "Please wait while we upload your assignment.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      await submitAssignment({ id: selectedAssignment.id, file });
      setSelectedAssignment(null);
      setFile(null);
      setPreview(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleFiltered = (
    key: keyof IFilteredAssignment,
    value: string | number | boolean
  ) => {
    if (key === "page") {
      setFiltered((prev) => ({ ...prev, page: value as number }));
    } else {
      setFiltered((prev) => ({ ...prev, [key]: value, page: 1 }));
    }
  };

  const handleTabChange = (tab: StatusValue) => {
    setActiveTab(tab);
    setFiltered((prev) => ({ ...prev, status: tab, page: 1 }));
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      setFiltered((prev) => ({
        ...prev,
        deadlineFrom: format(range.from!, "yyyy-MM-dd"),
        deadlineTo: range.to ? format(range.to, "yyyy-MM-dd") : undefined,
        page: 1,
      }));
    } else {
      setFiltered((prev) => ({
        ...prev,
        deadlineFrom: undefined,
        deadlineTo: undefined,
        page: 1,
      }));
    }
    if (range?.from && range?.to) {
      setCalendarOpen(false);
    }
  };

  const clearDateRange = () => {
    setDateRange(undefined);
    setFiltered((prev) => ({
      ...prev,
      deadlineFrom: undefined,
      deadlineTo: undefined,
      page: 1,
    }));
  };

  const handleClear = () => {
    setActiveTab("all");
    setDateRange(undefined);
    setFiltered({
      search: "",
      type: "all",
      status: "all",
      page: 1,
      limit: filtered.limit,
      myAssignments: true,
    });
  };

  // ── derived display values ───────────────────────────────────────────────────
  const hasActiveFilters =
    !!filtered.search ||
    (filtered.type && filtered.type !== "all") ||
    !!dateRange?.from;

  const dueDateLabel = (() => {
    if (!dateRange?.from) return "Due date";
    if (!dateRange.to)
      return format(dateRange.from, "d MMM yy", { locale: th });
    return `${format(dateRange.from, "d MMM", { locale: th })} – ${format(
      dateRange.to,
      "d MMM yy",
      { locale: th }
    )}`;
  })();

  const total = assignmentsData?.pagination?.total ?? 0;

  return (
    <div className="w-full max-w-7xl xl:max-w-360 mx-auto space-y-6">

      {/* ── Row 1: Header + Search ──────────────────────────────────────────── */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Header
          title="My Assignment"
          subTitle="Your assignment management hub"
        />

        <InputGroup className="w-full sm:w-80">
          <InputGroupInput
            placeholder="ค้นหาชื่องาน หรือชื่อผู้รับ"
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
      </div>

      {/* ── Row 2: Status tabs + filter controls ────────────────────────────── */}
      <div className="w-full flex flex-wrap items-center gap-1.5 min-h-[36px]">
        {/* แก้ไข: ใช้ isMounted ครอบคอมโพเนนต์ Radix UI ทั้งหมดเพื่อเลี่ยง Hydration Error */}
        {isMounted ? (
          <>
            {/* Status tabs */}
            {STATUS_TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all whitespace-nowrap",
                    isActive
                      ? tab.activeClass
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {tab.dotClass && (
                    <span className={cn("size-1.5 rounded-full", tab.dotClass)} />
                  )}
                  {tab.label}
                </button>
              );
            })}

            {/* Divider */}
            <div className="h-5 w-px bg-border mx-1" />

            {/* Type */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs gap-1.5 h-7",
                    filtered.type &&
                      filtered.type !== "all" &&
                      "border-primary/50 text-primary bg-primary/5"
                  )}
                >
                  {filtered.type === "Individual" ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    <Users className="w-3.5 h-3.5" />
                  )}
                  {filtered.type === "all" || !filtered.type
                    ? "Type"
                    : filtered.type}
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  ประเภทงาน
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={filtered.type ?? "all"}
                  onValueChange={(v) => handleFiltered("type", v)}
                >
                  <DropdownMenuRadioItem value="all" className="text-sm">
                    ทั้งหมด
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Individual" className="text-sm">
                    <User className="w-3.5 h-3.5 mr-1" /> Individual
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Group" className="text-sm">
                    <Users className="w-3.5 h-3.5 mr-1" /> Group
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Due Date — Calendar Popover */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs gap-1.5 h-7 max-w-48",
                    dateRange?.from &&
                      "border-primary/50 text-primary bg-primary/5"
                  )}
                >
                  <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{dueDateLabel}</span>
                  {dateRange?.from ? (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearDateRange();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          clearDateRange();
                        }
                      }}
                      className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  ) : (
                    <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
                  )}
                </Button>
              </PopoverTrigger>

              <PopoverContent align="start" className="w-auto p-0 shadow-md">
                <div className="flex items-center justify-between px-3 pt-3 pb-1">
                  <p className="text-xs font-medium text-foreground">
                    เลือกช่วงวันที่ Deadline
                  </p>
                  {dateRange?.from && (
                    <button
                      onClick={clearDateRange}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> ล้าง
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 px-3 pb-2 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded border",
                      dateRange?.from
                        ? "border-primary/40 text-primary bg-primary/5"
                        : "border-dashed border-border"
                    )}
                  >
                    {dateRange?.from
                      ? format(dateRange.from, "d MMM yyyy", { locale: th })
                      : "วันเริ่มต้น"}
                  </span>
                  <span>→</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded border",
                      dateRange?.to
                        ? "border-primary/40 text-primary bg-primary/5"
                        : "border-dashed border-border"
                    )}
                  >
                    {dateRange?.to
                      ? format(dateRange.to, "d MMM yyyy", { locale: th })
                      : "วันสิ้นสุด"}
                  </span>
                </div>

                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={2}
                  locale={th}
                  className="rounded-b-md"
                />
              </PopoverContent>
            </Popover>

            {/* Limit */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-7">
                  <LayoutList className="w-3.5 h-3.5" />
                  {filtered.limit} / หน้า
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-32">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  แสดงต่อหน้า
                </DropdownMenuLabel>
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

            {/* Clear all filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-xs gap-1 h-7 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </>
        ) : (
          // แถบโหลดนิ่งสั้น ๆ ระหว่างที่กำลัง SSR บนเซิร์ฟเวอร์
          <div className="h-7 w-48 bg-muted animate-pulse rounded-lg" />
        )}
      </div>

      {/* ── Assignment List ────────────────────────────────────────────────── */}
      <div className="w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Loading...
          </div>
        ) : (
          <>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignmentsData?.assignments?.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No assignments found
                </p>
              ) : (
                assignmentsData?.assignments?.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onSelected={setSelectedAssignment}
                    studentMode
                  />
                ))
              )}
            </div>
            {assignmentsData?.pagination &&
              assignmentsData.pagination.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    pagination={assignmentsData.pagination}
                    onPageChange={(page) => handleFiltered("page", page)}
                  />
                </div>
              )}
          </>
        )}
      </div>

      {/* ── Submit dialog ──────────────────────────────────────────────────── */}
      <DetailAssignment
        selectedAssignment={selectedAssignment}
        setSelectedAssignment={setSelectedAssignment}
        file={file}
        setFile={setFile}
        preview={preview}
        setPreview={setPreview}
        isPending={isPending}
        handleOnSubmit={handleOnSubmit}
        handleFileChange={handleFileChange}
      />
    </div>
  );
}