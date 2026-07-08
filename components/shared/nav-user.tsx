"use client";

import { LogOut, UserPen, Camera, Grid3X3, X, Pencil } from "lucide-react";
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
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const initialApps = [
  { id: "nexhire7", name: "NexHire7", icon: "/icons8-ai-agent-96.png", url: "https://com7-hr-staging.comsevenaws.com/#/login" },
  { id: "comsevencareer", name: "comsevencareer", icon: "/icons8-sparkles-96.png", url: "https://www.comsevencareer.com/" },
  { id: "doctracker", name: "Doc Tracker", icon: "/icons8-google-docs-96 (2).png", url: "https://script.google.com/macros/s/AKfycbw0aulDfMeD_ICwcOGbqhpNU1FQAiKsrxfgsljpY6sklLOVC6voK__45B2C8aHP3TXKXw/exec" },
  { id: "documentary", name: "Documentary", icon: "/icons8-protondrive-96.png", url: "https://script.google.com/macros/s/AKfycbyFYdh6k0z-qCpJwvAVvy0IKqwfCE0G_t_ct4GIl0EhUKEbXJEox0m3-OdVUqB32uB6/exec" },
  { id: "weekly", name: "Weekly Overview", icon: "/icons8-report-96 (1).png", url: "-" }, 
  { id: "dashboard", name: "Dashboard & New Store", icon: "/icons8-dashboard-96 (1).png", url: "https://script.google.com/macros/s/AKfycbySJQ7fibyfwXy3ZK6xFwZZfE3viTjVsHOi1VtSujygMQwJjrf2b3idFF1B0LH2o9LF_Q/exec" },
  { id: "ads", name: "Ads", icon: "/icons8-canva-96.png", url: "https://www.canva.com/folder/FAHOyGHWd_4" },
  { id: "org", name: "Organization Chart", icon: "/icons8-report-96 (1).png", url: "https://www.canva.com/folder/FAFqB-P8ou8" },
  { id: "vacancy", name: "Update Vacancy", icon: "/icons8-google-sheets-96 (1).png", url: "-" }, 
  { id: "vacancy_project", name: "Vacancy HQ/Branch/Project", icon: "/icons8-google-sheets-96 (1).png", url: "https://docs.google.com/spreadsheets/d/19jV0tEPp483wGKaqNXe63JUJI2tPnKsPoTvyQpzuUzg/edit?usp=drive_web&ouid=100085330486160439309" },
  { id: "benefit", name: "Benefit Sheet", icon: "/icons8-google-sheets-96 (1).png", url: "-" }, 
  { id: "new_asset", name: "เบิกทรัพย์สินพนักงานใหม่", icon: "/icons8-google-sheets-96 (1).png", url: "https://docs.google.com/spreadsheets/d/1cs7mv2gW4iSVoAjuFsvn0qmFpoungZzMe3-DIK8wZUk/edit?usp=drive_web&ouid=100085330486160439309" },
];

