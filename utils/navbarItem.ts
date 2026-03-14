import { FileText, LayoutDashboard, Users } from "lucide-react";

export const navbarItems = [
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
            },
            {
                title: "Manage Assignment",
                url: "/assignment/manage",
                isSuperAdmin: true,
            },
            {
                title: "Create Assignment",
                url: "/assignment/add",
                isSuperAdmin: true,
            },
            {
                title: "Review Assignment",
                url: "/assignment/review",
                isSuperAdmin: true,
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