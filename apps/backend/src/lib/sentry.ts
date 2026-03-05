import * as Sentry from "@sentry/bun";

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log("[Sentry] No SENTRY_DSN set — skipping");
    return;
  }

  Sentry.init({
    dsn,
    environment:  process.env.NODE_ENV ?? "development",
    release:      process.env.npm_package_version,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
    integrations: [
      Sentry.prismaIntegration(),
    ],
  });

  console.log("✅ Sentry initialised");
}

export function captureException(err: unknown, context?: Record<string, any>) {
  if (!process.env.SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(err);
  });
}

export function captureMessage(msg: string, level: Sentry.SeverityLevel = "info") {
  if (!process.env.SENTRY_DSN) return;
  Sentry.captureMessage(msg, level);
}

export { Sentry };