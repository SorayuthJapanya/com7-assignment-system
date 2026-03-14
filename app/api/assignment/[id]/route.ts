import { isAuthorize } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    // Get assignment by ID
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // Check if user has permission to view this assignment
    // Allow SUPER_ADMIN or the assigned user to view
    if (authUser.role !== "SUPER_ADMIN" && assignment.userId !== authUser.id) {
      return NextResponse.json(
        { error: "You are not authorized to view this assignment" },
        { status: 403 },
      );
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Get assignment by ID error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
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
    // Only SUPER_ADMIN can update assignments
    if (authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "You are not authorized to update this assignment" },
        { status: 403 },
      );
    }

    // Get body
    const body = await request.json();
    const { title, description, type, reward, deadline, status } = body;

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(type && { type: type as "Individual" | "Group" }),
        ...(reward && { reward }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(status && {
          status: status as "Pending" | "Approved" | "Rejected",
        }),
      },
    });

    return NextResponse.json({
      message: "Assignment updated successfully",
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("Update assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    // Check if user has permission to delete this assignment
    // Only SUPER_ADMIN can delete assignments
    if (authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "You are not authorized to delete this assignment" },
        { status: 403 },
      );
    }

    // Delete assignment
    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
