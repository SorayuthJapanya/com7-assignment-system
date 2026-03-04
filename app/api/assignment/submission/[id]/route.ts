import { isAuthorize } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/cloudinary";

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

    // Parse form data for file upload
    const formData = await request.formData();
    const file = formData.get("file") as File;

    const assignmentId = (await params).id;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 },
      );
    }

    // Check if assignment exists and user has permission
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // Check if user is assigned to this assignment or is SUPER_ADMIN
    if (authUser.role !== "SUPER_ADMIN" && assignment.userId !== authUser.id) {
      return NextResponse.json(
        { error: "You are not authorized to submit this assignment" },
        { status: 403 },
      );
    }

    // Upload file to Cloudinary
    let uploadResult;
    try {
      uploadResult = await uploadFile(file, "assignment-submissions");
    } catch (uploadError) {
      return NextResponse.json(
        {
          error:
            uploadError instanceof Error
              ? uploadError.message
              : "File upload failed",
        },
        { status: 400 },
      );
    }

    // Update assignment with submission details
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        submissionUrl: uploadResult.url,
        submitAt: new Date(),
        status: "Pending",
      },
    });

    return NextResponse.json({
      message: "Assignment submitted successfully",
      assignment: updatedAssignment,
      file: {
        url: uploadResult.url,
        size: uploadResult.size,
        format: uploadResult.format,
      },
    });
  } catch (error) {
    console.error("Submission assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
