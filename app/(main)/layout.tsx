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

export const metadata: Metadata = {
  title: "COM7 Assignment System",
  description: "Assignment management system for COM7",
};

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
          <header className="sticky top-0 flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 shadow-xs bg-background z-2">
            <div className="w-full flex items-center gap-2 px-8">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <DynamicBreadcrumb />
            </div>
            <div className="hidden sm:block">
              <div className="w-max flex items-center justify-end px-8">
                <NavUser />
              </div>
            </div>
          </header>
          <div className="px-8 py-6 bg-primary/1">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
