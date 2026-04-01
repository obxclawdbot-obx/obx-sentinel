import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret");

const protectedPaths = ["/dashboard", "/assets", "/findings", "/scans", "/alerts", "/settings"];
const authApiPaths = ["/api/dashboard", "/api/assets", "/api/findings", "/api/scan", "/api/alerts", "/api/settings", "/api/auth/password"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if path needs protection
  const isProtectedPage = protectedPaths.some((p) => pathname.startsWith(p));
  const isProtectedApi = authApiPaths.some((p) => pathname.startsWith(p));

  if (!isProtectedPage && !isProtectedApi) return NextResponse.next();

  const token = req.cookies.get("session-token")?.value;

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assets/:path*",
    "/findings/:path*",
    "/scans/:path*",
    "/alerts/:path*",
    "/settings/:path*",
    "/api/dashboard/:path*",
    "/api/assets/:path*",
    "/api/findings/:path*",
    "/api/scan/:path*",
    "/api/alerts/:path*",
    "/api/settings/:path*",
    "/api/auth/password/:path*",
  ],
};
