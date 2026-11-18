/**
 * Configuración de Sentry para el servidor (Node).
 * Leída automáticamente por @sentry/nextjs.
 */
const config = {
  dsn: process.env.SENTRY_DSN || "",
  environment: process.env.VERCEL_ENV || "development",
  release: process.env.COMMIT_SHA || undefined,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
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
};

export default config;