export default function NavUser() {
  const authUser = useAuthUser() as IUser | null;
  const { setUser } = useAuth();
  const router = useRouter();

  const { mutateAsync: logoutMutation } = useLogout();
  const { mutateAsync: updateUserMutation, isPending } = useUpdateUser();
  const { mutateAsync: uploadImageMutation, isPending: isUploading } = useUploadProfileImage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [appList, setAppList] = useState(initialApps);
  const [tempAppList, setTempAppList] = useState(initialApps); 
  const [isEditMode, setIsEditMode] = useState(false); 
  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedOrder = localStorage.getItem("com7_apps_order");
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        setAppList(parsed);
        setTempAppList(parsed);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  if (!isMounted || !authUser) return null;

  const isBusy = isPending || isUploading;
  const avatarUrl = authUser.profileImage;
  const initials = authUser.nickname ? authUser.nickname.charAt(0).toUpperCase() : "U";

  const handleStartEditApps = () => {
    setTempAppList([...appList]); 
    setIsEditMode(true);
  };

  const handleSaveAppsOrder = () => {
    localStorage.setItem("com7_apps_order", JSON.stringify(appList));
    setIsEditMode(false);
  };

  const handleCancelEditApps = () => {
    setAppList([...tempAppList]); 
    setIsEditMode(false);
  };

  const handleDragStart = (index: number) => {
    dragItemIndex.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItemIndex.current = index;
    if (dragItemIndex.current === null || dragItemIndex.current === index) return;
    
    const listCopy = [...appList];
    const targetItem = listCopy[dragItemIndex.current];
    listCopy.splice(dragItemIndex.current, 1);
    listCopy.splice(index, 0, targetItem);
    
    dragItemIndex.current = index;
    setAppList(listCopy);
  };

  const handleDragEnd = () => {
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

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
    <div className="flex items-center gap-4 w-full">
      {/* แทรก CSS Animation สำหรับเอฟเฟกต์การสั่น (Wiggle Effect) */}
      <style>{`
        @keyframes wiggle {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-1.5deg); }
          75% { transform: rotate(1.5deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.25s ease-in-out infinite;
        }
      `}</style>

      {/* 1. ส่วนของปุ่ม 9 ปุ่ม (App Launcher) */}
      <div className="relative">
        <button
          onClick={() => {
            setAppsOpen(!appsOpen);
            setIsEditMode(false);
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center outline-none"
          title="Apps"
          type="button"
        >
          <Grid3X3 className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>

        {appsOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { if (!isEditMode) setAppsOpen(false); }} />
            <div className="fixed top-16 right-6 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-[340px] z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
              
              {!isEditMode ? (
                <div className="p-5 border-b flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    Hi, <span className="text-purple-600 dark:text-purple-400">{authUser?.nickname}</span>
                  </h3>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={handleStartEditApps}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
                      title="จัดเรียงแอป"
                      type="button"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setAppsOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400" type="button">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-b flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                  <button 
                    onClick={handleCancelEditApps}
                    className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium transition-colors"
                    type="button"
                  >
                    ยกเลิก
                  </button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ลากและวางแอป</span>
                  <button 
                    onClick={handleSaveAppsOrder}
                    className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-colors shadow-sm"
                    type="button"
                  >
                    เสร็จ
                  </button>
                </div>
              )}

              <div className="p-6 grid grid-cols-3 gap-5 max-h-[460px] overflow-y-auto">
                {appList.map((app, index) => {
                  const hasValidLink = app.url && app.url !== "-";

                  const appContent = (
                    <>
                      {/* 🛠️ เพิ่มคลาส 'animate-wiggle' เมื่ออยู่ในโหมดแก้ไขเพื่อให้ไอคอนสั่นดุ๊กดิ๊ก */}
                      <div className={`w-16 h-16 relative flex items-center justify-center rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden ${isEditMode ? 'cursor-grab active:cursor-grabbing border-dashed border-blue-400 dark:border-blue-500 animate-wiggle' : 'group-hover:shadow-md transition-all group-hover:scale-105'}`}>
                        <Image 
                          src={app.icon} 
                          alt={app.name} 
                          width={36}
                          height={36}
                          className="object-contain select-none" 
                          draggable={false} 
                          priority={index < 6}
                        />
                      </div>
                      <span className="text-[13px] text-center font-medium text-gray-700 dark:text-gray-300 leading-tight line-clamp-2 min-h-[42px] w-full select-none">
                        {app.name}
                      </span>
                    </>
                  );

                  if (isEditMode) {
                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className="flex flex-col items-center gap-3 opacity-95 hover:opacity-100"
                      >
                        {appContent}
                      </div>
                    );
                  }

                  return hasValidLink ? (
                    <Link
                      key={app.id}
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setAppsOpen(false)}
                      className="flex flex-col items-center gap-3 group text-decoration-none"
                    >
                      {appContent}
                    </Link>
                  ) : (
                    <div
                      key={app.id}
                      className="flex flex-col items-center gap-3 group opacity-75"
                    >
                      {appContent}
                    </div>
                  );
                })}
              </div>

            </div>
          </>
        )}
      </div>

      {/* 2. ส่วนของ Dropdown Profile บัญชีผู้ใช้เดิม */}
      <div className="flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors outline-none" type="button">
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
      </div>

      {/* 3. ส่วนของ Dialog จัดการโปรไฟล์ */}
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
    </div>
  );
}