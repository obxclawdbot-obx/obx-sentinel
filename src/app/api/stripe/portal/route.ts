import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
    });

    if (!org?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No hay suscripción activa" },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("[Stripe Portal Error]", error);
    return NextResponse.json(
      { error: "Error al abrir el portal de facturación" },
      { status: 500 }
    );
  }
}
