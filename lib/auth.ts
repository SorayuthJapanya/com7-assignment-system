import { IUser } from "@/types/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";


export const AUTH_TOKEN_EXPIRES_IN = "7d";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export const hashPassword = async (password: string) => {
  const hashedPassword = await bcrypt.hash(password, 12);
  return hashedPassword;
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user: IUser) => {
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
    },
    process.env.JWT_SECRET || "fallback-secret",
    { expiresIn: AUTH_TOKEN_EXPIRES_IN },
  );
  return token;
};
