import { isAuthorize } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Update assignment with review details
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        feedback,
        finalScore: parseInt(finalScore),
        status: status as "Pending" | "Approved" | "Rejected",
      },
    });

    // Create Score Transaction only for approved assignments
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
