"use client";

import { LogOut, UserPen, Camera } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
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
  const avatarUrl = authUser.profileImage;
  const initials = authUser.nickname.charAt(0).toUpperCase();

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
      if (selectedFile) {
        const uploadRes = await uploadImageMutation(selectedFile);
        profileImageUrl = uploadRes.url;
      }

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

  return (
    <>
      {/* Trigger — ใช้ Avatar เล็กสำหรับ dropdown เท่านั้น */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors outline-none">
            <Avatar className="size-7">
              <AvatarImage src={avatarUrl} alt={authUser.nickname} />
              <AvatarFallback className="bg-primary text-white text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">Account settings</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="min-w-48 rounded-lg"
          side="top"
          sideOffset={8}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleOpenEditProfile}>
              <UserPen className="size-4 mr-2" /> Edit Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="size-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Profile Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-2">
            <div className="flex flex-col items-center gap-2">
              <div
                className="relative cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="size-24">
                  <AvatarImage src={previewUrl ?? avatarUrl} alt={authUser.nickname} />
                  <AvatarFallback className="bg-primary text-white font-medium text-3xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
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