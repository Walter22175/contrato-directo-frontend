'use client';

import { useEffect, useState } from 'react';
import {
  COMISION_FALLBACK,
  MONTO_EXPRESS_FALLBACK,
  obtenerConfigPublica,
  type ConfigPublica,
} from '@/lib/config-publica';

/**
 * Comisión vigente y tope de Servicios Express, con fallback a los
 * valores de copy mientras carga o si el backend no responde.
 */
export function useConfigPublica(): ConfigPublica {
  const [config, setConfig] = useState<ConfigPublica>({
    comision_porcentaje: COMISION_FALLBACK,
    monto_maximo_servicio_rapido: MONTO_EXPRESS_FALLBACK,
  });

  useEffect(() => {
    let vivo = true;
    void obtenerConfigPublica().then((c) => {
      if (vivo) setConfig(c);
    });
    return () => {
      vivo = false;
    };
  }, []);

  return config;
}
