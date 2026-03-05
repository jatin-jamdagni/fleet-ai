import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");

  _stripe = new Stripe(key, {
    apiVersion: "2026-02-25.clover",
    typescript:  true,
  });

  return _stripe;
}

export function constructWebhookEvent(
  payload:   string | Buffer,
  signature: string
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");

  return getStripe().webhooks.constructEvent(payload, signature, secret);
}