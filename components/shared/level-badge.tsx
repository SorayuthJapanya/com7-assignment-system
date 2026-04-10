"use client";

import { ILevel } from "@/types/level";

interface LevelBadgeProps {
  level: ILevel | null;
  totalScore?: number;
  size?: "sm" | "md" | "lg";
}

export default function LevelBadge({ level, totalScore, size = "md" }: LevelBadgeProps) {
  if (!level) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
        <span>⚪</span>
        <span>Unranked</span>
        {totalScore !== undefined && <span className="ml-1 opacity-70">({totalScore} pts)</span>}
      </span>
    );
  }

  const sizeClass = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClass}`}
      style={{
        backgroundColor: `${level.color}20`,
        color: level.color,
        border: `1px solid ${level.color}40`,
      }}
    >
      <span>{level.emoji}</span>
      <span>{level.name}</span>
      {totalScore !== undefined && (
        <span className="ml-1 opacity-70 font-normal text-xs">({totalScore} pts)</span>
      )}
    </span>
  );
}
