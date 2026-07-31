"use client";

import type { MissionSectionData } from "@/types/mission-quest";
import MissionCard from "./mission-card";
import {
  TrendingUp,
  HandHeart,
  Trophy,
  Target,
  Sparkles,
  Clock,
  Gem,
  ChartNoAxesCombined,
  Users,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  "trending-up": TrendingUp,
  "hand-heart": HandHeart,
  trophy: Trophy,
  target: Target,
  sparkles: Sparkles,
  clock: Clock,
  gem: Gem,
  "chart-simple": ChartNoAxesCombined,
  users: Users,
};

// 🎨 กำหนดโทนสีตามหมวด — แก้ "key" ตรงนี้ให้ตรงกับ section.key จริงในข้อมูลของคุณ
export type MissionTheme = "time" | "quality" | "quantity" | "growth" | "default";

const SECTION_THEME_MAP: Record<string, MissionTheme> = {
  punctual: "time",     
  quality: "quality",
  volume: "quantity",  
  growth: "growth",
};

interface MissionSectionProps {
  section: MissionSectionData;
  onClaim?: (missionId: string) => void;
  claimingId?: string | null;
}

export default function MissionSection({ section, onClaim, claimingId }: MissionSectionProps) {
  const Icon = ICON_MAP[section.icon] ?? Target;
  const isBonusSection = section.key === "bonus";
  const theme: MissionTheme = SECTION_THEME_MAP[section.key] ?? "default";

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div
          className="flex size-9 items-center justify-center rounded-lg shrink-0"
          style={{ background: section.iconBg, color: section.iconColor }}
        >
          <Icon className="size-4.5" />
        </div>
        <h2 className="text-base font-bold text-slate-900">{section.title}</h2>
        <span className="text-xs text-slate-400 font-medium">{section.countLabel}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {section.missions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            theme={theme}
            legendary={isBonusSection}
            onClaim={onClaim}
            isClaiming={claimingId === mission.id}
          />
        ))}
      </div>
    </section>
  );
}