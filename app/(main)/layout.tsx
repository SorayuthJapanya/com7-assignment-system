"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import DynamicBreadcrumb from "@/components/shared/dynamic-breadcrumb";
import AppSidebar from "@/components/shared/app-sidebar";
import { AuthProvider } from "@/contexts/auth-context";
import NavUser from "@/components/shared/nav-user";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <SidebarProvider className={`${inter.variable}`}>
        <AppSidebar />
        <SidebarInset>
          {/* ปรับปรุง header: ให้ใช้ flex-row และกระจายพื้นที่ออกซ้าย-ขวาด้วย justify-between */}
          <header className="sticky top-0 flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 shadow-xs bg-background z-2 px-4 sm:px-8">
            
            {/* ฝั่งซ้าย: ปุ่มเปิด Sidebar + Breadcrumb (ใช้ min-w-0 เพื่อกันเนื้อหายาวดันหลุดจอ) */}
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className="-ml-1 shrink-0" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4 shrink-0"
              />
              
              <div className="truncate text-sm">
                <DynamicBreadcrumb />
              </div>
            </div>
            
            
            <div className="flex items-center justify-end shrink-0">
              <NavUser />
            </div>

          </header>
          <div className="px-4 py-6 sm:px-8 bg-primary/1">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}