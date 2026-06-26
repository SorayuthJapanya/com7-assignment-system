import { isAuthorize } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/sendMail";
import { getUserByUsername } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewAssignmentTemplate } from "@/template/new-assignment-template";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const userId = authUser.id;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const type = searchParams.get("type") || "all";
    const myAssignments = searchParams.get("myAssignments") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const username = searchParams.get("username") || "";
    const deadlineMonth = searchParams.get("deadlineMonth") || "";
    const deadlineFrom = searchParams.get("deadlineFrom") || "";
    const deadlineTo = searchParams.get("deadlineTo") || "";

    // Build where clause
    const where: Record<string, unknown> = {};

    // Add search filter for title
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { assignTo: { contains: search, mode: "insensitive" } },
        { createdBy: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add userId filter
    if (userId && myAssignments) {
      where.userId = userId;

      // Filter assignments created after resetAt (if user has been reset)
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { resetAt: true },
      });
      if (currentUser?.resetAt) {
        where.createdAt = { gt: currentUser.resetAt };
      }
    }

    // Role-based filtering: ADMINs only see assignments they created
    if (authUser.role === "ADMIN") {
      where.createdBy = authUser.username;
    }

    // Add status filter
    if (status !== "all") {
      if (status === "not-submit") {
        const notSubmitOr = [
          { submissionUrl: "" },
          {
            feedback: { not: "" },
            status: { not: "Approved" },
          },
        ];

        if (where.OR) {
          where.AND = [
            { OR: where.OR as unknown[] },
            { OR: notSubmitOr },
          ];
          delete where.OR;
        } else {
          where.OR = notSubmitOr;
        }
      } else if (status === "Pending") {
        where.submissionUrl = { not: "" };
        where.status = "Pending";
        where.feedback = "";
      } else {
        where.status = status;
      }
    }

    // Add type filter
    if (type !== "all") {
      where.type = type;
    }

    // Username filter — SUPER_ADMIN only
    if (username && authUser.role === "SUPER_ADMIN") {
      where.assignTo = { contains: username, mode: "insensitive" };
    }

    // Deadline month filter
    if (deadlineMonth) {
      const month = parseInt(deadlineMonth);
      const year = new Date().getFullYear();
      where.deadline = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    }

    // Deadline range filter
    if (deadlineFrom || deadlineTo) {
      const deadlineFilter: Record<string, unknown> = {};
      if (deadlineFrom) {
        deadlineFilter.gte = new Date(deadlineFrom);
      }
      if (deadlineTo) {
        const toDate = new Date(deadlineTo);
        toDate.setHours(23, 59, 59, 999);
        deadlineFilter.lte = toDate;
      }
      where.deadline = deadlineFilter;
    }

    // Get total count for pagination
    const totalCount = await prisma.assignment.count({ where });

    // Get assignments with pagination
    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: {
        deadline: "asc",
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      assignments,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get assignments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // isAuthorize
    const authResult = await isAuthorize(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    // Get user
    const authUser = authResult.user!;

    if (authUser.role !== "SUPER_ADMIN" && authUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You are not allowed to create assignment" },
        { status: 401 },
      );
    }

    // Get body
    const body = await request.json();

    // Check body
    const { title, description, type, assignTo, reward, deadline } = body;

    // Check type
    if (!["Individual", "Group"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type, must be Individual or Group" },
        { status: 400 },
      );
    }

    // Check assignTo
    if (assignTo.length === 0) {
      return NextResponse.json(
        { error: "Assign to is required" },
        { status: 400 },
      );
    }

    const mailPromises: Promise<unknown>[] = [];

    for (const username of assignTo) {
      // Get user by username
      const user = await getUserByUsername(username);
      if (!user) {
        return NextResponse.json(
          { error: `User not found: ${username}` },
          { status: 404 },
        );
      }

      // Get full user with email
      const fullUser = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          email: true,
          nickname: true,
          role: true,
        },
      });

      if (!fullUser) {
        return NextResponse.json(
          { error: `User not found: ${username}` },
          { status: 404 },
        );
      }

      // Create assignment with assigned users
      await prisma.assignment.create({
        data: {
          title,
          description,
          type: type as "Individual" | "Group",
          userId: fullUser.id,
          createdBy: authUser.username,
          reward: parseInt(reward),
          deadline: new Date(deadline),
          assignTo: fullUser.username,
          members: assignTo,
        },
      });

      console.log(`Assign to ${fullUser.nickname} successfully`);

      const url = `${process.env.NEXT_PUBLIC_API_URL}/assignment`;
      mailPromises.push(
        sendMail({
          to: fullUser.email,
          subject: `New Assignment: ${title}`,
          html: NewAssignmentTemplate({
            username: fullUser.username,
            type,
            title,
            description,
            reward: parseInt(reward),
            formattedDeadline: format(new Date(deadline), "dd/MM/yyyy HH:mm"),
            url,
          }),
        }),
      );
    }

    await Promise.all(mailPromises);

    return NextResponse.json({
      message: "All Assignment created successfully",
    });
  } catch (error) {
    console.error("Create assignments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
