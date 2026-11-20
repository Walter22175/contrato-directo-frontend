/**
 * Instrumentación del cliente (Next.js).
 *
 * Next.js ejecuta este archivo antes de la hidratación, por lo que Sentry
 * queda inicializado antes de cualquier error de React. Requiere que
 * NEXT_PUBLIC_SENTRY_DSN esté definida en tiempo de build.
 */

import * as Sentry from "@sentry/nextjs";

import { initSentryClient } from "./lib/sentry.client";

initSentryClient();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
