"use client";

import { ChevronsUpDown, LogOut, UserPen } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { IUser } from "@/types/auth";
import { useLogout, useUpdateUser } from "@/hooks/use-auth";
import { useAuthUser, useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useState } from "react";

export default function NavUser() {
  const authUser = useAuthUser() as IUser | null;
  const { setUser } = useAuth();
  const { isMobile } = useSidebar();
  const router = useRouter();

  const { mutateAsync: logoutMutation } = useLogout();
  const { mutateAsync: updateUserMutation, isPending } = useUpdateUser();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");

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

  const handleOpenEditProfile = () => {
    setNickname(authUser.nickname);
    setEmail(authUser.email);
    setDialogOpen(true);
  };

  const handleUpdateProfile = async () => {
    if (!nickname.trim() && !email.trim()) return;

    try {
      Swal.fire({
        title: "Updating...",
        text: "Please wait while we update your profile.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      })
      const res = await updateUserMutation({
        id: authUser.id,
        data: { nickname: nickname.trim(), email: email.trim() },
      });
      setUser({
        id: authUser.id,
        username: authUser.username,
        role: authUser.role as "SUPER_ADMIN" | "ADMIN" | "STAFF",
        createdAt: authUser.createdAt as unknown as string,
        updatedAt: (res.data as unknown as { updatedAt: string }).updatedAt ?? "",
        nickname: res.data.nickname,
        email: res.data.email,
      });
      setDialogOpen(false);
    } catch {
      // error handled inside useUpdateUser
    }
  };

  return (
    <>
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
                <DropdownMenuItem onClick={handleOpenEditProfile}>
                  <UserPen /> Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut /> Logout
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter nickname"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
