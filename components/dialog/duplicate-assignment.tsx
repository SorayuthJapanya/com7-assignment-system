"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { IAssignment } from "@/types/assignment";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Calendar } from "../ui/calendar";
import { CalendarIcon, Check, ChevronsUpDown, HelpCircle, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { useCreateAssignment } from "@/hooks/use-assignment";
import { useGetUsers } from "@/hooks/use-auth";
import { IUser } from "@/types/auth";
import Swal from "sweetalert2";

interface DuplicateAssignmentProps {
  selectedAssignment: IAssignment | null;
  setSelectedAssignment: React.Dispatch<
    React.SetStateAction<IAssignment | null>
  >;
}

export default function DuplicateAssignment({
  selectedAssignment,
  setSelectedAssignment,
}: DuplicateAssignmentProps) {
  const { mutateAsync: createAssignment, isPending } = useCreateAssignment();
  // includeHidden: false → ให้ backend กรองคนที่ถูกซ่อนออกให้ตั้งแต่ query
  // (กันซ้ำอีกชั้นด้วย .isHidden ด้านล่าง เผื่อ backend ยังไม่กรองให้)
  const { data: queryData } = useGetUsers({ search: "", includeHidden: false });
  const allUsers: IUser[] = queryData?.data ?? [];

  // เฉพาะ dropdown "Assign To" ของหน้า Duplicate เท่านั้น: ไม่แสดง SUPER_ADMIN,
  // INTERN, และคนที่ถูกซ่อน (isHidden) — ไม่กระทบ query/list ที่อื่นในระบบ
  const users: IUser[] = allUsers.filter(
    (u) => u.role !== "SUPER_ADMIN" && u.role !== "INTERN" && !u.isHidden
  );



  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"Individual" | "Group">("Individual");
  const [reward, setReward] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [dateOpen, setDateOpen] = useState(false);

  const [assignTo, setAssignTo] = useState<string[]>([]); // เก็บเป็น username
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false); // custom confirm popup แทน Swal/window.confirm

  // Pre-fill จาก assignment ต้นฉบับทุกครั้งที่เปิด dialog
  useEffect(() => {
    if (selectedAssignment) {
      setTitle(selectedAssignment.title);
      setDescription(selectedAssignment.description || "");
      setType(selectedAssignment.type);
      setReward(selectedAssignment.reward?.toString() ?? "0");
      setDeadline(
        selectedAssignment.deadline
          ? new Date(selectedAssignment.deadline)
          : undefined
      );
      // เดิม assign ให้ใครไว้ ให้ pre-select ไว้ก่อน (แก้ไขต่อได้)
      setAssignTo(
        selectedAssignment.username ? [selectedAssignment.username] : []
      );
    }
  }, [selectedAssignment]);

  const toggleUser = (username: string) => {
    setAssignTo((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  };

  const removeUser = (username: string) => {
    setAssignTo((prev) => prev.filter((u) => u !== username));
  };

  const handleClose = () => setSelectedAssignment(null);

  const handleSubmit = () => {
    if (!title.trim()) {
      Swal.fire({
        icon: "warning",
        title: "กรอกชื่องานก่อนนะ",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }
    if (assignTo.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "เลือกผู้รับมอบหมายอย่างน้อย 1 คน",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }
    if (!deadline) {
      Swal.fire({
        icon: "warning",
        title: "เลือก Deadline ก่อนนะ",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    // เปิด popup ยืนยันที่สร้างเองด้วย React (แทน Swal/window.confirm) เพราะ
    // dialog นี้อยู่ใน Radix Dialog (shadcn) — Radix focus-trap จะดักจับ
    // pointer event ทำให้ปุ่มของ Swal ที่ลอยซ้อนด้านบนกดไม่ติด ส่วน popup ที่
    // render อยู่ใน React tree เดียวกันแบบนี้ ไม่มีปัญหานั้นเลย
    setConfirmOpen(true);
  };

  const handleConfirmedSubmit = async () => {
    setConfirmOpen(false);

    Swal.fire({
      title: "Creating...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await createAssignment({
        title,
        description,
        type,
        assignTo,
        reward: Number(reward),
        deadline: deadline as Date,
      });

      Swal.fire({
        icon: "success",
        title: "Duplicate สำเร็จ",
        timer: 1200,
        showConfirmButton: false,
      });
      setSelectedAssignment(null);
    } catch {
      Swal.fire("Error", "ไม่สามารถสร้างงานได้", "error");
    }
  };

  return (
    <Dialog open={!!selectedAssignment} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-xl rounded-2xl p-6 gap-5 max-h-[95vh] overflow-y-auto border border-gray-100 shadow-xl">
        <DialogHeader className="space-y-0.5">
          <DialogTitle className="text-xl font-bold text-gray-900">
            Duplicate Assignment
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            แก้ไขรายละเอียดและเลือกผู้รับมอบหมายก่อนสร้างงานใหม่
          </DialogDescription>
        </DialogHeader>

        {selectedAssignment && (
          <div className="space-y-4 py-1">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="dup-title" className="text-sm font-semibold text-gray-800">
                Title
              </Label>
              <Input
                id="dup-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Assignment title"
                className="h-12 rounded-xl bg-white border-gray-200 px-4"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="dup-description" className="text-sm font-semibold text-gray-800">
                Description
              </Label>
              <Textarea
                id="dup-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Assignment description"
                className="rounded-xl bg-white border-gray-200 min-h-24 px-4 py-3"
              />
            </div>

            {/* Type + Reward */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-800">Type</Label>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden h-12">
                  {(["Individual", "Group"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        "flex-1 text-sm font-medium transition-colors",
                        type === t
                          ? "bg-[#70ad47] text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dup-reward" className="text-sm font-semibold text-gray-800">
                  Reward
                </Label>
                <Input
                  id="dup-reward"
                  type="number"
                  min="0"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder="Reward points"
                  className="h-12 rounded-xl bg-white border-gray-200 px-4"
                />
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-1.5 flex flex-col">
              <Label className="text-sm font-semibold text-gray-800">Deadline</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal rounded-xl bg-white border-gray-200 px-4",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    {deadline ? (
                      format(deadline, "MMMM do, yyyy 'at' HH:mm")
                    ) : (
                      <span>Pick a date and time</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0 rounded-xl shadow-lg border border-gray-100">
                  <div className="divide-y overflow-hidden bg-background">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={(date) => {
                        if (date) {
                          const newDate = deadline ? new Date(deadline) : new Date();
                          newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                          setDeadline(newDate);
                        }
                      }}
                      captionLayout="dropdown"
                      defaultMonth={deadline || new Date()}
                    />
                    <div className="space-y-1.5 p-4 bg-gray-50/30">
                      <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Time
                      </Label>
                      <Input
                        type="time"
                        className="w-full h-10 rounded-lg border-gray-200 bg-white"
                        value={deadline ? format(deadline, "HH:mm") : "12:00"}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(":");
                          const newDate = deadline ? new Date(deadline) : new Date();
                          newDate.setHours(parseInt(hours || "0", 10), parseInt(minutes || "0", 10), 0);
                          setDeadline(newDate);
                        }}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Assign To (multi-select) */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-800">
                Assign To
              </Label>
              <Popover open={userPickerOpen} onOpenChange={setUserPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-auto min-h-12 justify-between rounded-xl bg-white border-gray-200 px-4 py-2 font-normal"
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {assignTo.length === 0 ? (
                        <span className="text-muted-foreground">
                          เลือกผู้รับมอบหมาย
                        </span>
                      ) : (
                        assignTo.map((u) => (
                          <Badge
                            key={u}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            {u}
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeUser(u);
                              }}
                              className="rounded-full hover:bg-gray-300/50 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </span>
                          </Badge>
                        ))
                      )}
                    </div>
                    <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="ค้นหา username..." />
                    <CommandList>
                      <CommandEmpty>ไม่พบผู้ใช้</CommandEmpty>
                      <CommandGroup>
                        {users.map((u) => {
                          const isSelected = assignTo.includes(u.username);
                          return (
                            <CommandItem
                              key={u.id}
                              value={u.username}
                              onSelect={() => toggleUser(u.username)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {u.username}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3 border-t border-gray-50 max-sm:space-x-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="px-5 h-11 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 rounded-lg"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="px-5 h-11 bg-[#70ad47] hover:bg-[#62983e] text-white font-semibold rounded-lg transition-colors shadow-sm"
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>

        {/* Custom confirm popup — แทน Swal/window.confirm เพื่อไม่ให้ชนกับ
            Radix Dialog focus-trap แต่ยังคงหน้าตาสวยงามเหมือนเดิม */}
        {confirmOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
            onClick={() => setConfirmOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#8b7fd6]">
                <HelpCircle className="h-7 w-7 text-[#8b7fd6]" strokeWidth={2} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                ยืนยันการ Duplicate?
              </h3>
              <p className="mb-6 text-sm text-gray-500">
                จะสร้างงานใหม่ &quot;{title}&quot; และมอบหมายให้ {assignTo.length} คน
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={handleConfirmedSubmit}
                  className="px-6 h-11 bg-[#8b7fd6] hover:bg-[#7a6dc9] text-white font-semibold rounded-lg"
                >
                  สร้างเลย
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen(false)}
                  className="px-6 h-11 border-gray-200 text-gray-600 font-medium rounded-lg"
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}