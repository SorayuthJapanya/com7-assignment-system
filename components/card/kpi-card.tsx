"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";

type KpiColor = "blue" | "green" | "purple" | "orange" | "default";

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  suffix?: string;
  color?: KpiColor;
}

const colorConfig: Record<KpiColor, { icon: string; value: string; shadow: string }> = {
  blue:    { icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",    value: "text-blue-600 dark:text-blue-400",    shadow: "hover:shadow-blue-200/60 dark:hover:shadow-blue-900/40" },
  green:   { icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400", value: "text-emerald-600 dark:text-emerald-400", shadow: "hover:shadow-emerald-200/60 dark:hover:shadow-emerald-900/40" },
  purple:  { icon: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",  value: "text-violet-600 dark:text-violet-400",  shadow: "hover:shadow-violet-200/60 dark:hover:shadow-violet-900/40" },
  orange:  { icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",  value: "text-orange-600 dark:text-orange-400",  shadow: "hover:shadow-orange-200/60 dark:hover:shadow-orange-900/40" },
  default: { icon: "bg-primary/5 text-primary",  value: "text-primary", shadow: "hover:shadow-primary/20" },
};

export default function KpiCard({ title, value, icon, suffix, color = "default" }: KpiCardProps) {
  const c = colorConfig[color];
  return (
    <Card className={`group rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 active:scale-95 gap-0 ${c.shadow}`}>
      <CardHeader>
        <CardTitle className="font-medium text-muted-foreground">{title}</CardTitle>
        <CardAction className={`p-2 rounded-xl transition-colors duration-200 ${c.icon}`}>
          {icon}
        </CardAction>
      </CardHeader>
      <CardContent className={`text-2xl sm:text-3xl font-bold flex items-end gap-2 sm:gap-3 duration-200 ${c.value}`}>
        {value}
        <span className="text-base font-normal text-muted-foreground">{suffix}</span>
      </CardContent>
    </Card>
  );
}
