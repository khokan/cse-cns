import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { userService } from "./services/user.service";


export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ======================= VERIFY SESSION =======================

  // ======================= CHECK PATHS & GIVE PERMISSIONS =======================


  let isAuthenticated = false;
  const { data } = await userService.getSession();
  const user = data?.user;
  console.log("Middleware session data:", data , request.url);


  if (user) {
    isAuthenticated = true;
  }

  //* User in not authenticated at all
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if(isAuthenticated && user.role === "ADMIN" && pathname.startsWith("/dashboard")){
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/dashboard/:path*",
    "/change-password",
    "/my-profile",
    "/reports/:path*",
  ],

};