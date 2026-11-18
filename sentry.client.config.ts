/**
 * Configuración de Sentry para el cliente (navegador).
 * Leída automáticamente por @sentry/nextjs.
 */
const config = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
  release: process.env.NEXT_PUBLIC_COMMIT_SHA || undefined,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: Number(
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1",
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
};

export default config;
