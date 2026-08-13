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
  isStaff: boolean; 
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
  const isStaff = user?.role === "STAFF"; // 
  const isIntern = user?.role === "INTERN";

  useEffect(() => {
    let isMounted = true;

    const clearCachedUser = () => {
      localStorage.removeItem("authUser");
      sessionStorage.removeItem("authUser");
    };

    const initAuth = async () => {
      let cachedUser: AuthUser | null = null;
      try {
        const authUserStr = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");
        if (authUserStr) {
          cachedUser = JSON.parse(authUserStr) as AuthUser;
        }
      } catch (error) {
        console.error("Failed to parse auth user:", error);
        clearCachedUser();
      }

      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!isMounted) return;

        if (response.ok) {
          const body = await response.json();
          const authenticatedUser = body.data as AuthUser;
          setUser(authenticatedUser);
          localStorage.setItem("authUser", JSON.stringify(authenticatedUser));
        } else if (response.status === 401) {
          clearCachedUser();
          setUser(null);
        } else {
          // Keep the cached profile during a temporary server/database outage.
          setUser(cachedUser);
        }
      } catch (error) {
        console.error("Failed to validate auth session:", error);
        if (isMounted) setUser(cachedUser);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSetUser = (newUser: AuthUser | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("authUser", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("authUser");
      sessionStorage.removeItem("authUser");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authUser");
    sessionStorage.removeItem("authUser");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isSuperAdmin,
        isAdmin,
        isStaff, 
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
