"use client";

import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useGetUsers } from "@/hooks/use-auth";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import UserTable from "@/components/table/user-table";
import AddUserDialog from "@/components/dialog/add-user";

export default function UserManagementPage() {
  const [search, setSearch] = useState<string>("");
  const [onAddUser, setOnAddUser] = useState<boolean>(false);

  const { data: users, isLoading } = useGetUsers({ search });
  return (
    <div className="w-full max-w-7xl xl:max-w-360 mx-auto space-y-8">
      <div className="w-full flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
        <Header
          title={"Manage User"}
          subTitle={"Overview and manage all users"}
        />

        {/* Search input and add button */}
        <div className="flex items-center justify-center sm:justify-end gap-2">
          {/* Search */}
          <InputGroup>
            <InputGroupInput
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupAddon align={"inline-end"}>
              <p className="text-xs font-normal text-muted-foreground">
                {users?.data.length} user{users?.data.length !== 1 ? "s" : ""}
              </p>
            </InputGroupAddon>
          </InputGroup>

          <Button className="cursor-pointer" onClick={() => setOnAddUser(true)}>
            <Plus /> Add User
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : users?.data.length === 0 ? (
        <p className="text-muted-foreground">No users found</p>
      ) : (
        <UserTable data={users?.data} />
      )}

      <AddUserDialog open={onAddUser} onOpenChange={setOnAddUser} />
    </div>
  );
}
