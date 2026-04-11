"use client";

import { ChevronsUpDown, LogOut, UserPen, Camera } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
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
import { useLogout, useUpdateUser, useUploadProfileImage } from "@/hooks/use-auth";
import { useAuthUser, useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useRef, useState } from "react";

export default function NavUser() {
  const authUser = useAuthUser() as IUser | null;
  const { setUser } = useAuth();
  const { isMobile } = useSidebar();
  const router = useRouter();

  const { mutateAsync: logoutMutation } = useLogout();
  const { mutateAsync: updateUserMutation, isPending } = useUpdateUser();
  const { mutateAsync: uploadImageMutation, isPending: isUploading } = useUploadProfileImage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!authUser) return null;

  const isBusy = isPending || isUploading;

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
    setSelectedFile(null);
    setPreviewUrl(null);
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpdateProfile = async () => {
    if (!nickname.trim() && !email.trim() && !selectedFile) return;

    try {
      Swal.fire({
        title: "Saving...",
        text: "Please wait while we update your profile.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      let profileImageUrl: string | undefined;

      // Step 1: upload image if selected
      if (selectedFile) {
        const uploadRes = await uploadImageMutation(selectedFile);
        profileImageUrl = uploadRes.url;
      }

      // Step 2: update user profile
      const res = await updateUserMutation({
        id: authUser.id,
        data: {
          nickname: nickname.trim(),
          email: email.trim(),
          ...(profileImageUrl && { profileImage: profileImageUrl }),
        },
      });

      setUser({
        id: authUser.id,
        username: authUser.username,
        role: authUser.role as "SUPER_ADMIN" | "ADMIN" | "STAFF",
        createdAt: authUser.createdAt as unknown as string,
        updatedAt: (res.data as unknown as { updatedAt: string }).updatedAt ?? "",
        nickname: res.data.nickname,
        email: res.data.email,
        profileImage: (res.data as unknown as { profileImage?: string }).profileImage ?? authUser.profileImage,
      });

      setDialogOpen(false);
    } catch {
      // error handled inside mutations
    }
  };

  const avatarUrl = authUser.profileImage;
  const initials = authUser.nickname.charAt(0).toUpperCase();

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
                <Avatar className="size-10">
                  <AvatarImage src={avatarUrl} alt={authUser.nickname} />
                  <AvatarFallback className="rounded-lg bg-primary text-white font-medium">{initials}</AvatarFallback>
                </Avatar>
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
                  <Avatar className="size-10">
                    <AvatarImage src={avatarUrl} alt={authUser.nickname} />
                    <AvatarFallback className="bg-primary text-white font-medium">{initials}</AvatarFallback>
                  </Avatar>
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
          <div className="flex flex-col gap-5 py-2">

            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="relative cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="size-24 text-3xl">
                  <AvatarImage src={previewUrl ?? avatarUrl} alt={authUser.nickname} />
                  <AvatarFallback className="bg-primary text-white font-medium text-3xl">{initials}</AvatarFallback>
                </Avatar>
                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="size-6 text-white" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Click to upload photo (max 5MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

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
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isBusy}>
              {isBusy ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
