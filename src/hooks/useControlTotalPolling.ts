'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const INTERVALO_DEFECTO_MS = 15_000;

/**
 * Polling simple (decidido en PROMPT: sin websockets). Refresca al montar,
 * cada `intervalMs` y con `refrescar()`. `activo=false` pausa el timer.
 */
export function useControlTotalPolling<T>(
  fetcher: () => Promise<T>,
  {
    intervalMs = INTERVALO_DEFECTO_MS,
    activo = true,
  }: { intervalMs?: number; activo?: boolean } = {},
) {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimoRefresco, setUltimoRefresco] = useState<Date | null>(null);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const refrescar = useCallback(async () => {
    try {
      const d = await fetcherRef.current();
      setDatos(d);
      setError(null);
      setUltimoRefresco(new Date());
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? ((e as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'Error de red')
          : e instanceof Error
            ? e.message
            : 'Error inesperado';
      setError(typeof msg === 'string' ? msg : 'Error inesperado');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!activo) return;
    void refrescar();
    const id = setInterval(() => {
      void refrescar();
    }, intervalMs);
    return () => clearInterval(id);
  }, [activo, intervalMs, refrescar]);

  return { datos, cargando, error, refrescar, ultimoRefresco };
}
