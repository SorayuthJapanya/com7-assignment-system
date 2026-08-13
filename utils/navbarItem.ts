import { FileText, LayoutDashboard, Users, Trophy, Settings2, Calendar, LucideIcon, Target, ShieldCheck } from "lucide-react";

export type NavbarItem = {
    title: string;
    url?: string;
    icon?: LucideIcon;
    isSuperAdmin?: boolean;
    isAdmin?: boolean;
    isStaffOnly?: boolean;
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
        title: "Daily Report",
        url: "/daily-report",
        icon: Calendar,
        isSuperAdmin: false,
        isAdmin: false,
    },
    {
        title: "Leaderboard",
        url: "/leaderboard",
        icon: Trophy,
        isSuperAdmin: false,
    },
    {
    title: "Mission & Quest",
    icon: Target,
    isStaffOnly: true,                 // ← มีแค่ตัวนี้
    items: [
        {
            title: "Mission Board",
            url: "/mission-quest",
            isStaffOnly: true,
        },
        {
            title: "Early Bird Leaderboard",
            url: "/mission-quest/leaderboard",
            isStaffOnly: true,
        },
    ],
},
    {
        title: "Admin Menu",
        icon: ShieldCheck,
        isSuperAdmin: true,
        items: [
            {
                title: "User Management",
                url: "/user-management",
            },
            {
                title: "Level Management",
                url: "/level-management",
            },
        ],
    },

]