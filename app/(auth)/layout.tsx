import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Authentication | COM7 Assignment System",
  description: "Login or register to access the assignment system",
  icons: {
    icon: "/logo.svg",
  },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`w-full min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 ${inter.variable}`}>
      {children}
    </div>
  );
}
