"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { navbarItems } from "@/utils/navbarItem";

function getBreadcrumbItems(pathname: string) {
  const breadcrumbs = [];

  // Find the matching item in navbarItems
  for (const item of navbarItems) {
    if (item.url === pathname) {
      breadcrumbs.push({ title: item.title, href: item.url });
      break;
    }
    
    // Check sub-items
    if (item.items) {
      for (const subItem of item.items) {
        if (subItem.url === pathname) {
          breadcrumbs.push({ title: item.title, href: item.url });
          breadcrumbs.push({ title: subItem.title, href: subItem.url });
          break;
        }
      }
    }
  }

  // Fallback for dashboard
  if (breadcrumbs.length === 0 && pathname === '/dashboard') {
    breadcrumbs.push({ title: 'Dashboard', href: '/dashboard' });
  }

  return breadcrumbs;
}

export default function DynamicBreadcrumb() {
  const pathname = usePathname();
  
  // Memoize breadcrumb items to prevent recalculation on every render
  const breadcrumbs = useMemo(() => getBreadcrumbItems(pathname), [pathname]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink
            href="/dashboard"
            className="hover:text-primary"
          >
            COM7 Assignment System
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.length > 0 && (
          <BreadcrumbSeparator className="hidden md:block" />
        )}
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={index} className="flex items-center">
            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href={breadcrumb.href}
                  className="hover:text-primary"
                >
                  {breadcrumb.title}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator />
            )}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
