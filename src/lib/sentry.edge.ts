/**
 * Contrato Directo — Frontend (Next.js)
 * Utilidades de Sentry para Edge Runtime (middleware).
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENABLED =
  process.env.NEXT_PUBLIC_SENTRY_ENABLED !== "false" && Boolean(SENTRY_DSN);
const ENVIRONMENT = process.env.VERCEL_ENV || "development";
const RELEASE =
  process.env.COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || undefined;

/**
 * (Re)inicializa Sentry en Edge. Solo tiene efecto si existe DSN.
 */
export function initSentryEdge(): void {
  if (!SENTRY_ENABLED) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,
    enabled: true,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.0"),
  });
}

/**
 * Anexa el contexto de request al scope de Sentry (Edge).
 */
export function setRequestContext(ctx: {
  requestId?: string;
  userId?: string;
  rol?: string;
  url?: string;
  userAgent?: string;
}): void {
  if (ctx.requestId) {
    Sentry.setTag("request_id", ctx.requestId);
    Sentry.setExtra("request_id", ctx.requestId);
  }
  if (ctx.userId) {
    Sentry.setUser({ id: ctx.userId });
    Sentry.setTag("user_id", ctx.userId);
  }
  if (ctx.rol) {
    Sentry.setTag("rol", ctx.rol);
  }
  if (ctx.url) {
    Sentry.setTag("url", ctx.url);
    Sentry.setExtra("url", ctx.url);
  }
  if (ctx.userAgent) {
    Sentry.setTag("user_agent", ctx.userAgent);
    Sentry.setExtra("browser", ctx.userAgent);
  }

  Sentry.setContext("app", {
    environment: ENVIRONMENT,
    release: RELEASE ?? "local",
  });
}
