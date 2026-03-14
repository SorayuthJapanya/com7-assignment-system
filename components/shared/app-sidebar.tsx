"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import { navbarItems } from "@/utils/navbarItem";
import Image from "next/image";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { ChevronRight } from "lucide-react";
import NavUser from "./nav-user";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function AppSidebar() {
  const pathname = usePathname();
  const { isSuperAdmin } = useAuth();

  const isActive = (url?: string) => {
    if (!url) return false;
    if (url === "/dashboard") {
      return pathname === url;
    }
    return pathname.startsWith(url);
  };

  const isSubItemActive = (url: string) => {
    return pathname === url;
  };

  // Memoize filtered navbar items to prevent re-filtering on every render
  const filteredNavbarItems = useMemo(() => {
    return navbarItems.map((item) => ({
      ...item,
      items: item.items?.filter((subItem) => {
        if (subItem.isSuperAdmin && !isSuperAdmin) return false;
        return true;
      })
    })).filter((item) => {
      if (item.isSuperAdmin && !isSuperAdmin) return false;
      return true;
    });
  }, [isSuperAdmin]);

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    src="/logo.svg"
                    alt="COM7 Logo"
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex flex-col gap-0.2 leading-none">
                  <span className="font-semibold">COM7</span>
                  <span className="text-xs">Assignment System</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {filteredNavbarItems.map((item) => (
                <Collapsible key={item.title} asChild defaultOpen={false}>
                  <SidebarMenuItem>
                    {item.items?.length ? (
                      <>
                        <CollapsibleTrigger
                          asChild
                          className="group/collapsible"
                        >
                          <SidebarMenuButton
                            size={"lg"}
                            data-active={isActive(item.url) ? "true" : "false"}
                            className={
                              isActive(item.url)
                                ? "bg-primary text-primary-foreground"
                                : ""
                            }
                          >
                            <item.icon />
                            <span>{item.title}</span>
                            {item.items?.length ? (
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            ) : null}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items?.map((subItem) => (
                              <SidebarMenuItem key={subItem.title}>
                                <SidebarMenuButton
                                  asChild
                                  size="lg"
                                  className={
                                    isSubItemActive(subItem.url)
                                      ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                  }
                                >
                                  <a href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </a>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        size={"lg"}
                        className={
                          isActive(item.url)
                            ? "bg-primary/10 text-primary font-medium hover:bg-primary/20 hover:text-primary"
                            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }
                      >
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
