import { isAuthorize } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/sendMail";
import { NewAssignmentTemplate } from "@/template/new-assignment-template";
import { format } from "date-fns";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await isAuthorize(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authUser = authResult.user!;
    if (authUser.role !== "SUPER_ADMIN" && authUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { deadline } = body;

    if (!deadline) {
      return NextResponse.json({ error: "New deadline is required." }, { status: 400 });
    }

    const original = await prisma.assignment.findUnique({ where: { id } });
    if (!original) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    // Get the assigned user
    const assignedUser = await prisma.user.findFirst({
      where: { username: original.assignTo },
    });

    if (!assignedUser) {
      return NextResponse.json({ error: "Assigned user not found." }, { status: 404 });
    }

    const newDeadline = new Date(deadline);

    const newAssignment = await prisma.assignment.create({
      data: {
        userId: assignedUser.id,
        title: original.title,
        description: original.description,
        type: original.type,
        createdBy: authUser.username,
        assignTo: original.assignTo,
        members: original.members,
        reward: original.reward,
        deadline: newDeadline,
        submissionUrl: "",
        feedback: "",
        finalScore: 0,
        status: "Pending",
      },
    });

    // Send email notification to assigned user
    await sendMail({
      to: assignedUser.email,
      subject: `New Assignment: ${original.title}`,
      html: NewAssignmentTemplate({
        username: assignedUser.username,
        type: original.type,
        title: original.title,
        description: original.description ?? "",
        reward: original.reward,
        formattedDeadline: format(newDeadline, "dd/MM/yyyy HH:mm"),
        url: `${process.env.NEXT_PUBLIC_APP_URL}/assignment`,
      }),
    });

    return NextResponse.json({
      message: "Assignment rebuilt successfully",
      assignment: newAssignment,
    }, { status: 201 });
  } catch (error) {
    console.error("Rebuild assignment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
