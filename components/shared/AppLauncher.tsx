"use client";

import { Grid3X3, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthUser } from "@/contexts/auth-context";
import { IUser } from "@/types/auth";

interface AppItem {
  name: string;
  icon: string;
  url: string;
}

export default function AppLauncher() {
  const authUser = useAuthUser() as IUser | null;

  // ส่วนที่ 1: กลุ่มรายการโปรด (แสดงด้านบน)
  const favoriteApps: AppItem[] = [
    { name: "NexHire7", icon: "/icons/icons8-ai-agent-96.png", url: "https://com7-hr-staging.comsevenaws.com/#/login" },
    { name: "comsevencareer", icon: "/icons/icons8-sparkles-96.png", url: "https://www.comsevencareer.com/" },
    { name: "Doc Tracker", icon: "/icons/icons8-google-docs-96 (2).png", url: "https://script.google.com/macros/s/AKfycbw0aulDfMeD_ICwcOGbqhpNU1FQAiKsrxfgsljpY6sklLOVC6voK__45B2C8aHP3TXKXw/exec" },
    { name: "Documentary", icon: "/icons/icons8-protondrive-96.png", url: "https://script.google.com/macros/s/AKfycbyFYdh6k0z-qCpJwvAVvy0IKqwfCE0G_t_ct4GIl0EhUKEbXJEox0m3-OdVUqB32uB6/exec" },
    { name: "Dashboard & New Store", icon: "/icons/icons8-dashboard-96 (1).png", url: "https://script.google.com/macros/s/AKfycbySJQ7fibyfwXy3ZK6xFwZZfE3viTjVsHOi1VtSujygMQwJjrf2b3idFF1B0LH2o9LF_Q/exec" },
    { name: "Ads", icon: "/icons/icons8-canva-96.png", url: "https://www.canva.com/folder/FAHOyGHWd_4" },
    { name: "Organization Chart", icon: "/icons/icons8-report-96 (1).png", url: "https://www.canva.com/folder/FAFqB-P8ou8" },
  ];

  // ส่วนที่ 2: กลุ่มแอปพลิเคชันทั่วไป (แสดงด้านล่าง)
  const generalApps: AppItem[] = [
    { name: "Vacancy HQ/Branch/Project", icon: "/icons/icons8-google-sheets-96 (1).png", url: "https://docs.google.com/spreadsheets/d/19jV0tEPp483wGKaqNXe63JUJI2tPnKsPoTvyQpzuUzg/edit?usp=drive_web&ouid=100085330486160439309" },
    { name: "เบิกทรัพย์สินพนักงานใหม่", icon: "/icons/icons8-google-sheets-96 (1).png", url: "https://docs.google.com/spreadsheets/d/1cs7mv2gW4iSVoAjuFsvn0qmFpoungZzMe3-DIK8wZUk/edit?usp=drive_web&ouid=100085330486160439309" },
  ];

  return (
    <div className="flex justify-end p-4">
      <DropdownMenu>
        {/* ปุ่มจุด 9 จุดสำหรับกดเปิด */}
        <DropdownMenuTrigger asChild>
          <button 
            className="flex items-center justify-center size-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors outline-none"
            title="Apps"
          >
            <Grid3X3 className="size-6 text-gray-700 dark:text-gray-300" />
          </button>
        </DropdownMenuTrigger>

        {/* กล่องดีไซน์ลอยสไตล์ Google Popover */}
        <DropdownMenuContent 
          align="end" 
          sideOffset={12}
          className="w-[360px] max-h-[85vh] overflow-y-auto rounded-[28px] bg-[#f8f9fa] dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700 p-0 shadow-2xl"
        >
          {/* การ์ดส่วนบน: รายการโปรด */}
          <div className="m-2 p-4 bg-white dark:bg-gray-850 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-base font-normal text-gray-700 dark:text-gray-300">
                Hi, <span className="font-semibold text-purple-600 dark:text-purple-400">{authUser?.nickname || "User"}</span>
              </h2>
              <button className="p-2 bg-[#d3e3fd] text-[#041e49] rounded-full hover:bg-[#b4cff7] transition-colors">
                <Pencil className="size-4" />
              </button>
            </div>

            {/* Grid แอปพลิเคชันแถวบน */}
            <div className="grid grid-cols-3 gap-y-4 gap-x-2">
              {favoriteApps.map((app, index) => (
                <Link
                  key={index}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-2 rounded-2xl hover:bg-gray-100/80 dark:hover:bg-gray-800/50 transition-colors text-center group"
                >
                  <div className="w-14 h-14 relative flex items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 dark:border-gray-700 group-hover:shadow-md transition-all group-hover:scale-105">
                    <Image src={app.icon} alt={app.name} width={48} height={48} className="object-contain" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 line-clamp-2 w-full mt-1.5 px-1 leading-tight min-h-[32px]">
                    {app.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* การ์ดส่วนล่าง: แอปทั่วไป */}
          <div className="p-4 pt-2">
            <div className="grid grid-cols-3 gap-y-4 gap-x-2">
              {generalApps.map((app, index) => (
                <Link
                  key={index}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-2 rounded-2xl hover:bg-gray-200/50 dark:hover:bg-gray-800/80 transition-colors text-center group"
                >
                  <div className="w-14 h-14 relative flex items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 dark:border-gray-700 group-hover:shadow-md transition-all group-hover:scale-105">
                    <Image src={app.icon} alt={app.name} width={48} height={48} className="object-contain" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 line-clamp-2 w-full mt-1.5 px-1 leading-tight min-h-[32px]">
                    {app.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}