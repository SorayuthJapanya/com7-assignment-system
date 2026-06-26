"use client";

import React, { useState, useEffect } from "react";
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
import { useUpdateAssignment } from "@/hooks/use-assignment";
import { useAuthUser } from "@/hooks/use-current-user";
import { useLocalPresets } from "@/hooks/use-local-presets";
import { ComboboxInput } from "@/components/ui/combobox-input";
import Swal from "sweetalert2";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";

interface EditAssignmentProps {
  selectedAssignment: IAssignment | null;
  setSelectedAssignment: React.Dispatch<
    React.SetStateAction<IAssignment | null>
  >;
}

export default function EditAssignment({
  selectedAssignment,
  setSelectedAssignment,
}: EditAssignmentProps) {
  const { mutateAsync: updateAssignment, isPending } = useUpdateAssignment();

  const authUser = useAuthUser();

  const titlePresets = useLocalPresets("title", authUser?.id);
  const descriptionPresets = useLocalPresets("description", authUser?.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (selectedAssignment) {
      setTimeout(() => {
        setTitle(selectedAssignment.title);
        setDescription(selectedAssignment.description || "");
        setReward(selectedAssignment.reward.toString());
        setDeadline(new Date(selectedAssignment.deadline));
      }, 0);
    }
  }, [selectedAssignment]);

  const handleSubmit = async () => {
    const currentAssignment = selectedAssignment;
    if (!currentAssignment) return;

    setSelectedAssignment(null);

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You are about to update this assignment.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, update it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: "Updating...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        await updateAssignment({
          id: currentAssignment.id,
          data: {
            title,
            description,
            reward: Number(reward),
            deadline: deadline || new Date(),
          },
        });

        Swal.fire({
          title: "Success!",
          text: "Assignment updated successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        setSelectedAssignment(currentAssignment);
        Swal.fire("Error", "Failed to update assignment.", "error");
      }
    } else {
      setSelectedAssignment(currentAssignment);
    }
  };

  return (
    <Dialog
      open={!!selectedAssignment}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedAssignment(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-xl rounded-2xl p-6 gap-5 max-h-[95vh] overflow-y-auto border border-gray-100 shadow-xl">
        <DialogHeader className="space-y-0.5">
          <DialogTitle className="text-xl font-bold text-gray-900">Edit Assignment</DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            Update the assignment details below.
          </DialogDescription>
        </DialogHeader>
        
        {selectedAssignment && (
          <div className="space-y-4 py-1">
            {/* 1. ส่วนของ Title - เปลี่ยนขอบกล่องให้เป็นสีเขียวมะนาวโค้งมนตามรูปภาพ */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-title" className="text-sm font-semibold text-gray-800">
                Title
              </Label>
              <div className="[&>button]:border-[#b4e144] [&>button]:ring-1 [&>button]:ring-[#b4e144] [&>button]:rounded-xl [&>button]:h-12 [&>button]:px-4">
                <ComboboxInput
                  value={title}
                  onChange={setTitle}
                  placeholder="Assignment title"
                  presets={titlePresets.presets}
                  onAddPreset={titlePresets.addPreset}
                  onUpdatePreset={titlePresets.updatePreset}
                  onRemovePreset={titlePresets.removePreset}
                />
              </div>
            </div>

            {/* 2. ส่วนของ Description */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-sm font-semibold text-gray-800">
                Description
              </Label>
              <div className="[&>textarea]:rounded-xl [&>button]:rounded-xl">
                <ComboboxInput
                  value={description}
                  onChange={setDescription}
                  placeholder="Assignment description"
                  presets={descriptionPresets.presets}
                  onAddPreset={descriptionPresets.addPreset}
                  onUpdatePreset={descriptionPresets.updatePreset}
                  onRemovePreset={descriptionPresets.removePreset}
                  multiline
                />
              </div>
            </div>

            {/* 3. ส่วน Grid ของ Reward และ Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reward Input */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-reward" className="text-sm font-semibold text-gray-800">
                  Reward
                </Label>
                <Input
                  id="edit-reward"
                  type="number"
                  min="0"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder="Reward points"
                  className="h-12 rounded-xl bg-white border-gray-200 focus-visible:ring-1 focus-visible:ring-gray-400 focus-visible:border-gray-400 transition-all px-4"
                />
              </div>

              {/* Deadline Date Picker */}
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-sm font-semibold text-gray-800">
                  Deadline
                </Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal rounded-xl bg-white border-gray-200 hover:bg-gray-50/50 px-4",
                        !deadline && "text-muted-foreground",
                      )}
                      variant="outline"
                      id="edit-deadline"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                      {deadline ? (
                        format(deadline, "MMMM do, yyyy 'at' HH:mm")
                      ) : (
                        <span>Pick a date and time</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto p-0 rounded-xl shadow-lg border border-gray-100">
                    <div className="divide-y overflow-hidden bg-background">
                      <Calendar
                        mode="single"
                        onSelect={(date) => {
                          if (date) {
                            const newDate = deadline ? new Date(deadline) : new Date();
                            newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                            setDeadline(newDate);
                          }
                        }}
                        selected={deadline}
                        captionLayout="dropdown"
                        defaultMonth={deadline || new Date()}
                      />
                      <div className="space-y-1.5 p-4 bg-gray-50/30">
                        <Label htmlFor="edit-time" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</Label>
                        <Input
                          className="w-full h-10 rounded-lg border-gray-200 bg-white"
                          id="edit-time"
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(":");
                            const newDate = deadline ? new Date(deadline) : new Date();
                            newDate.setHours(parseInt(hours || "0", 10), parseInt(minutes || "0", 10), 0);
                            setDeadline(newDate);
                          }}
                          type="time"
                          value={deadline ? format(deadline, "HH:mm") : "12:00"}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}
        
        {/* 4. Footer Section - ปุ่มสีเขียวต้นหญ้าตามรูปภาพจริง */}
        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3 border-t border-gray-50 max-sm:space-x-0">
          <Button
            variant="outline"
            onClick={() => setSelectedAssignment(null)}
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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}