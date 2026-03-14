import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(5, "Password must be at least 5 characters"),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(5, "Password must be at least 5 characters"),
  confirmPassword: z.string().min(5, "Password must be at least 5 characters"),
  nickname: z.string().min(2, "Nickname must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
