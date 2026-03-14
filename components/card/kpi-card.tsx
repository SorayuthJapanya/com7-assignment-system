"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  suffix?: string;
}

export default function KpiCard({ title, value, icon, suffix }: KpiCardProps) {
  return (
    <Card className="group rounded-xl hover:shadow-lg hover:scale-105 hover:shadow-primary/20 transition-all duration-200 active:scale-95 gap-0">
      <CardHeader>
        <CardTitle className="font-medium">{title}</CardTitle>
        <CardAction className="bg-primary/5 p-2 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
          {icon}
        </CardAction>
      </CardHeader>
      <CardContent className="text-2xl sm:text-3xl font-bold flex items-end gap-2 sm:gap-3 group-hover:text-primary duration-200">
        {value}
        <span className="text-base font-normal text-muted-foreground">{suffix}</span>
      </CardContent>
    </Card>
  );
}
