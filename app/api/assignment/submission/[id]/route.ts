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
    const file = formData.get("file") as File | null;

    const assignmentId = (await params).id;

    // ตรวจสอบว่า file มีจริงและไม่ใช่ empty File object
    // (บาง browser ส่ง empty File มาแทน null ถ้า input ว่าง)
    const hasFile = file && file instanceof File && file.size > 0;

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

    // Upload file to Cloudinary เฉพาะเมื่อมีไฟล์แนบมา
    let uploadResult = null;
    if (hasFile) {
      try {
        uploadResult = await uploadFile(file as File, "assignment-submissions");
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
      console.log(uploadResult);
    }

    // Update assignment with submission details
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        // ถ้าไม่มีไฟล์ใหม่ ให้คงค่า submissionUrl เดิมไว้ (ไม่ทับด้วย null)
        ...(uploadResult ? { submissionUrl: uploadResult.url } : {}),
        submitAt: new Date(),
        status: "Pending",
        feedback: "",
      },
    });

    return NextResponse.json({
      message: "Assignment submitted successfully",
      assignment: updatedAssignment,
      file: uploadResult
        ? {
            url: uploadResult.url,
            size: uploadResult.size,
            format: uploadResult.format,
          }
        : null,
    });
  } catch (error) {
    console.error("Submission assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}