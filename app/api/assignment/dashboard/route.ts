import { isAuthorize } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // isAuthorize
    const authResult = await isAuthorize(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const authUser = authResult.user!;
    const { searchParams } = new URL(request.url);
    
    // Redirect to appropriate route based on user role
    if (authUser.role === "SUPER_ADMIN") {
      // Build admin URL with same query parameters
      const adminUrl = new URL("/api/assignment/dashboard/admin", request.url);
      searchParams.forEach((value, key) => {
        adminUrl.searchParams.set(key, value);
      });
      
      // Forward the request to admin route
      const response = await fetch(adminUrl.toString(), {
        method: "GET",
        headers: request.headers,
      });
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      // Build user URL with same query parameters
      const userUrl = new URL("/api/assignment/dashboard/user", request.url);
      searchParams.forEach((value, key) => {
        userUrl.searchParams.set(key, value);
      });
      
      // Forward the request to user route
      const response = await fetch(userUrl.toString(), {
        method: "GET",
        headers: request.headers,
      });
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

  } catch (error) {
    console.error("Dashboard redirect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
