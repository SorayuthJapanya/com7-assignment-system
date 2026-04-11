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
import { Edit, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { useDeleteUser } from "@/hooks/use-auth";
import { useState } from "react";
import EditUserDialog from "@/components/dialog/edit-user";
import { useAuthUser } from "@/contexts/auth-context";

interface UserTableProps {
  data: IUser[] | undefined;
}

export default function UserTable({ data }: UserTableProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<IUser | null>(null);
  const authUser = useAuthUser();

  const { mutateAsync: deleteUser } = useDeleteUser();

  if (!data || data.length === 0) {
    return null;
  }

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
              <TableCell className="font-medium max-w-[150px] truncate">
                {user.username}
              </TableCell>
              <TableCell className="max-w-[150px] truncate">
                {user.nickname}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
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
