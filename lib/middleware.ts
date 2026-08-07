import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { JWTPayload } from "@/types/auth";

export async function isAuthorize(request: NextRequest) {
  const token = request.cookies.get("authorize")?.value;

  if (!token) {
    return { error: "Unauthorize", status: 401 };
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret",
    ) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return { error: "Unauthorize", status: 401 };
    }

    return { user, error: null };
  } catch {
    return { error: "Unauthorize", status: 401 };
  }
}