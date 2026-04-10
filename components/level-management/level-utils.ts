import { ILevel } from "@/types/level";

export const EMPTY_FORM = { name: "", emoji: "", minScore: 0, maxScore: 100, color: "#6b7280" };

export function hasOverlap(
  minScore: number,
  maxScore: number,
  levels: ILevel[],
  excludeId?: string,
) {
  return levels
    .filter((l) => l.id !== excludeId)
    .some((l) => minScore <= l.maxScore && maxScore >= l.minScore);
}
