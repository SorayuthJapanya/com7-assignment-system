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
import { Textarea } from "../ui/textarea";
import { useUpdateAssignment } from "@/hooks/use-assignment";
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (selectedAssignment) {
      setTimeout(() => {
        setTitle(selectedAssignment.title);
        setDescription(selectedAssignment.description);
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
      await updateAssignment({
        id: currentAssignment.id,
        data: {
          title,
          description,
          reward: Number(reward),
          deadline: deadline || new Date(),
        },
      });
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>
            Update the assignment details below.
          </DialogDescription>
        </DialogHeader>
        {selectedAssignment && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="font-semibold">
                Title
              </Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Assignment title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="font-semibold">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Assignment description"
                rows={4}
                className="h-32 w-full max-w-[460px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-reward" className="font-semibold">
                  Reward
                </Label>
                <Input
                  id="edit-reward"
                  type="number"
                  min="0"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder="Reward points"
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <Label className="font-semibold">
                  Deadline
                </Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deadline && "text-muted-foreground",
                      )}
                      variant="outline"
                      id="edit-deadline"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? (
                        `${format(deadline, "PPP")} at ${format(deadline, "HH:mm")}`
                      ) : (
                        <span>Pick a date and time</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
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
                      <div className="space-y-2 p-4">
                        <Label htmlFor="edit-time">Time</Label>
                        <Input
                          className="w-full"
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
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setSelectedAssignment(null)}
            className="cursor-pointer"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="cursor-pointer"
            disabled={isPending}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
