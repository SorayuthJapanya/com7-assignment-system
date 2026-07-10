"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthUser {
  id: string;
  username: string;
  nickname: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF" | "INTERN";
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isIntern: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const isIntern = user?.role === "INTERN";

  useEffect(() => {
    // Only run on client side
    const initAuth = () => {
      try {
        const authUserStr = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");
        if (authUserStr) {
          const parsedUser = JSON.parse(authUserStr);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Failed to parse auth user:", error);
        localStorage.removeItem("authUser");
        sessionStorage.removeItem("authUser");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleSetUser = (newUser: AuthUser | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("authUser", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("authUser");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authUser");
  };

  return (
        <AuthContext.Provider
      value={{
        user,
        isSuperAdmin,
        isAdmin,
        isIntern,
        isLoading,
        setUser: handleSetUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Backward compatibility hooks
export const useAuthUser = (): AuthUser | null => {
  const { user, isLoading } = useAuth();
  // Return null during loading to prevent hydration mismatch
  return isLoading ? null : user;
};

export const useIsSuperAdmin = (): { isSuperAdmin: boolean; isLoading: boolean } => {
  const { isSuperAdmin, isLoading } = useAuth();
  // Return false during loading to prevent hydration mismatch
  return { isSuperAdmin, isLoading };
};

export const useIsAdmin = (): boolean => {
  const { isAdmin, isLoading } = useAuth();
  return isLoading ? false : isAdmin;
};
