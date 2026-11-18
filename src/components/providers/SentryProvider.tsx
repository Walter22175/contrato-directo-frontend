/**
 * Proveedor de Sentry del lado del cliente.
 *
 * Inicializa el SDK temprano en el navegador usando la configuración de
 * sentry.client.config.ts (DSN, environment, release, muestreo).
 * Sin DSN, Sentry permanece deshabilitado sin romper la aplicación.
 */
"use client";

import { useEffect } from "react";

import { initSentryClient } from "@/lib/sentry.client";

export default function SentryProvider(): null {
  useEffect(() => {
    initSentryClient();
  }, []);

  return null;
}
