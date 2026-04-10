"use client";

import { AtSign, Mail, Shield, User } from "lucide-react";

interface UserInfoGridProps {
  user: {
    username: string;
    nickname: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  STAFF: "Staff",
};

const cells = (user: UserInfoGridProps["user"]) => [
  {
    icon: <User className="size-4" />,
    label: "Nickname",
    value: user.nickname,
    accent: { bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/20", hover: "hover:border-violet-500/40 hover:bg-violet-500/10" },
  },
  {
    icon: <AtSign className="size-4" />,
    label: "Username",
    value: `@${user.username}`,
    accent: { bg: "bg-sky-500/10", text: "text-sky-500", border: "border-sky-500/20", hover: "hover:border-sky-500/40 hover:bg-sky-500/10" },
  },
  {
    icon: <Mail className="size-4" />,
    label: "Email",
    value: user.email,
    accent: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", hover: "hover:border-emerald-500/40 hover:bg-emerald-500/10" },
  },
  {
    icon: <Shield className="size-4" />,
    label: "Role",
    value: roleLabels[user.role] || user.role,
    accent: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", hover: "hover:border-amber-500/40 hover:bg-amber-500/10" },
  },
];

export default function UserInfoGrid({ user }: UserInfoGridProps) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6 shadow-sm hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
      <h3 className="mb-4 text-base font-semibold flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <User className="size-4" />
        </div>
        General Information
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cells(user).map((cell) => (
          <div
            key={cell.label}
            className={`group flex flex-col gap-2 rounded-xl border bg-muted/20 p-4 transition-all duration-150 ${cell.accent.border} ${cell.accent.hover}`}
          >
            <div className="flex items-center gap-2">
              <span className={`flex size-7 items-center justify-center rounded-lg ${cell.accent.bg} ${cell.accent.text} transition-transform duration-200 group-hover:scale-110`}>
                {cell.icon}
              </span>
              <span className="text-xs font-medium text-muted-foreground">{cell.label}</span>
            </div>
            <p className={`text-sm font-semibold truncate pl-0.5 ${cell.accent.text}`}>{cell.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
