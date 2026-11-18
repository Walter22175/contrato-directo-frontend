/**
 * Contrato Directo — Frontend (Next.js)
 * Utilidades de Sentry del lado del cliente (App Router).
 *
 * Envía: request_id, usuario autenticado, URL, navegador.
 * Registra: React Errors, Hydration Errors, API Failures, Routing Errors,
 * Formularios fallidos.
 *
 * El SDK ya se inicializa automáticamente vía sentry.client.config.ts y
 * <Sentry /> en el layout. Estas funciones exponen el scope para anotar
 * errores y mensajes con contexto de request.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_SENTRY_DSN
    ? process.env.NEXT_PUBLIC_SENTRY_DSN
    : undefined;

const ENVIRONMENT =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_VERCEL_ENV
    ? process.env.NEXT_PUBLIC_VERCEL_ENV
    : "development";

const RELEASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_COMMIT_SHA
    ? `${process.env.NEXT_PUBLIC_COMMIT_SHA}`
    : undefined;

/**
 * (Re)inicializa Sentry en el cliente. Solo tiene efecto si existe DSN.
 */
export function initSentryClient(): void {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,
    enabled: true,
    tracesSampleRate: Number(
      typeof process !== "undefined" &&
        process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
        ? process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
        : "0.1",
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
    autoSessionTracking: true,
  } as any);
}

/**
 * Anexa el contexto de request al scope de Sentry.
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
 * Captura una excepción no controlada del frontend con contexto de request.
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
 * Captura un mensaje (p. ej. fallo de formulario, fallo de API) en Sentry.
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
