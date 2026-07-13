"use client";

import { Pencil, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthUser } from "@/contexts/auth-context";
import { IUser } from "@/types/auth";
import { useRef, useState, useEffect } from "react";

const initialApps = [
  { id: "nexhire7", name: "NexHire7", icon: "/icons8-ai-agent-96.png", url: "https://com7-hr-staging.comsevenaws.com/#/login" },
  { id: "comsevencareer", name: "comsevencareer", icon: "/icons8-sparkles-96.png", url: "https://www.comsevencareer.com/" },
  { id: "doctracker", name: "Doc Tracker", icon: "/icons8-google-docs-96 (2).png", url: "https://script.google.com/macros/s/AKfycbw0aulDfMeD_ICwcOGbqhpNU1FQAiKsrxfgsljpY6sklLOVC6voK__45B2C8aHP3TXKXw/exec" },
  { id: "documentary", name: "Documentary", icon: "/icons8-protondrive-96.png", url: "https://script.google.com/macros/s/AKfycbyFYdh6k0z-qCpJwvAVvy0IKqwfCE0G_t_ct4GIl0EhUKEbXJEox0m3-OdVUqB32uB6/exec" },
  { id: "weekly", name: "Weekly Overview", icon: "/icons8-report-96 (1).png", url: "-" },
  { id: "dashboard", name: "Dashboard & New Store", icon: "/icons8-dashboard-96 (1).png", url: "https://script.google.com/macros/s/AKfycbySJQ7fibyfwXy3ZK6xFwZZfE3viTjVsHOi1VtSujygMQwJjrf2b3idFF1B0LH2o9LF_Q/exec" },
  { id: "ads", name: "Ads", icon: "/icons8-canva-96.png", url: "https://www.canva.com/folder/FAHOyGHWd_4" },
  { id: "org", name: "Organization Chart", icon: "/icons8-canva-96.png", url: "https://www.canva.com/folder/FAFqB-P8ou8" },
  { id: "vacancy", name: "Update Vacancy", icon: "/icons8-google-sheets-96 (1).png", url: "-" },
  { id: "vacancy_project", name: "Vacancy HQ/Branch/Project", icon: "/icons8-google-sheets-96 (1).png", url: "https://docs.google.com/spreadsheets/d/19jV0tEPp483wGKaqNXe63JUJI2tPnKsPoTvyQpzuUzg/edit?usp=drive_web&ouid=100085330486160439309" },
  { id: "benefit", name: "Benefit Sheet", icon: "/icons8-google-sheets-96 (1).png", url: "-" },
  { id: "new_asset", name: "เบิกทรัพย์สินพนักงานใหม่", icon: "/icons8-google-sheets-96 (1).png", url: "https://docs.google.com/spreadsheets/d/1cs7mv2gW4iSVoAjuFsvn0qmFpoungZzMe3-DIK8wZUk/edit?usp=drive_web&ouid=100085330486160439309" },
];

export default function AppLauncher() {
  const authUser = useAuthUser() as IUser | null;
  const [appsOpen, setAppsOpen] = useState(false);
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
        const parsed = JSON.parse(savedOrder) as typeof initialApps;

        // Merge: ใช้ "ลำดับ" ที่ผู้ใช้เคยจัดไว้ต่อ แต่ดึง icon/name/url ล่าสุดจาก initialApps เสมอ
        // กันปัญหาไอคอน/ชื่อ/ลิงก์เก่าค้างอยู่ใน localStorage หลังแก้โค้ด
        const latestById = new Map(initialApps.map((app) => [app.id, app]));

        const merged = parsed
          .filter((saved) => latestById.has(saved.id)) // ตัดแอปที่ถูกลบออกจากระบบไปแล้ว
          .map((saved) => latestById.get(saved.id)!); // แทนที่ข้อมูลด้วยของล่าสุดทั้งหมด ยกเว้นตำแหน่ง

        // เผื่อมีแอปใหม่ถูกเพิ่มเข้ามาใน initialApps ทีหลัง (ที่ merged ยังไม่มี) ให้ต่อท้ายไปด้วย
        const mergedIds = new Set(merged.map((app) => app.id));
        const newApps = initialApps.filter((app) => !mergedIds.has(app.id));
        const finalList = [...merged, ...newApps];

        setAppList(finalList);
        setTempAppList(finalList);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  if (!isMounted || !authUser) return null;

  // ซ่อนระบบทั้งหมดถาวรถ้าเป็น INTERN
  if (authUser?.role === "INTERN") return null;

  const handleStartEditApps = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempAppList([...appList]);
    setIsEditMode(true);
  };

  const handleSaveAppsOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem("com7_apps_order", JSON.stringify(appList));
    setIsEditMode(false);
  };

  const handleCancelEditApps = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div className="relative">
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

      <DropdownMenu open={appsOpen} onOpenChange={(open) => { if (!isEditMode) setAppsOpen(open); }}>
        <DropdownMenuTrigger asChild>
          <button
            onClick={() => {
              setAppsOpen(!appsOpen);
              setIsEditMode(false);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center outline-none"
            title="Apps"
            type="button"
          >
            <Image
              src="/icons8-menu-50.png"
              alt="Menu Icon"
              width={24}
              height={24}
              className="object-contain"
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={12}
          className="w-[340px] rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-0 shadow-2xl overflow-hidden z-50"
        >
          {!isEditMode ? (
            <div className="p-5 border-b flex items-center justify-between bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold text-lg text-gray-990 dark:text-white">
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}