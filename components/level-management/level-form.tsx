import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ILevel, CreateLevelRequest } from "@/types/level";
import { hasOverlap } from "./level-utils";

interface LevelFormProps {
  form: CreateLevelRequest;
  onChange: (f: CreateLevelRequest) => void;
  existingLevels: ILevel[];
  excludeId?: string;
}

export default function LevelForm({ form, onChange, existingLevels, excludeId }: LevelFormProps) {
  const set = (key: keyof CreateLevelRequest, value: string | number) =>
    onChange({ ...form, [key]: value });

  const scoreError =
    form.maxScore <= form.minScore
      ? "Max Score must be greater than Min Score"
      : hasOverlap(form.minScore, form.maxScore, existingLevels, excludeId)
        ? "Score range overlaps with an existing level"
        : null;

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Level Name <span className="text-destructive">*</span></Label>
          <Input
            placeholder="e.g. Gold"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Emoji <span className="text-destructive">*</span></Label>
          <Input
            placeholder="e.g. 🌟"
            value={form.emoji}
            onChange={(e) => set("emoji", e.target.value)}
            maxLength={4}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Min Score <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              min={0}
              value={form.minScore}
              onChange={(e) => set("minScore", parseInt(e.target.value) || 0)}
              className={scoreError ? "border-destructive" : ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Max Score <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              min={0}
              value={form.maxScore}
              onChange={(e) => set("maxScore", parseInt(e.target.value) || 0)}
              className={scoreError ? "border-destructive" : ""}
            />
          </div>
        </div>
        {scoreError && <p className="text-xs text-destructive">{scoreError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Badge Color <span className="text-destructive">*</span></Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.color}
            onChange={(e) => set("color", e.target.value)}
            className="h-9 w-16 rounded-md border border-border cursor-pointer"
          />
          <Input
            placeholder="#6b7280"
            value={form.color}
            onChange={(e) => set("color", e.target.value)}
            className="font-mono"
          />
          {form.emoji && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold shrink-0"
              style={{
                backgroundColor: `${form.color}20`,
                color: form.color,
                border: `1px solid ${form.color}40`,
              }}
            >
              {form.emoji} {form.name || "Preview"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
