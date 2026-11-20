/**
 * Instrumentación del servidor y edge runtime (Next.js).
 *
 * Next.js importa este archivo automáticamente en cada runtime. El SDK de
 * Sentry se inicializa solo en el runtime que corresponde para no cargar el
 * cliente de Node en Edge ni viceversa.
 */

import * as Sentry from "@sentry/nextjs";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initSentryServer } = await import("./lib/sentry.server");
    initSentryServer();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const { initSentryEdge } = await import("./lib/sentry.edge");
    initSentryEdge();
  }
}

export const onRequestError = Sentry.captureRequestError;
