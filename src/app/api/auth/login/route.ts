import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret");

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(SECRET);

    const res = NextResponse.json({ ok: true, user: { name: user.name, email: user.email } });
    res.cookies.set("session-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e: any) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
