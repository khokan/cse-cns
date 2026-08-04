import { cookies } from "next/headers";
import { env } from "process";
import { NextResponse } from "next/server";

const AUTH_API = env.AUTH_URL;

if (!AUTH_API) {
  console.warn("AUTH_URL environment variable is not set");
}

export async function GET() {
  try {
    const cookieStore = await cookies();

    const res = await fetch(`${AUTH_API}/get-session`, {
      headers: { Cookie: cookieStore.toString() },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { data: null, error: { message: "session is missing" } },
        { status: 401 }
      );
    }

    const payload = await res.json();
    const session = payload?.user ? payload : payload?.data ?? null;

    if (!session?.user) {
      return NextResponse.json(
        { data: null, error: { message: "session is missing" } },
        { status: 401 }
      );
    }

    return NextResponse.json({ data: session, error: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { data: null, error: { message: "something went wrong" } },
      { status: 500 }
    );
  }
}
