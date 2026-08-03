"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateUser } from "@/hooks/use-auth";
import { IUser } from "@/types/auth";
import Swal from "sweetalert2";

const ROLE_OPTIONS = ["STAFF", "ADMIN", "SUPER_ADMIN", "INTERN"] as const;

const editUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  nickname: z.string().min(1, "Nickname is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(ROLE_OPTIONS),
  score: z.union([z.number(), z.nan()]).optional(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: (IUser & { score?: number; totalScore?: number }) | null;
}

export default function EditUserDialog({
  open,
  onClose,
  user,
}: EditUserDialogProps) {
  const { mutateAsync: updateUser, isPending } = useUpdateUser();

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      nickname: "",
      email: "",
      role: "STAFF",
      score: 0,
    },
  });

  // 💡 เมื่อเปิด Dialog ดึงคะแนนปัจจุบัน (totalScore หรือ score) เข้าฟอร์มทันที
  useEffect(() => {
    if (user) {
      const currentScore = user.totalScore ?? user.score ?? 0;
      form.reset({
        username: user.username ?? "",
        nickname: user.nickname ?? "",
        email: user.email ?? "",
        role: (user.role as EditUserFormValues["role"]) ?? "STAFF",
        score: currentScore,
      });
    }
  }, [user, form]);

  const onSubmit = async (data: EditUserFormValues) => {
    if (!user) return;

    Swal.fire({
      title: "Updating...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // 1. อัปเดตข้อมูลผู้ใช้หลัก (Logic เดิม)
      await updateUser({
        id: user.id,
        data: {
          username: data.username,
          nickname: data.nickname,
          email: data.email,
          role: data.role,
        },
      });

      // 2. คำนวณส่วนต่างคะแนน (คะแนนใหม่ - คะแนนเดิม)
      const currentScore = user.totalScore ?? user.score ?? 0;
      const newScore = data.score ?? 0;
      const diffScore = newScore - currentScore;

      if (!isNaN(diffScore) && diffScore !== 0) {
        const adjustRes = await fetch("/api/auth/adjust-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUserId: user.id,
            points: diffScore,
            reason: "Admin Score Adjustment",
          }),
        });

        if (!adjustRes.ok) {
          const errData = await adjustRes.json();
          throw new Error(errData.error || "Failed to adjust score");
        }
      }

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "User details updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      onClose();
      window.location.reload();
    } catch (error: any) {
      console.error("Update error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Something went wrong",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details and role.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter nickname" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 🟢 แสดงค่าคะแนนปัจจุบันและรองรับการพิมพ์แก้ไข */}
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Score</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter score"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : e.target.valueAsNumber
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}