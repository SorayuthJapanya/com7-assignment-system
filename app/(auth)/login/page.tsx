"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema, type LoginSchema } from "@/schemas/auth-schema";
import { useLogin } from "@/hooks/use-auth";
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Add useLogin hook
  const { mutateAsync: loginMutation, isPending: isLoginPending } = useLogin();

  const form = useForm({
    resolver: zodResolver(loginSchema as any),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Load remembered credentials on mount
  useEffect(() => {
    const rememberedUsername = localStorage.getItem("rememberedUsername");
    const rememberedPassword = localStorage.getItem("rememberedPassword");

    if (rememberedUsername && rememberedPassword) {
      form.setValue("username", rememberedUsername);
      form.setValue("password", rememberedPassword);
      setTimeout(() => setRememberMe(true), 0);
    }
  }, [form]);

  const onSubmit = async (data: LoginSchema) => {
    const response = await loginMutation(data);

    // Set user to local storage or session storage based on remember me
    localStorage.setItem("authUser", JSON.stringify(response.user));

    // Remember username and password if remember me is checked
    if (rememberMe) {
      localStorage.setItem("rememberedUsername", data.username);
      localStorage.setItem("rememberedPassword", data.password);
    } else {
      localStorage.removeItem("rememberedUsername");
      localStorage.removeItem("rememberedPassword");
    }

    // Redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          <Image
            src="/full-logo.svg"
            alt="COM7 Logo"
            width={150}
            height={75}
            className="p-2 shadow-sm hover:scale-105 active:scale-95 duration-300 rounded-md"
          />
          <div className="flex flex-col">
            <h1 className="text-2xl">Login</h1>
            <p className="font-normal text-muted-foreground">
              Sign in to your account
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FieldGroup className="w-full max-w-56">
              <Field orientation="horizontal">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                />
                <FieldLabel
                  htmlFor="remember-me"
                  className="font-normal text-sm cursor-pointer"
                >
                  Remember me
                </FieldLabel>
              </Field>
            </FieldGroup>

            <Button type="submit" className="w-full" disabled={isLoginPending}>
              {isLoginPending ? <Spinner /> : "Sign in"}
            </Button>

            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <a
                  href="/register"
                  className="font-medium text-primary hover:underline"
                >
                  Register here
                </a>
              </span>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
