/**
 * Contrato Directo — Frontend (Next.js)
 * Utilidades de Sentry del lado del servidor (App Router).
 *
 * Configura/captura errores de servidor, fallos de API Routes y errores de
 * renderizado del lado del servidor.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.VERCEL_ENV || "development";
const RELEASE = process.env.COMMIT_SHA || undefined;

/**
 * (Re)inicializa Sentry en el servidor. Solo tiene efecto si existe DSN.
 */
export function initSentryServer(): void {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,
    enabled: true,
    tracesSampleRate: Number(
      process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1",
    ),
    sendDefaultPii: false,
    beforeSend(event: unknown) {
      const e = event as {
        request?: { method?: string };
        contexts?: { response?: { status_code?: number } };
        tags?: { [key: string]: string };
      };
      if (
        e.request?.method &&
        e.contexts?.response?.status_code &&
        e.contexts.response.status_code >= 400 &&
        e.contexts.response.status_code < 500 &&
        e.tags?.["is_critical_4xx"] !== "true"
      ) {
        return null;
      }
      return event;
    },
  } as any);
}

/**
 * Anexa el contexto de request al scope de Sentry (servidor).
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

/**
 * Captura una excepción del servidor con contexto de request.
 */
export function captureException(
  exception: unknown,
  ctx?: {
    requestId?: string;
    userId?: string;
    url?: string;
  },
): string | undefined {
  if (ctx) {
    setRequestContext({
      requestId: ctx.requestId,
      userId: ctx.userId,
      url: ctx.url,
    });
  }
  return Sentry.captureException(exception);
}

/**
 * Captura un mensaje en Sentry (servidor).
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "log" | "info" = "error",
  ctx?: {
    requestId?: string;
    userId?: string;
    url?: string;
  },
): string | undefined {
  if (ctx) {
    setRequestContext({
      requestId: ctx.requestId,
      userId: ctx.userId,
      url: ctx.url,
    });
  }
  return Sentry.captureMessage(message, { level });
}
