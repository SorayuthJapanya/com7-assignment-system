"use client";

import { IAssignment } from "@/types/assignment";
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
import { Edit, Trash2, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";
import { useDeleteAssignment } from "@/hooks/use-assignment";
import { useState } from "react";
import ManageAssignment from "@/components/dialog/manage-assignment";
import EditAssignment from "./dialog/edit-assignment";
import { useRouter } from "next/navigation";

interface AssignmentTableProps {
  assignments: IAssignment[];
}

export default function AssignmentTable({ assignments }: AssignmentTableProps) {
  const { mutateAsync: deleteAssignment } = useDeleteAssignment();
  const router = useRouter();
  const [selectedAssignment, setSelectedAssignment] =
    useState<IAssignment | null>(null);
  const [editAssignment, setEditAssignment] = useState<IAssignment | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Submit":
        return "bg-orange-100 text-orange-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Approved":
        return "bg-primary/10 text-primary";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleEdit = (assignment: IAssignment) => {
    setSelectedAssignment(null);
    setEditAssignment(assignment);
  };

  const handleRebuild = (assignment: IAssignment) => {
    const params = new URLSearchParams({
      title: assignment.title,
      description: assignment.description,
      type: assignment.type,
      assignTo: assignment.members.join(","),
      reward: String(assignment.reward),
    });
    router.push(`/assignment/add?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    setSelectedAssignment(null);
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
      await deleteAssignment({ id });
    }
  };

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12.5 text-center">No.</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">
                Description
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Assign To</TableHead>
              <TableHead className="text-center">Deadline</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment, index) => {
              const resultStatus =
                assignment.submissionUrl === ""
                  ? "Not Submit"
                  : assignment.status;
              return (
                <TableRow
                  key={assignment.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  <TableCell className="text-center font-medium">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium max-w-[160px] truncate">
                    {assignment.title}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                    {assignment.description}
                  </TableCell>
                  <TableCell>{assignment.type}</TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {assignment.createdBy}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {assignment.assignTo}
                  </TableCell>
                  <TableCell className="text-center">
                    {format(new Date(assignment.deadline), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`${getStatusColor(
                        resultStatus,
                      )} px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap`}
                    >
                      {resultStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div
                      className="flex justify-center items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(assignment)}
                        className="h-8 w-8 cursor-pointer"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="icon"
                        onClick={() => handleRebuild(assignment)}
                        className="h-8 w-8 cursor-pointer"
                        title="Rebuild"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(assignment.id)}
                        className="h-8 w-8 cursor-pointer"
                        title="Delete"
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
      </div>

      <ManageAssignment
        selectedAssignment={selectedAssignment}
        setSelectedAssignment={setSelectedAssignment}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />

      <EditAssignment
        selectedAssignment={editAssignment}
        setSelectedAssignment={setEditAssignment}
      />
    </>
  );
}
