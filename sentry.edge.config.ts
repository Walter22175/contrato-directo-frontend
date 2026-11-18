/**
 * Configuración de Sentry para Edge Runtime (middleware).
 * Leída automáticamente por @sentry/nextjs.
 */
const config = {
  dsn: process.env.SENTRY_DSN || "",
  environment: process.env.VERCEL_ENV || "development",
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.0"),
  sendDefaultPii: false,
};

export default config;
