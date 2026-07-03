"use client";

import { IUser } from "@/types/auth";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, RotateCcw, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { useDeleteUser, useGetUsers } from "@/hooks/use-auth"; // 💡 นำเข้า useGetUsers เข้ามา
import { useResetUserScore } from "@/hooks/use-score";
import { useState } from "react";
import EditUserDialog from "@/components/dialog/edit-user";
import { useAuthUser } from "@/contexts/auth-context";

// 💡 ปรับให้รับ search พ่วงเข้ามาด้วย (ถ้าหน้าหลักมีการค้นหา)
interface UserTableProps {
  search?: string; 
}

export default function UserTable({ search = "" }: UserTableProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<IUser | null>(null);
  const authUser = useAuthUser();

  // 💡 ดึงข้อมูลผู้ใช้ผ่าน Hook ตรงนี้แทน เพื่อให้ผูกกับระบบ Cache ของ React Query
  const { data: queryData, isLoading } = useGetUsers({ search });
  const data = queryData?.data; // เจาะจงเข้าถึง array ของ user ด้านใน

  const { mutateAsync: deleteUser } = useDeleteUser();
  const { mutateAsync: resetScore } = useResetUserScore();

  if (isLoading) {
    return <div className="text-center p-4 text-sm text-muted-foreground">Loading users...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center p-4 text-sm text-muted-foreground">No users found.</div>;
  }

  const handleResetScore = async (id: string, username: string) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Reset Score?",
      text: `Do you want to reset score for "${username}"? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: "Yes, reset it!",
      confirmButtonColor: "#f97316",
    });
    if (result.isConfirmed) {
      Swal.fire({
        title: "Resetting...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      await resetScore({ userId: id });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      Swal.fire({
        title: "Deleting...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      await deleteUser({ id });
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] text-center">No.</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Nickname</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead className="text-center">Created At</TableHead>
            <TableHead className="text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((user, index) => {
            const isOwn = authUser?.id === user.id;
            return (
              <TableRow key={user.id}>
                <TableCell className="text-center font-medium">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium max-w-36 truncate">
                  {user.username}
                </TableCell>
                <TableCell className="max-w-36 truncate">
                  {user.nickname}
                </TableCell>
                <TableCell className="max-w-50 truncate">
                  {user.email}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                      user.role === "SUPER_ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : user.role === "ADMIN"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="text-center font-medium tabular-nums">
                  {user.totalScore ?? 0}
                </TableCell>
                <TableCell className="text-center">
                  {user.createdAt
                    ? format(new Date(user.createdAt), "dd/MM/yyyy HH:mm:ss")
                    : "-"}
                </TableCell>
                <TableCell
                  className="text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => setIsEditDialogOpen(user)}
                      disabled={isOwn}
                      title={isOwn ? "Cannot edit your own account" : undefined}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="default"
                      size="icon"
                      disabled={isOwn}
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => handleResetScore(user.id, user.username)}
                      title="Reset score"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => handleDelete(user.id)}
                      disabled={isOwn}
                      title={isOwn ? "Cannot delete your own account" : undefined}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <EditUserDialog
        open={!!isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(null)}
        user={isEditDialogOpen}
      />
    </div>
  );
}