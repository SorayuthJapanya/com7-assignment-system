import { isAuthorize } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/sendMail";
import { getUserByUsername } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface UserWithEmail {
  id: string;
  username: string;
  email: string;
  nickname: string;
  role: string;
}

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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Add search filter for title
    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Add userId filter
    if (userId && authUser.role !== "SUPER_ADMIN") {
      where.userId = userId;
    }

    // Get total count for pagination
    const totalCount = await prisma.assignment.count({ where });

    // Get assignments with pagination
    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: {
        createdAt: "desc",
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

    if (authUser.role !== "SUPER_ADMIN") {
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
        },
      });

      console.log(`Assign to ${fullUser.nickname} successfully`);

      // Send mail to all assigned users
      // const mailPromises = assignedUsers.map(async (user: UserWithEmail) => {
      //   const result = await sendMail({
      //     to: user.email,
      //     subject: `New Assignment: ${title}`,
      //     html: `
      //       <h2>New Assignment Created</h2>
      //       <p><strong>Title:</strong> ${title}</p>
      //       <p><strong>Description:</strong> ${description}</p>
      //       <p><strong>Type:</strong> ${type}</p>
      //       <p><strong>Deadline:</strong> ${deadline}</p>
      //       <p><strong>Reward:</strong> ${reward}</p>
      //       <p>Assigned by: ${authUser.username}</p>
      //     `,
      //   });
      //   return result;
      // });

      // await Promise.all(mailPromises);
    }

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
