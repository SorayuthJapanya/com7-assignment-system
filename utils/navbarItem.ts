import { FileText, LayoutDashboard, Users, LucideIcon } from "lucide-react";

export type NavbarItem = {
    title: string;
    url?: string;
    icon?: LucideIcon;
    isSuperAdmin?: boolean;
    isAdmin?: boolean;
    items?: NavbarItem[];
};

export const navbarItems: NavbarItem[] = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        isSuperAdmin: false,
    },
    {
        title: "Assignment",
        icon: FileText,
        items: [
            {
                title: "My Assignment",
                url: "/assignment",
                isSuperAdmin: false,
                isAdmin: false,
            },
            {
                title: "Manage Assignment",
                url: "/assignment/manage",
                isAdmin: true,
            },
            {
                title: "Create Assignment",
                url: "/assignment/add",
                isAdmin: true,
            },
            {
                title: "Review Assignment",
                url: "/assignment/review",
                isAdmin: true,
            }
        ]
    },
    {
        title: "User Management",
        url: "/user-management",
        icon: Users,
        isSuperAdmin: true,
    },
]