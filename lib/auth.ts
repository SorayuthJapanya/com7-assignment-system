import { IUser } from "@/types/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

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
    { expiresIn: "7d" },
  );
  return token;
};

export const getUserByUsername = async (username: string) => {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    omit: {
      password: true,
    },
  });
  return user;
};
