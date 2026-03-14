"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, X } from "lucide-react";

import {
  assignmentSchema,
  type AssignmentFormValues,
} from "@/schemas/assignment-schems";
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
import { Textarea } from "@/components/ui/textarea";
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

// Mock data for assignees - replace with actual API data fetching
const MOCK_USERS = [
  { label: "Student 1", value: "student_1" },
  { label: "Student 2", value: "student_2" },
  { label: "Student 3", value: "student_3" },
  { label: "Group A", value: "group_a" },
  { label: "Group B", value: "group_b" },
];

export default function AddAssignmentForm() {
  const [open, setOpen] = useState(false);

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "Individual",
      assignTo: [],
      reward: 0,
      deadline: undefined as unknown as Date,
    },
  });

  function onSubmit(data: AssignmentFormValues) {
    console.log("Form submitted:", data);
    // TODO: Handle submission (e.g., API call)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title input */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter assignment title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description text-area */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the assignment details..."
                  className="min-h-[120px]"
                  {...field}
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
                  <div className="relative">
                    <select
                      className={cn(
                        "flex h-9 w-full appearance-none items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                      {...field}
                    >
                      <option value="Individual">Individual</option>
                      <option value="Group">Group</option>
                    </select>
                    <ChevronsUpDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
                  </div>
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
              const dateValue =
                field.value && !isNaN(field.value.getTime())
                  ? new Date(
                      field.value.getTime() -
                        field.value.getTimezoneOffset() * 60000,
                    )
                      .toISOString()
                      .slice(0, 16)
                  : "";

              return (
                <FormItem className="flex flex-col">
                  <FormLabel>Deadline</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      className="w-full"
                      value={dateValue}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
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
                  <PopoverTrigger asChild>
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
                              const selectedUser = MOCK_USERS.find(
                                (u) => u.value === val,
                              );
                              return (
                                <div
                                  key={val}
                                  className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-0.5 rounded-sm text-xs"
                                >
                                  {selectedUser?.label || val}
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    className="hover:bg-muted rounded-full p-0.5 cursor-pointer ml-1"
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
                          {MOCK_USERS.map((user) => (
                            <CommandItem
                              key={user.value}
                              value={user.label}
                              onSelect={() => {
                                const isSelected = field.value?.includes(
                                  user.value,
                                );
                                if (isSelected) {
                                  field.onChange(
                                    field.value.filter(
                                      (val) => val !== user.value,
                                    ),
                                  );
                                } else {
                                  field.onChange([
                                    ...(field.value || []),
                                    user.value,
                                  ]);
                                }
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value?.includes(user.value)
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {user.label}
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

        <Button type="submit" className="w-full sm:w-auto">
          Create Assignment
        </Button>
      </form>
    </Form>
  );
}
