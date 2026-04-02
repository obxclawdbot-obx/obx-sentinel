import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;
        const plan = session.metadata?.plan;

        if (organizationId && plan) {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              plan,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
            },
          });
          console.log(`[Stripe Webhook] Organization ${organizationId} upgraded to ${plan}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find org by Stripe customer ID
        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (org) {
          // Determine plan from subscription metadata or keep current
          const plan = subscription.metadata?.plan || org.plan;
          await prisma.organization.update({
            where: { id: org.id },
            data: { plan },
          });
          console.log(`[Stripe Webhook] Subscription updated for org ${org.id}: ${plan}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              plan: "starter",
              stripeSubscriptionId: null,
            },
          });
          console.log(`[Stripe Webhook] Subscription cancelled for org ${org.id}, downgraded to starter`);
        }
        break;
      }
    }
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
