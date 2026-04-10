"use client";

import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ILevel, CreateLevelRequest, UpdateLevelRequest } from "@/types/level";
import { useGetLevels, useCreateLevel, useUpdateLevel, useDeleteLevel } from "@/hooks/use-level";
import LevelTable from "@/components/level-management/level-table";
import { CreateLevelDialog, EditLevelDialog } from "@/components/level-management/level-dialogs";
import { EMPTY_FORM, hasOverlap } from "@/components/level-management/level-utils";
import Swal from "sweetalert2";

export default function LevelManagementPage() {
  const { data: levels = [], isLoading } = useGetLevels();
  const { mutateAsync: createLevel, isPending: isCreating } = useCreateLevel();
  const { mutateAsync: updateLevel, isPending: isUpdating } = useUpdateLevel();
  const { mutateAsync: deleteLevel } = useDeleteLevel();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ILevel | null>(null);
  const [form, setForm] = useState<CreateLevelRequest>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<UpdateLevelRequest>({});

  const handleCreate = async () => {
    if (form.minScore >= form.maxScore) {
      Swal.fire({ icon: "error", title: "Invalid score range", text: "Max Score must be greater than Min Score.", timer: 2500, showConfirmButton: false });
      return;
    }
    if (hasOverlap(form.minScore, form.maxScore, levels)) {
      Swal.fire({ icon: "error", title: "Score range overlaps", text: "This score range overlaps with an existing level.", timer: 2500, showConfirmButton: false });
      return;
    }
    await createLevel(form);
    setForm(EMPTY_FORM);
    setCreateOpen(false);
  };

  const handleEdit = (level: ILevel) => {
    setEditTarget(level);
    setEditForm({ name: level.name, emoji: level.emoji, minScore: level.minScore, maxScore: level.maxScore, color: level.color });
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    const min = editForm.minScore ?? editTarget.minScore;
    const max = editForm.maxScore ?? editTarget.maxScore;
    if (min >= max) {
      Swal.fire({ icon: "error", title: "Invalid score range", text: "Max Score must be greater than Min Score.", timer: 2500, showConfirmButton: false });
      return;
    }
    if (hasOverlap(min, max, levels, editTarget.id)) {
      Swal.fire({ icon: "error", title: "Score range overlaps", text: "This score range overlaps with an existing level.", timer: 2000, showConfirmButton: false });
      return;
    }
    await updateLevel({ id: editTarget.id, data: editForm });
    setEditTarget(null);
    setEditForm({});
  };

  const handleDelete = async (level: ILevel) => {
    const result = await Swal.fire({
      icon: "warning",
      title: `Delete "${level.name}"?`,
      text: "This cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#ef4444",
    });
    if (result.isConfirmed) await deleteLevel({ id: level.id });
  };

  return (
    <div className="w-full max-w-7xl xl:max-w-360 mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Header
          title="Level Management"
          subTitle="Configure score ranges and level badges for the leaderboard"
        />
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 cursor-pointer">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Level
        </Button>
      </div>

      <LevelTable
        levels={levels}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CreateLevelDialog
        open={createOpen}
        onOpenChange={(o) => { setCreateOpen(o); if (!o) setForm(EMPTY_FORM); }}
        form={form}
        onChange={setForm}
        existingLevels={levels}
        onSubmit={handleCreate}
        isPending={isCreating}
      />

      <EditLevelDialog
        editTarget={editTarget}
        onClose={() => setEditTarget(null)}
        editForm={editForm}
        onChange={(updated) => setEditForm(updated)}
        existingLevels={levels}
        onSubmit={handleUpdate}
        isPending={isUpdating}
      />
    </div>
  );
}
