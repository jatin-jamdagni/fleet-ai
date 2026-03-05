import { prisma } from "../../db/prisma";
import { getStripe } from "../../lib/stripe";
import { AppError } from "../../lib/errors";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";
import {
  PLANS,
  STRIPE_PRICE_IDS,
  getPlanFromPriceId,
  getPlanLimits,
  isCheckoutPlan,
  TRIAL_DAYS,
  toPersistedPlan,
  toPublicPlan,
  type CheckoutPlan,
  type PlanName,
} from "./saas.plans";
import { getUsageSummary } from "./saas.usage";
import type Stripe from "stripe";
import { PlanStatus } from "../../generated/prisma/enums";

// ─── Get current subscription status ─────────────────────────────────────────

export async function getSubscription(user: UserContext) {
  return injectTenantContext(user, async () => {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: user.tenantId },
      select: {
        plan:                true,
        planStatus:          true,
        trialEndsAt:         true,
        currentPeriodEnd:    true,
        cancelAtPeriodEnd:   true,
        stripeCustomerId:    true,
        stripeSubscriptionId: true,
      },
    });

    const limits  = getPlanLimits(tenant.plan as PlanName);
    const usage   = await getUsageSummary(user.tenantId, tenant.plan as PlanName);
    const isTrialExpired = tenant.trialEndsAt
      ? new Date() > tenant.trialEndsAt
      : false;

    return {
      plan:              toPublicPlan(tenant.plan as PlanName),
      planStatus:        tenant.planStatus,
      trialEndsAt:       tenant.trialEndsAt,
      trialDaysLeft:     tenant.trialEndsAt
        ? Math.max(0, Math.ceil(
            (tenant.trialEndsAt.getTime() - Date.now()) / 86_400_000
          ))
        : null,
      isTrialExpired,
      currentPeriodEnd:  tenant.currentPeriodEnd,
      cancelAtPeriodEnd: tenant.cancelAtPeriodEnd,
      hasStripe:         !!tenant.stripeCustomerId,
      limits,
      usage,
      prices: {
        starter:    STRIPE_PRICE_IDS.STARTER,
        pro:        STRIPE_PRICE_IDS.PRO,
        enterprise: STRIPE_PRICE_IDS.ENTERPRISE,
      },
      planFeatures: PLANS,
    };
  });
}

// ─── Create Stripe checkout session ──────────────────────────────────────────

export async function createCheckout(
  user:    UserContext,
  plan:    CheckoutPlan,
  returnUrl: string
) {
  return injectTenantContext(user, async () => {
    const priceId = STRIPE_PRICE_IDS[plan];
    if (!priceId) {
      throw new AppError("INVALID_PLAN", `Price not configured for plan: ${plan}`, 400);
    }

    const stripe = getStripe();
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: user.tenantId },
      select: { stripeCustomerId: true, name: true },
    });

    // Get or create Stripe customer
    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name:     tenant.name,
        email:    user.email,
        metadata: {
          tenantId: user.tenantId,
          plan,
        },
      });
      customerId = customer.id;

      await prisma.tenant.update({
        where: { id: user.tenantId },
        data:  { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      mode:                 "subscription",
      payment_method_types: ["card"],
      line_items: [{
        price:    priceId,
        quantity: 1,
      }],
      subscription_data: {
        trial_period_days: 0, // Already in trial via our own system
        metadata: {
          tenantId: user.tenantId,
          plan,
        },
      },
      success_url: `${returnUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${returnUrl}/billing?canceled=true`,
      metadata: {
        tenantId: user.tenantId,
        plan,
      },
    });

    return { url: session.url, sessionId: session.id };
  });
}

// ─── Create customer portal session ──────────────────────────────────────────

export async function createPortalSession(
  user:      UserContext,
  returnUrl: string
) {
  return injectTenantContext(user, async () => {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where:  { id: user.tenantId },
      select: { stripeCustomerId: true },
    });

    if (!tenant.stripeCustomerId) {
      throw new AppError("NO_STRIPE_CUSTOMER", "No billing account found. Subscribe first.", 400);
    }

    const stripe  = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer:   tenant.stripeCustomerId,
      return_url: `${returnUrl}/billing`,
    });

    return { url: session.url };
  });
}

// ─── Handle Stripe webhook ────────────────────────────────────────────────────

