"use client";

import React, { useState } from "react";
import { useAuthUser } from "@/hooks/use-current-user";
import { useLocalPresets } from "@/hooks/use-local-presets";
import { ComboboxInput } from "@/components/ui/combobox-input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, X, CalendarIcon } from "lucide-react";

import {
  assignmentSchema,
  type AssignmentFormValues,
} from "@/schemas/assignment-schema";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Swal from "sweetalert2";
import { useCreateAssignment } from "@/hooks/use-assignment";
import { useRouter } from "next/navigation";

interface AddAssignmentFormProps {
  allUsernames: string[];
}

export default function AddAssignmentForm({
  allUsernames,
}: AddAssignmentFormProps) {
  const [open, setOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const authUser = useAuthUser();
  const titlePresets = useLocalPresets("title", authUser?.id);
  const descriptionPresets = useLocalPresets("description", authUser?.id);
  const router = useRouter();

  const { mutateAsync: createAssignment } = useCreateAssignment();

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema as any),
    defaultValues: {
      title: "",
      description: "",
      type: "Individual",
      assignTo: [],
      reward: 0,
      deadline: undefined as unknown as Date,
    },
  });

  const onSubmit = async (data: AssignmentFormValues) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Create new assignment?",
      text: "Once created, you cannot undo this action.",
      showCancelButton: true,
      confirmButtonText: "Yes, create it!",
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: "Adding...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      await createAssignment(data);
      router.push("/assignment/manage");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title input + dropdown */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <ComboboxInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter assignment title"
                  presets={titlePresets.presets}
                  onAddPreset={titlePresets.addPreset}
                  onUpdatePreset={titlePresets.updatePreset}
                  onRemovePreset={titlePresets.removePreset}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description input + dropdown */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <ComboboxInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Describe the assignment details..."
                  presets={descriptionPresets.presets}
                  onAddPreset={descriptionPresets.addPreset}
                  onUpdatePreset={descriptionPresets.updatePreset}
                  onRemovePreset={descriptionPresets.removePreset}
                  multiline
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Type dropdown */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Group">Group</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Reward input */}
          <FormField
            control={form.control}
            name="reward"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reward (Points/Coins)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Deadline date and time */}
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

              const handleTimeChange = (
                e: React.ChangeEvent<HTMLInputElement>,
              ) => {
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
                  <FormLabel>Deadline</FormLabel>
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
                            `${format(field.value, "PPP")} at ${format(
                              field.value,
                              "HH:mm",
                            )}`
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
                  <FormDescription>
                    Select the due date and time
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* Assign To multi-select */}
          <FormField
            control={form.control}
            name="assignTo"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Assign To</FormLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild className="hover:bg-accent/5">
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between font-normal h-auto min-h-9 px-3 py-2 mt-0"
                      >
                        {field.value?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {field.value.map((val) => {
                              const selectedUser = allUsernames.find(
                                (u) => u === val,
                              );
                              return (
                                <div
                                  key={val}
                                  className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-sm text-xs font-medium border-[0.5px] border-primary/50"
                                >
                                  {selectedUser || val}
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    className="rounded-full p-0.5 cursor-pointer ml-1"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        field.onChange(
                                          field.value.filter((v) => v !== val),
                                        );
                                      }
                                    }}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      field.onChange(
                                        field.value.filter((v) => v !== val),
                                      );
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Select assignees...
                          </span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Search users/groups..." />
                      <CommandEmpty>No assignees found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {allUsernames.map((user) => (
                            <CommandItem
                              key={user}
                              value={user}
                              onSelect={() => {
                                const isSelected = field.value?.includes(user);
                                if (isSelected) {
                                  field.onChange(
                                    field.value.filter((val) => val !== user),
                                  );
                                } else {
                                  field.onChange([
                                    ...(field.value || []),
                                    user,
                                  ]);
                                }
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value?.includes(user)
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {user}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full sm:w-auto cursor-pointer">
          Create Assignment
        </Button>
      </form>
    </Form>
  );
}
