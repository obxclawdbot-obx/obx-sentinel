import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, organizationName } = await req.json();

    if (!email || !password || !name || !organizationName) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

    const organization = await prisma.organization.create({
      data: {
        name: organizationName,
        slug: `${slug}-${Date.now().toString(36)}`,
        plan: "basico",
      },
    });

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "admin",
        organizationId: organization.id,
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
