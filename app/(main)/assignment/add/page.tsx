"use client";

import AddAssignmentForm from "@/components/form/add-assignment-form";
import Header from "@/components/header";
import { useGetUsers } from "@/hooks/use-auth";
import { useMemo } from "react";

export default function AddAssignmentPage() {
  const { data: users, isLoading } = useGetUsers({ search: "" });

  const allUsernames = useMemo(() => {
    return (
      users?.data
        ?.sort((a, b) => a.username.localeCompare(b.username))
        .map((user) => user.username) || []
    );
  }, [users]);

  return (
    <div className="w-full max-w-8xl mx-auto space-y-8">
      <div className="w-full">
        <Header title={"Add Assignment"} subTitle={"Add new assignment"} />
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="w-full max-w-2xl">
          <AddAssignmentForm allUsernames={allUsernames} />
        </div>
      )}
    </div>
  );
}
