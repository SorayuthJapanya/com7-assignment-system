"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import { IUser } from "@/types/auth";
import { useLogout } from "@/hooks/use-auth";
import { useAuthUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function NavUser() {
  const authUser = useAuthUser() as IUser | null;
  const { isMobile } = useSidebar();
  const router = useRouter();

  const { mutateAsync: logoutMutation } = useLogout();

  if (!authUser) return null;

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: "question",
      title: "Logout",
      text: "Are you sure you want to logout?",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });
    if (result.isConfirmed) {
      await logoutMutation();
      router.push("/login");
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size={"lg"}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white font-medium">
                {authUser.nickname.charAt(0)}
              </div>
              <div className="flex flex-col">
                <p>{authUser.nickname}</p>
                <p className="max-w-36 truncate text-sm text-muted-foreground">
                  {authUser.email}
                </p>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "bottom"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white font-medium">
                  {authUser.nickname.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <p>{authUser.nickname}</p>
                  <p className="max-w-36 truncate text-sm text-muted-foreground">
                    {authUser.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut /> Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
