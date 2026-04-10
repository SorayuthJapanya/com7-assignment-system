"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ILevel, CreateLevelRequest, UpdateLevelRequest } from "@/types/level";
import LevelForm from "./level-form";
import { hasOverlap } from "./level-utils";

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CreateLevelRequest;
  onChange: (f: CreateLevelRequest) => void;
  existingLevels: ILevel[];
  onSubmit: () => void;
  isPending: boolean;
}

export function CreateLevelDialog({
  open,
  onOpenChange,
  form,
  onChange,
  existingLevels,
  onSubmit,
  isPending,
}: CreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Level</DialogTitle>
        </DialogHeader>
        <LevelForm form={form} onChange={onChange} existingLevels={existingLevels} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending || !form.name || !form.emoji}>
            {isPending ? "Creating..." : "Create Level"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EditDialogProps {
  editTarget: ILevel | null;
  onClose: () => void;
  editForm: UpdateLevelRequest;
  onChange: (f: CreateLevelRequest) => void;
  existingLevels: ILevel[];
  onSubmit: () => void;
  isPending: boolean;
}

export function EditLevelDialog({
  editTarget,
  onClose,
  editForm,
  onChange,
  existingLevels,
  onSubmit,
  isPending,
}: EditDialogProps) {
  const formValues: CreateLevelRequest = {
    name: editForm.name ?? "",
    emoji: editForm.emoji ?? "",
    minScore: editForm.minScore ?? 0,
    maxScore: editForm.maxScore ?? 100,
    color: editForm.color ?? "#6b7280",
  };

  const isOverlapping = hasOverlap(
    editForm.minScore ?? editTarget?.minScore ?? 0,
    editForm.maxScore ?? editTarget?.maxScore ?? 100,
    existingLevels,
    editTarget?.id,
  );

  return (
    <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Level</DialogTitle>
        </DialogHeader>
        <LevelForm
          form={formValues}
          onChange={onChange}
          existingLevels={existingLevels}
          excludeId={editTarget?.id}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending || isOverlapping}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
