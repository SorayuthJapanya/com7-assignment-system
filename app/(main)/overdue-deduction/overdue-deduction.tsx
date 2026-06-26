"use client";

import * as React from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthUser } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getRedeemStatus, redeemOverdue } from "@/services/leaderboard-services";
import { RedeemStatus, RedeemOverdueRequest } from "@/types/level";

// ✅ แสดงเฉพาะชั่วโมงและนาที
function formatDuration(seconds: number) {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} ชั่วโมง ${minutes} นาที`;
  return `${totalMinutes} นาที`;
}

export default function OverdueDeduction() {
  const authUser = useAuthUser();
  const queryClient = useQueryClient();

  const [pointsInput, setPointsInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data, isLoading, isError } = useQuery<RedeemStatus>({
    queryKey: ["redeem-status"],
    queryFn: getRedeemStatus,
    enabled: !!authUser,
  });

  const redeemMutation = useMutation({
    mutationFn: (payload: RedeemOverdueRequest) => redeemOverdue(payload),
    onSuccess: (response: any) => {
      setMessage(`ลด Overdue สำเร็จ ${response.minutesUsed} นาที`);
      setError(null);
      setPointsInput("");
      setShowConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["redeem-status"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (error: any) => {
      setMessage(null);
      setError(error?.response?.data?.error || "ไม่สามารถลด Overdue ได้ กรุณาลองใหม่อีกครั้ง");
      setShowConfirm(false);
    },
  });

  const remainingScore = data?.totalScore ?? 0;
  const remainingOverdueSeconds = data?.remainingOverdueSeconds ?? 0;
  const maxRedeemableMinutes = data?.maxRedeemableMinutes ?? 0;
  const maxRedeemablePoints = Math.floor(maxRedeemableMinutes / 5);

  const isMutating = redeemMutation.isPending;

  // คำนวณจาก input
  const inputPoints = Number(pointsInput);
  const isValidInput = Number.isInteger(inputPoints) && inputPoints > 0;
  const minutesWillReduce = isValidInput ? inputPoints * 5 : 0;

  const handleSubmit = () => {
    setMessage(null);
    setError(null);

    if (!isValidInput) {
      setError("กรุณากรอกจำนวนคะแนนที่ต้องการใช้ (เป็นตัวเลขเต็ม)");
      return;
    }
    if (inputPoints > maxRedeemablePoints) {
      setError(`คุณมีคะแนนเพียงพอสำหรับลดได้สูงสุด ${maxRedeemablePoints} คะแนน`);
      return;
    }

    setShowConfirm(true);
  };

  const confirmRedeem = () => {
    redeemMutation.mutate({ minutesToRedeem: minutesWillReduce });
  };

  return (
    <div className="space-y-6">
      {/* ส่วนแสดงข้อมูลสรุป */}
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Overdue Deduction</p>
            <h1 className="text-2xl font-semibold">ลด Overdue ด้วยคะแนน</h1>
          </div>
          <div className="rounded-2xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            1 คะแนน = 5 นาที
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">คะแนนที่มีอยู่</p>
            <p className="mt-2 text-3xl font-bold">{remainingScore.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">Overdue ที่ยังเหลือ</p>
            <p className="mt-2 text-3xl font-bold">{formatDuration(remainingOverdueSeconds)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">สูงสุดที่ลดได้</p>
            <p className="mt-2 text-3xl font-bold">{maxRedeemableMinutes} นาที</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>กรอกคะแนนเพื่อลด Overdue</CardTitle>
          <CardDescription>1 คะแนน = 5 นาที Overdue</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isLoading && <p>Loading...</p>}
          {isError && <p className="text-sm text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>}

          <div className="grid gap-2">
            <Label htmlFor="points">จำนวนคะแนนที่ต้องการใช้</Label>
            <Input
              id="points"
              type="number"
              min={1}
              max={maxRedeemablePoints}
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              placeholder="เช่น 1, 2, 5"
            />

            {isValidInput && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                <div>
                  จะลด Overdue <span className="font-semibold text-lg">{minutesWillReduce} นาที</span>
                </div>
                <div className="text-blue-600">
                  ใช้คะแนนทั้งหมด <span className="font-semibold">{inputPoints} คะแนน</span>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              สูงสุด {maxRedeemablePoints} คะแนน (ลดได้ {maxRedeemableMinutes} นาที)
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              ✨ ระบบจะหักคะแนนสะสมของคุณบน Leaderboard ทันทีหลังจากการยืนยัน
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isMutating || !data || maxRedeemablePoints <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isMutating ? "กำลังดำเนินการ..." : "ยืนยันลด Overdue"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* === Popup ยืนยัน === */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการลด Overdue</DialogTitle>
            <DialogDescription>
              กรุณาตรวจสอบข้อมูลก่อนดำเนินการ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* คะแนนปัจจุบันและที่จะใช้ */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">คะแนนปัจจุบัน</p>
                <p className="text-xl font-semibold">{remainingScore.toLocaleString()} คะแนน</p>
              </div>
              <div>
                <p className="text-muted-foreground">คะแนนที่จะใช้</p>
                <p className="text-xl font-semibold text-amber-600">{inputPoints} คะแนน</p>
              </div>
            </div>

            {/* Overdue ที่จะลด */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-amber-700 font-medium">จะลด Overdue</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {minutesWillReduce} นาที
              </p>
            </div>

            {/* Overdue ที่จะเหลือ */}
            {isValidInput && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-blue-700 font-medium">Overdue ที่จะเหลือหลังการลด</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {formatDuration(remainingOverdueSeconds - minutesWillReduce * 60)}
                </p>
              </div>
            )}

            <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg border">
              • คะแนนจะถูกหักทันทีจาก Leaderboard<br />
              • หลังจากดำเนินการนี้ไม่สามารถยกเลิกได้
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={confirmRedeem}
              disabled={isMutating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isMutating ? "กำลังลด Overdue..." : "ยืนยันการลด Overdue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}