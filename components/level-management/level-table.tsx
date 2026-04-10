import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ILevel } from "@/types/level";
import { Pencil, Trash2 } from "lucide-react";

interface LevelTableProps {
  levels: ILevel[];
  isLoading: boolean;
  onEdit: (level: ILevel) => void;
  onDelete: (level: ILevel) => void;
}

export default function LevelTable({ levels, isLoading, onEdit, onDelete }: LevelTableProps) {
  const sorted = [...levels].sort((a, b) => a.minScore - b.minScore);

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24 text-center">Badge</TableHead>
            <TableHead>Level Name</TableHead>
            <TableHead className="text-center">Min Score</TableHead>
            <TableHead className="text-center">Max Score</TableHead>
            <TableHead className="text-center">Color</TableHead>
            <TableHead className="text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((__, j) => (
                  <TableCell key={j}>
                    <div className="h-5 rounded bg-muted animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                No levels configured yet. Click &quot;Add Level&quot; to get started.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((level) => (
              <TableRow key={level.id}>
                <TableCell className="text-center">
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-xl"
                    style={{
                      backgroundColor: `${level.color}20`,
                      border: `2px solid ${level.color}40`,
                    }}
                  >
                    {level.emoji}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold" style={{ color: level.color }}>
                    {level.name}
                  </span>
                </TableCell>
                <TableCell className="text-center font-mono text-sm">{level.minScore}</TableCell>
                <TableCell className="text-center font-mono text-sm">{level.maxScore}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-border shrink-0"
                      style={{ backgroundColor: level.color }}
                    />
                    <span className="hidden sm:block font-mono text-xs text-muted-foreground">
                      {level.color}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => onEdit(level)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => onDelete(level)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
