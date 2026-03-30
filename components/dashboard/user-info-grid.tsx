"use client";

import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Mail,
  Shield,
  User,
} from "lucide-react";

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

export default function UserInfoGrid({ user }: UserInfoGridProps) {
  const createdDate = safeFormatDate(user.createdAt, "dd MMMM yyyy");
  const updatedDate = safeFormatDate(user.updatedAt, "dd MMM yyyy, HH:mm");

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <User className="size-4" />
        </div>
        General Information
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoCell
          icon={<User className="size-4" />}
          label="Nickname"
          value={user.nickname}
        />
        <InfoCell
          icon={<Mail className="size-4" />}
          label="Email"
          value={user.email}
        />
        <InfoCell
          icon={<Shield className="size-4" />}
          label="Role"
          value={roleLabels[user.role] || user.role}
        />
        <InfoCell
          icon={<User className="size-4" />}
          label="Username"
          value={`${user.username}`}
        />
      </div>
    </div>
  );
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="group flex flex-col gap-1.5 rounded-xl border border-border/40 bg-muted/30 p-3.5 transition-all duration-200 hover:border-primary/30 hover:bg-primary/5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="text-muted-foreground/70 group-hover:text-primary transition-colors duration-200">
          {icon}
        </span>
        {label}
      </div>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

function safeFormatDate(dateStr: string, fmt: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, fmt);
  } catch {
    return dateStr;
  }
}
