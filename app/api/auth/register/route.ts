import { generateToken, hashPassword } from "@/lib/auth";
import { prisma } from "../../../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const {
      username,
      password,
      email,
      nickname,
      role = "STAFF",
    } = await request.json();

    // Basic validation
    if (!username || !password || !email || !nickname) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Validate Password
    if (password.length < 5) {
      return NextResponse.json(
        { error: "Password must be at least 5 characters long" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        nickname,
        role: role.toUpperCase(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken(user);

    const response = NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 },
    );

    response.cookies.set("authorize", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
