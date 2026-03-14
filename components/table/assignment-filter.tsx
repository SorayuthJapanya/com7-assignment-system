import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Filter, Search, User, Users2 } from "lucide-react";
import { IFilteredAssignment } from "@/types/assignment";

interface AssignmentFilterProps {
  filtered: IFilteredAssignment;
  handleFiltered: (
    key: keyof IFilteredAssignment,
    value: string | number | boolean
  ) => void;
  total?: number;
}

export default function AssignmentFilter({
  filtered,
  handleFiltered,
  total = 0,
}: AssignmentFilterProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {/* Search */}
      <InputGroup>
        <InputGroupInput
          placeholder="Search..."
          value={filtered.search}
          onChange={(e) => handleFiltered("search", e.target.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupAddon align={"inline-end"}>
          <p className="text-xs font-normal text-muted-foreground">
            {total} assignment{total !== 1 ? "s" : ""}
          </p>
        </InputGroupAddon>
      </InputGroup>

      {/* Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Filter /> Filters
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Type</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={filtered.type}
                  onValueChange={(v) => handleFiltered("type", v)}
                >
                  <DropdownMenuRadioItem value="all">
                    All
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Individual">
                    <User /> Individual
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Group">
                    <Users2 /> Group
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={filtered.status}
                  onValueChange={(v) => handleFiltered("status", v)}
                >
                  <DropdownMenuRadioItem value="all">
                    All
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="not-submit">
                    🟠 Not Submit
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Pending">
                    🟡 Pending
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Approved">
                    🟢 Approved
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Rejected">
                    🔴 Rejected
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              Limit (Assignments)
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={filtered?.limit?.toString()}
                  onValueChange={(v) => handleFiltered("limit", parseInt(v))}
                >
                  <DropdownMenuRadioItem value="15">
                    15
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="30">
                    30
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="60">
                    60
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
