"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface ClaimSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  missionName: string;
  points: number;
}

export default function ClaimSuccessDialog({
  open,
  onClose,
  missionName,
  points,
}: ClaimSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm text-center">
        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check className="size-6" strokeWidth={2.5} />
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-slate-900">แลกรับรางวัลแล้ว</h2>
            <p className="text-sm text-slate-500">{missionName}</p>
          </div>

          <div className="w-full rounded-lg bg-slate-50 py-3">
            <p className="text-2xl font-bold text-slate-900">
              +{points.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Points เข้าบัญชีของคุณแล้ว</p>
          </div>
        </div>

        <DialogFooter className="sm:justify-center pt-2">
          <Button onClick={onClose} className="w-full">
            ปิด
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}