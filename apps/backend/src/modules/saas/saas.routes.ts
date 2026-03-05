import Elysia, { t } from "elysia";
import { requireRole } from "../../middleware/auth.middleware";
import { constructWebhookEvent } from "../../lib/stripe";
import * as SaasService from "./saas.service";
import { AppError } from "../../lib/errors";
import { ok as okRes } from "../../lib/response";
import { Role } from "@fleet/shared";
import type { CheckoutPlan } from "./saas.plans";

function handleError(e: unknown, set: any) {
  if (e instanceof AppError) {
    set.status = e.statusCode;
    return {
      success: false,
      error: { code: e.code, message: e.message, statusCode: e.statusCode },
    };
  }
  console.error("[SaasRoute]", e);
  set.status = 500;
  return {
    success: false,
    error: { code: "INTERNAL", message: "Something went wrong", statusCode: 500 },
  };
}

// ─── Webhook route (no auth — raw body required) ──────────────────────────────

export const stripeWebhookRoute = new Elysia()
  .post(
    "/api/v1/saas/webhook",
    async ({ request, set }) => {
      const signature = request.headers.get("stripe-signature");
      if (!signature) {
        set.status = 400;
        return { error: "Missing stripe-signature header" };
      }

      const rawBody = await request.text();

      try {
        const event = constructWebhookEvent(rawBody, signature);
        await SaasService.handleWebhook(event);
        return { received: true };
      } catch (err: any) {
        console.error("[Webhook]", err.message);
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      detail: {
        tags:    ["SaaS"],
        summary: "Stripe webhook handler",
      },
    }
  );

// ─── Protected SaaS routes ────────────────────────────────────────────────────

export const saasRoutes = new Elysia({ prefix: "/saas" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  // GET /saas/subscription
  .get(
    "/subscription",
    async ({ user, set }) => {
      try {
        return okRes(await SaasService.getSubscription(user));
      } catch (e) { return handleError(e, set); }
    },
    {
      detail: {
        tags:     ["SaaS"],
        summary:  "Get current subscription + usage vs limits",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // POST /saas/checkout
  .post(
    "/checkout",
    async ({ user, body, set }) => {
      try {
        const origin = process.env.FRONTEND_URL ?? "http://localhost:5173";
        return okRes(
          await SaasService.createCheckout(user, body.plan as CheckoutPlan, origin)
        );
      } catch (e) { return handleError(e, set); }
    },
    {
      body: t.Object({
        plan: t.Union([
          t.Literal("STARTER"),
          t.Literal("PRO"),
          t.Literal("ENTERPRISE"),
        ]),
      }),
      detail: {
        tags:     ["SaaS"],
        summary:  "Create Stripe checkout session",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // POST /saas/portal
  .post(
    "/portal",
    async ({ user, set }) => {
      try {
        const origin = process.env.FRONTEND_URL ?? "http://localhost:5173";
        return okRes(await SaasService.createPortalSession(user, origin));
      } catch (e) { return handleError(e, set); }
    },
    {
      detail: {
        tags:     ["SaaS"],
        summary:  "Create Stripe customer portal session",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // DELETE /saas/subscription
  .delete(
    "/subscription",
    async ({ user, set }) => {
      try {
        return okRes(await SaasService.cancelSubscription(user));
      } catch (e) { return handleError(e, set); }
    },
    {
      detail: {
        tags:     ["SaaS"],
        summary:  "Cancel subscription at period end",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // GET /saas/invoices
  .get(
    "/invoices",
    async ({ user, set }) => {
      try {
        return okRes(await SaasService.getStripeInvoices(user));
      } catch (e) { return handleError(e, set); }
    },
    {
      detail: {
        tags:     ["SaaS"],
        summary:  "List Stripe billing invoices",
        security: [{ bearerAuth: [] }],
      },
    }
  );
