"use client";

import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { IFilteredAssignment } from "@/types/assignment";
import { useGetAssignments } from "@/hooks/use-assignment";
import AssignmentFilter from "@/components/table/assignment-filter";
import Pagination from "@/components/pagination";
import AssignmentTable from "@/components/assignment-table";
import Link from "next/link";

export default function ManageAssignmentPage() {
  const [filtered, setFiltered] = useState<IFilteredAssignment>({
    search: "",
    type: "all",
    status: "all",
    page: 1,
    limit: 15,
    myAssignments: false,
  });

  const { data: assignmentsData, isLoading } = useGetAssignments(filtered);

  const handleFiltered = (
    key: keyof IFilteredAssignment,
    value: string | number | boolean,
  ) => {
    setFiltered({
      ...filtered,
      [key]: value,
    });
  };
  
  return (
    <div className="w-full max-w-8xl mx-auto space-y-8">
      <div className="w-full flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
        <Header
          title={"Manage Assignment"}
          subTitle={"Overview and manage all assignments"}
        />

        {/* Filtered & Action */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 max-sm:mt-2">
          <AssignmentFilter
            filtered={filtered}
            handleFiltered={handleFiltered}
            total={assignmentsData?.pagination?.total || 0}
          />
          <Link href="/assignment/add">
            <Button className="shrink-0 cursor-pointer">
              <Plus className="w-4 h-4" />
              New Assignment
            </Button>
          </Link>
        </div>
      </div>

      {/* Assignment List Area */}
      <div className="w-full">
        {isLoading ? (
          <div className="w-full">
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {assignmentsData?.assignments &&
            assignmentsData.assignments.length > 0 ? (
              <>
                {/* Assignment Table */}
                <AssignmentTable assignments={assignmentsData.assignments} />

                {/* Pagination logic */}
                {assignmentsData.pagination &&
                  assignmentsData.pagination.totalPages > 1 && (
                    <div className="mt-8">
                      <Pagination
                        pagination={assignmentsData.pagination}
                        onPageChange={(page) => handleFiltered("page", page)}
                      />
                    </div>
                  )}
              </>
            ) : (
              <p className="text-muted-foreground">No assignments found</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
