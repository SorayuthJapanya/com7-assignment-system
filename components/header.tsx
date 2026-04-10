"use client";

interface HeaderProps {
  title: string;
  subTitle: string;
}

export default function Header({ title, subTitle }: HeaderProps) {
  return (
    <div className="flex flex-col items-center sm:items-start">
      <div className="text-2xl font-bold">{title}</div>
      <div className="text-muted-foreground max-w-sm sm:max-w-md text-sm">{subTitle}</div>
    </div>
  );
}
