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
import { useUpdateUser } from "@/hooks/use-auth"; 
import Swal from "sweetalert2";
import { IUser } from "@/types/auth"; 

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: IUser | null;
}

const editUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  nickname: z.string().min(1, "Nickname is required"),
});

type EditUserForm = z.infer<typeof editUserSchema>;

export default function EditUserDialog({
  open,
  onClose,
  user,
}: EditUserDialogProps) {
  const { mutateAsync: updateUser, isPending } = useUpdateUser();

  const form = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      nickname: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username ?? "",
        nickname: user.nickname ?? "",
      });
    }
  }, [user, form]);

  const onSubmit = async (data: EditUserForm) => {
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
      await updateUser({
        id: user.id,
        data: { username: data.username, nickname: data.nickname },
      });
      
      // ปิดหน้าต่างหลังจากทำการอัปเดตและดึงข้อมูลใหม่มาลงแคชเรียบร้อยแล้ว
      onClose();
    } catch (error) {
      console.error(error);
      Swal.close();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Editing profile for{" "}
            <span className="font-medium text-foreground">
              {user?.username}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-2"
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

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}