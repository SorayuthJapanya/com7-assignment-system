import { isAuthorize } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🆕 คำนวณ % ปรับคะแนนตามความเร็วในการส่งงาน (Early Bird Bonus)
// ใช้ deadline vs submitAt ของ assignment เดียวกับที่ตาราง Early Bird Bonus ใน Mission Quest ใช้
function calculateEarlyBirdModifier(deadline: Date, submitAt: Date): number {
  const diffDays = (deadline.getTime() - submitAt.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays >= 7) return 0.3;
  if (diffDays >= 3) return 0.2;
  if (diffDays >= 1) return 0.1;
  if (diffDays >= 0) return 0;
  if (diffDays >= -3) return -0.1;
  if (diffDays >= -7) return -0.25;
  return -0.5;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // isAuthorize
    const authResult = await isAuthorize(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const authUser = authResult.user!;
    const assignmentId = (await params).id;

    // Get existing assignment
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // Check if user has permission to update this assignment
    // SUPER_ADMIN and the creator ADMIN can update assignments
    const isAdminCreator =
      authUser.role === "ADMIN" &&
      existingAssignment.createdBy === authUser.username;
    if (authUser.role !== "SUPER_ADMIN" && !isAdminCreator) {
      return NextResponse.json(
        { error: "You are not authorized to update this assignment" },
        { status: 403 },
      );
    }

    // Get request body
    const body = await request.json();
    const { feedback, finalScore = 0, status = "Pending" } = body;

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // Validate status
    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be Pending, Approved, or Rejected" },
        { status: 400 },
      );
    }

    // Validate Score and Status
    if (status === "Approved" && !finalScore) {
      return NextResponse.json(
        { error: "Final Score is Required." },
        { status: 400 },
      );
    }

    // 🆕 คำนวณ Early Bird Bonus — เฉพาะตอน Approved เท่านั้น
    // ไม่แตะ finalScore เดิมเลย เก็บแยกไว้คนละ field เพื่อไม่ให้กระทบของเดิม
    // (Quality King, Perfect Month ที่พึ่ง finalScore ยังคำนวณจากค่าดิบเหมือนเดิมทุกจุด)
    let earlyBirdModifier: number | null = null;
    let adjustedScore: number | null = null;
    if (status === "Approved") {
      earlyBirdModifier = calculateEarlyBirdModifier(assignment.deadline, assignment.submitAt);
      adjustedScore = Math.round(parseInt(finalScore) * (1 + earlyBirdModifier));
    }

    // Update assignment with review details
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        feedback,
        finalScore: parseInt(finalScore), // เดิม ไม่แตะ
        earlyBirdModifier, // 🆕
        adjustedScore, // 🆕
        status: status as "Pending" | "Approved" | "Rejected",
      },
    });

    // Create Score Transaction only for approved assignments
    // (ยังใช้ finalScore ดิบเหมือนเดิม ไม่ปนกับ Early Bird Bonus ตามที่ตกลงไว้)
    let score = null;
    if (status === "Approved") {
      score = await prisma.score.create({
        data: {
          recipient_id: assignment.userId,
          reviewer: authUser.nickname,
          assignment_title: assignment.title,
          score: parseInt(finalScore) || 0,
        },
      });
    }

    return NextResponse.json({
      message: "Assignment reviewed successfully",
      assignment: updatedAssignment,
      score: score,
    });
  } catch (error) {
    console.error("Review assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}