export async function handleWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {

    case "checkout.session.completed": {
      const session   = event.data.object as Stripe.Checkout.Session;
      const tenantId  = session.metadata?.tenantId;
      const checkoutPlan = session.metadata?.plan;

      if (!tenantId || !isCheckoutPlan(checkoutPlan)) return;
      const plan = toPersistedPlan(checkoutPlan);

      await prisma.tenant.update({
        where: { id: tenantId },
        data:  {
          plan,
          planStatus:          PlanStatus.ACTIVE,
          stripeSubscriptionId: session.subscription as string,
          trialEndsAt:          null,
        },
      });

      console.log(`[Stripe] ✅ Checkout completed — tenant ${tenantId} → ${plan}`);
      break;
    }

    case "customer.subscription.updated": {
      const sub      = event.data.object as Stripe.Subscription;
      const tenantId = sub.metadata?.tenantId;
      if (!tenantId) return;

      const priceId  = sub.items.data[0]?.price.id;
      const plan     = getPlanFromPriceId(priceId ?? "");

      await prisma.tenant.update({
        where: { id: tenantId },
        data:  {
          plan,
          planStatus:        mapSubStatus(sub.status),
          currentPeriodEnd:  (sub as any).current_period_end
            ? new Date((sub as any).current_period_end * 1000)
            : null,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });

      console.log(`[Stripe] ↑ Subscription updated — tenant ${tenantId} → ${plan} (${sub.status})`);
      break;
    }

    case "customer.subscription.deleted": {
      const sub      = event.data.object as Stripe.Subscription;
      const tenantId = sub.metadata?.tenantId;
      if (!tenantId) return;

      await prisma.tenant.update({
        where: { id: tenantId },
        data:  {
          plan:       "TRIAL",
          planStatus: PlanStatus.CANCELED,
          stripeSubscriptionId: null,
          cancelAtPeriodEnd:    false,
        },
      });

      console.log(`[Stripe] ✗ Subscription canceled — tenant ${tenantId} downgraded to TRIAL`);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice  = event.data.object as any;
      const tenantId = invoice.subscription_details?.metadata?.tenantId
                    ?? invoice.metadata?.tenantId;
      if (!tenantId) return;

      await prisma.tenant.update({
        where: { id: tenantId },
        data:  { planStatus: PlanStatus.ACTIVE },
      });

      console.log(`[Stripe] 💰 Payment succeeded — tenant ${tenantId}`);
      break;
    }

    case "invoice.payment_failed": {
      const invoice  = event.data.object as any;
      const tenantId = invoice.subscription_details?.metadata?.tenantId
                    ?? invoice.metadata?.tenantId;
      if (!tenantId) return;

      await prisma.tenant.update({
        where: { id: tenantId },
        data:  { planStatus: PlanStatus.PAST_DUE },
      });

      console.log(`[Stripe] ⚠️  Payment failed — tenant ${tenantId} marked PAST_DUE`);
      break;
    }
  }
}

// ─── Cancel subscription ──────────────────────────────────────────────────────

export async function cancelSubscription(user: UserContext) {
  return injectTenantContext(user, async () => {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where:  { id: user.tenantId },
      select: { stripeSubscriptionId: true },
    });

    if (!tenant.stripeSubscriptionId) {
      throw new AppError("NO_SUBSCRIPTION", "No active subscription to cancel.", 400);
    }

    const stripe = getStripe();
    await stripe.subscriptions.update(tenant.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.tenant.update({
      where: { id: user.tenantId },
      data:  { cancelAtPeriodEnd: true },
    });

    return { message: "Subscription will be canceled at the end of the billing period." };
  });
}

// ─── Get Stripe invoice history ───────────────────────────────────────────────

export async function getStripeInvoices(user: UserContext) {
  return injectTenantContext(user, async () => {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where:  { id: user.tenantId },
      select: { stripeCustomerId: true },
    });

    if (!tenant.stripeCustomerId) return [];

    const stripe   = getStripe();
    const invoices = await stripe.invoices.list({
      customer: tenant.stripeCustomerId,
      limit:    24,
    });

    return invoices.data.map((inv) => ({
      id:          inv.id,
      number:      inv.number,
      status:      inv.status,
      amount:      (inv.amount_paid / 100).toFixed(2),
      currency:    inv.currency.toUpperCase(),
      period:      new Date(inv.period_start * 1000).toLocaleDateString("en-US", {
        month: "short", year: "numeric",
      }),
      pdfUrl:      inv.invoice_pdf,
      hostedUrl:   inv.hosted_invoice_url,
      createdAt:   new Date(inv.created * 1000).toISOString(),
    }));
  });
}

// ─── Seed trial on register ───────────────────────────────────────────────────

export async function startTrial(tenantId: string): Promise<void> {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  await prisma.tenant.update({
    where: { id: tenantId },
    data:  {
      plan:        "TRIAL",
      planStatus:  PlanStatus.TRIALING,
      trialEndsAt,
    },
  });
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function mapSubStatus(status: Stripe.Subscription.Status) {
  const map: Record<string, (typeof PlanStatus)[keyof typeof PlanStatus]> = {
    active:            PlanStatus.ACTIVE,
    trialing:          PlanStatus.TRIALING,
    past_due:          PlanStatus.PAST_DUE,
    canceled:          PlanStatus.CANCELED,
    unpaid:            PlanStatus.PAST_DUE,
    incomplete:        PlanStatus.PAST_DUE,
    incomplete_expired: PlanStatus.CANCELED,
    paused:            PlanStatus.PAST_DUE,
  };
  return map[status] ?? PlanStatus.ACTIVE;
}
