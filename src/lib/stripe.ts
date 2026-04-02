import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export const STRIPE_PLANS = {
  starter: {
    name: "Starter",
    price: 4900, // cents
    description: "3 activos, scanners básicos",
  },
  professional: {
    name: "Professional",
    price: 14900,
    description: "15 activos, todos los scanners",
  },
  business: {
    name: "Business",
    price: 29900,
    description: "Ilimitado, API, reports con logo",
  },
} as const;

export type StripePlan = keyof typeof STRIPE_PLANS;
