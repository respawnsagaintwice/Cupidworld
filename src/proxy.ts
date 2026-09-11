import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Protected routes requiring authentication
const protectedRoutes = [
  "/home",
  "/memories",
  "/calendar",
  "/story",
  "/notes",
  "/settings",
];

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, check for client fallback session cookie
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtected) {
      const hasAuthCookie = request.cookies.get("our_world_auth")?.value;
      if (!hasAuthCookie) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
      }
    }
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Authoritative user verification via Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If unauthenticated and accessing a protected route, redirect to login
  if (isProtected && !user) {
    const hasAuthCookie = request.cookies.get("our_world_auth")?.value;
    if (!hasAuthCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
