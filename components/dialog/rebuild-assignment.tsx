"use client";

import { useRebuildAssignment } from "@/hooks/use-assignment";
import { IAssignment } from "@/types/assignment";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, RefreshCw } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";

const schema = z.object({
  deadline: z.date({ required_error: "Please select a deadline." }),
});

type FormValues = z.infer<typeof schema>;

interface RebuildAssignmentProps {
  assignment: IAssignment | null;
  onClose: () => void;
}

export default function RebuildAssignment({ assignment, onClose }: RebuildAssignmentProps) {
  const { mutateAsync: rebuild, isPending } = useRebuildAssignment();
  const [dateOpen, setDateOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const handleSubmit = async (values: FormValues) => {
    if (!assignment) return;
    Swal.fire({
      title: "Rebuilding Assignment...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    await rebuild({ id: assignment.id, deadline: values.deadline });
    form.reset();
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      onClose();
    }
  };

  if (!assignment) return null;

  return (
    <Dialog open={!!assignment} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Rebuild Assignment
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            {/* Read-only info */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Title</span>
                <span className="font-medium truncate max-w-55">{assignment.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{assignment.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assign To</span>
                <span className="font-medium">{assignment.assignTo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reward</span>
                <span className="font-medium">{assignment.reward} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Deadline</span>
                <span className="font-medium">{format(new Date(assignment.deadline), "dd/MM/yyyy")}</span>
              </div>
            </div>

            {/* New deadline */}
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => {
                const handleDateSelect = (date: Date | undefined) => {
                  if (date) {
                    const newDate =
                      field.value && !isNaN(field.value.getTime())
                        ? new Date(field.value)
                        : new Date();
                    newDate.setFullYear(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate(),
                    );
                    field.onChange(newDate);
                  }
                };

                const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const [hours, minutes] = e.target.value.split(":");
                  const newDate =
                    field.value && !isNaN(field.value.getTime())
                      ? new Date(field.value)
                      : new Date();
                  newDate.setHours(
                    parseInt(hours || "0", 10),
                    parseInt(minutes || "0", 10),
                    0,
                  );
                  field.onChange(newDate);
                };

                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>New Deadline <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              (!field.value || isNaN(field.value.getTime())) &&
                                "text-muted-foreground",
                            )}
                            variant="outline"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value && !isNaN(field.value.getTime()) ? (
                              `${format(field.value, "PPP")} at ${format(field.value, "HH:mm")}`
                            ) : (
                              <span>Pick a date and time</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                          <div className="divide-y overflow-hidden bg-background">
                            <Calendar
                              mode="single"
                              onSelect={handleDateSelect}
                              selected={
                                field.value && !isNaN(field.value.getTime())
                                  ? field.value
                                  : undefined
                              }
                              captionLayout="dropdown"
                              defaultMonth={
                                field.value && !isNaN(field.value.getTime())
                                  ? field.value
                                  : new Date()
                              }
                            />
                            <div className="space-y-2 p-4">
                              <Label htmlFor="time">Time</Label>
                              <Input
                                className="w-full"
                                id="time"
                                onChange={handleTimeChange}
                                type="time"
                                value={
                                  field.value && !isNaN(field.value.getTime())
                                    ? format(field.value, "HH:mm")
                                    : "12:00"
                                }
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormDescription>Select the due date and time</FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                <RefreshCw className="size-4 mr-1.5" />
                {isPending ? "Rebuilding..." : "Rebuild"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
