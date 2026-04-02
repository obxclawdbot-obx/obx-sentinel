import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { stripe, STRIPE_PLANS, StripePlan } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { plan } = (await req.json()) as { plan: string };

    if (!plan || !(plan in STRIPE_PLANS)) {
      return NextResponse.json({ error: "Plan no válido" }, { status: 400 });
    }

    const planConfig = STRIPE_PLANS[plan as StripePlan];
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: session.email,
      metadata: {
        organizationId: session.organizationId,
        userId: session.id,
        plan,
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: planConfig.price,
            product_data: {
              name: `OBX Sentinel — ${planConfig.name}`,
              description: planConfig.description,
            },
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?upgraded=true`,
      cancel_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[Stripe Checkout Error]", error);
    return NextResponse.json(
      { error: "Error al crear la sesión de pago" },
      { status: 500 }
    );
  }
}
