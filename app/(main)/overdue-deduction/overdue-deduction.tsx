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
import { getRedeemStatus, redeemOverdue, redeemNegativePoints } from "@/services/leaderboard-services";
import { RedeemStatus, RedeemOverdueRequest, RedeemNegativeRequest } from "@/types/level";
import { TrendingDown, AlertTriangle } from "lucide-react";

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

  // State Overdue
  const [pointsInput, setPointsInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // State Negative Point — แยก message/error ออกจากฝั่ง Overdue โดยเฉพาะ
  const [negPointsInput, setNegPointsInput] = useState("");
  const [negMessage, setNegMessage] = useState<string | null>(null);
  const [negError, setNegError] = useState<string | null>(null);
  const [showNegConfirm, setShowNegConfirm] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<RedeemStatus>({
    queryKey: ["redeem-status"],
    queryFn: getRedeemStatus,
    enabled: !!authUser,
  });

  const redeemMutation = useMutation({
    mutationFn: (payload: RedeemOverdueRequest) => redeemOverdue(payload),
    onSuccess: async (response: any) => {
      setMessage(`ลด Overdue สำเร็จ ${response.minutesUsed} นาที`);
      setError(null);
      setPointsInput("");
      setShowConfirm(false);
      await queryClient.invalidateQueries({ queryKey: ["redeem-status"] });
      await queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      refetch();
    },
    onError: (error: any) => {
      setMessage(null);
      setError(error?.response?.data?.error || "ไม่สามารถลด Overdue ได้ กรุณาลองใหม่อีกครั้ง");
      setShowConfirm(false);
    },
  });

  const redeemNegMutation = useMutation({
    mutationFn: (payload: RedeemNegativeRequest) => redeemNegativePoints(payload),
    onSuccess: async () => {
      setNegMessage(`ลบ Negative Point สำเร็จเรียบร้อยแล้ว`);
      setNegError(null);
      setNegPointsInput("");
      setShowNegConfirm(false);
      await queryClient.invalidateQueries({ queryKey: ["redeem-status"] });
      await queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      refetch();
    },
    onError: (error: any) => {
      setNegMessage(null);
      setNegError(error?.response?.data?.error || "ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง");
      setShowNegConfirm(false);
    },
  });

  // Calculations Overdue
  const remainingScore = Math.max(0, data?.totalScore ?? 0);
  const remainingOverdueSeconds = data?.remainingOverdueSeconds ?? 0;
  const maxRedeemableMinutes = data?.maxRedeemableMinutes ?? 0;
  const maxRedeemablePoints = Math.floor(maxRedeemableMinutes / 5);

  const remainingOverdueMinutes = Math.floor(remainingOverdueSeconds / 60);
  const maxUsablePointsByOverdue = Math.floor(remainingOverdueMinutes / 5);
  const effectiveMaxPoints = Math.min(maxRedeemablePoints, maxUsablePointsByOverdue);

  const inputPoints = Number(pointsInput);
  const isValidInput = Number.isInteger(inputPoints) && inputPoints > 0;
  const minutesWillReduce = isValidInput ? inputPoints * 5 : 0;

  // Calculations Negative Point
  const negativePoints = Math.max(0, data?.negativePoints ?? 0);
  const maxUsableNegPoints = Math.max(0, Math.min(remainingScore, negativePoints));

  const numNegPoints = Number(negPointsInput);
  const isValidNegInput = Number.isInteger(numNegPoints) && numNegPoints > 0;

  // Handlers Overdue
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
    if (minutesWillReduce > remainingOverdueMinutes) {
      setError(
        `Overdue เหลือแค่ ${remainingOverdueMinutes} นาที ใช้คะแนนได้สูงสุด ${maxUsablePointsByOverdue} คะแนน`
      );
      return;
    }

    setShowConfirm(true);
  };

  const confirmRedeem = () => {
    redeemMutation.mutate({ minutesToRedeem: minutesWillReduce });
  };

  // Handlers Negative Point
  const handleNegSubmit = () => {
    setNegMessage(null);
    setNegError(null);

    if (!isValidNegInput) {
      setNegError("กรุณากรอกจำนวนคะแนนเป็นตัวเลขเต็มบวก");
      return;
    }
    if (numNegPoints > remainingScore) {
      setNegError(`คุณมีคะแนนไม่เพียงพอ (มี ${remainingScore.toLocaleString()} คะแนน)`);
      return;
    }
    if (numNegPoints > negativePoints) {
      setNegError(`คุณมี Negative Point เพียง ${negativePoints.toLocaleString()} แต้ม ไม่จำเป็นต้องใช้คะแนนเกินกว่านี้`);
      return;
    }

    setShowNegConfirm(true);
  };

  const confirmNegRedeem = () => {
    redeemNegMutation.mutate({ pointsToDeduct: numNegPoints });
  };

  return (
    <div className="space-y-6">
      {/* Overdue UI */}
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
            <p className="text-sm text-muted-foreground">สูงสุดที่ลดได้จริง</p>
            <p className="mt-2 text-3xl font-bold">
              {Math.min(maxRedeemableMinutes, remainingOverdueMinutes)} นาที
            </p>
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
              max={effectiveMaxPoints}
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
              สูงสุด {effectiveMaxPoints} คะแนน (ลดได้ {Math.min(maxRedeemableMinutes, remainingOverdueMinutes)} นาที)
              {maxUsablePointsByOverdue < maxRedeemablePoints && (
                <span className="block text-amber-600 mt-1">
                  * ถูกจำกัดโดย Overdue ที่เหลืออยู่ ({remainingOverdueMinutes} นาที) ไม่ใช่คะแนนที่มี
                </span>
              )}
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
              ระบบจะหักคะแนนสะสมของคุณบน Leaderboard ทันทีหลังจากการยืนยัน
            </div>
            <Button
              onClick={handleSubmit}
              disabled={redeemMutation.isPending || !data || effectiveMaxPoints <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {redeemMutation.isPending ? "กำลังดำเนินการ..." : "ยืนยันลด Overdue"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Negative Point UI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="size-5 text-red-500" />
            กรอกคะแนนเพื่อลบ Negative Point
          </CardTitle>
          <CardDescription>1 คะแนน = ลบ 1 Negative Point</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="negPoints">จำนวนคะแนนที่ต้องการใช้</Label>
              <span className="text-xs text-muted-foreground">
                Negative Point ปัจจุบัน: <strong className="text-red-600">{negativePoints.toLocaleString()}</strong> แต้ม
              </span>
            </div>
            <Input
              id="negPoints"
              type="number"
              min={1}
              max={maxUsableNegPoints}
              value={negPointsInput}
              onChange={(e) => {
                setNegPointsInput(e.target.value);
                if (negError) setNegError(null);
              }}
              placeholder={maxUsableNegPoints > 0 ? `สูงสุด ${maxUsableNegPoints} คะแนน` : "ไม่สามารถแลกได้ในขณะนี้"}
              disabled={maxUsableNegPoints <= 0}
            />

            {isValidNegInput && !negError && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                ใช้คะแนน <span className="font-semibold">{numNegPoints} คะแนน</span> ➔ ลบ Negative Point ออก <span className="font-semibold text-lg">{numNegPoints} แต้ม</span>
                <span className="block text-xs mt-0.5 text-blue-600">
                  (Negative Point จะเหลือ {Math.max(0, negativePoints - numNegPoints).toLocaleString()} แต้ม)
                </span>
              </div>
            )}
          </div>

          {negError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{negError}</span>
            </div>
          )}
          {negMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {negMessage}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              นำคะแนนสะสมมาลบ Negative Point โดยตรงในอัตรา 1 ต่อ 1
            </div>
            <Button
              onClick={handleNegSubmit}
              disabled={redeemNegMutation.isPending || maxUsableNegPoints <= 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {redeemNegMutation.isPending ? "กำลังดำเนินการ..." : "ยืนยันลบ Negative Point"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Overdue */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการลด Overdue</DialogTitle>
            <DialogDescription>
              กรุณาตรวจสอบข้อมูลก่อนดำเนินการ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
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

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-amber-700 font-medium">จะลด Overdue</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {minutesWillReduce} นาที
              </p>
            </div>

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
              disabled={redeemMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {redeemMutation.isPending ? "กำลังลด Overdue..." : "ยืนยันการลด Overdue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Negative Point */}
      <Dialog open={showNegConfirm} onOpenChange={setShowNegConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ Negative Point</DialogTitle>
            <DialogDescription>
              กรุณาตรวจสอบข้อมูลก่อนดำเนินการ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-gray-50 border p-3">
                <p className="text-muted-foreground text-xs">คะแนนที่จะใช้</p>
                <p className="text-lg font-bold text-red-600">{numNegPoints.toLocaleString()} คะแนน</p>
              </div>
              <div className="rounded-xl bg-gray-50 border p-3">
                <p className="text-muted-foreground text-xs">Negative Point หลังลด</p>
                <p className="text-lg font-bold text-gray-800">{Math.max(0, negativePoints - numNegPoints).toLocaleString()} แต้ม</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNegConfirm(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={confirmNegRedeem}
              disabled={redeemNegMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {redeemNegMutation.isPending ? "กำลังดำเนินการ..." : "ยืนยันการลบ Negative Point"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}