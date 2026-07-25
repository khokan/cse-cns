import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const signOutUrl = new URL("/api/auth/sign-out", req.url);
    await fetch(signOutUrl, {
      method: "POST",
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });
    const res = NextResponse.redirect(new URL("/login", req.url));

    allCookies.forEach((c) => {
      if (c.name.includes("auth") || c.name.includes("session")) {
        res.cookies.set(c.name, "", {
          path: "/",
          maxAge: 0,
        });

        res.cookies.set(c.name, "", {
          maxAge: 0,
        });
      }
    });

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      { error: "Logout failed", details: message },
      { status: 500 }
    );
  }
}