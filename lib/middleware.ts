import { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "./prisma";
import { JWTPayload } from "@/types/auth";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

// เก็บไว้ใน const ตัวใหม่ที่ TS มั่นใจว่าเป็น string แน่นอน (non-null)
const SECRET: string = JWT_SECRET;

export async function isAuthorize(request: NextRequest) {
  const token = request.cookies.get("authorize")?.value;

  if (!token) {
    return { error: "Unauthorize", status: 401 };
  }

  try {
    const decoded = jwt.verify(token, SECRET) as unknown as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return { error: "Unauthorize", status: 401 };
    }

    return { user, error: null };
  } catch (err) {
    console.error("JWT verify failed:", err);
    return { error: "Unauthorize", status: 401 };
  }
}