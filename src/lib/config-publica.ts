import api, { extractData } from './api';

/**
 * Valores de fallback para el copy. Se usan solo hasta que llega la
 * configuración vigente del backend (`GET /configuracion/publica`).
 * Si cambiás la comisión o el tope express, editá el backend (Config.
 * Sistema): estos números son el último recurso visual, no la fuente.
 */
export const COMISION_FALLBACK = 8;
export const MONTO_EXPRESS_FALLBACK = 150000;

export interface ConfigPublica {
  comision_porcentaje: number;
  monto_maximo_servicio_rapido: number;
}

const TTL_MS = 5 * 60 * 1000;
let cache: { valor: ConfigPublica; ts: number } | null = null;
let pendiente: Promise<ConfigPublica> | null = null;

/** Configuración vigente con cache en memoria de 5 minutos. */
export async function obtenerConfigPublica(): Promise<ConfigPublica> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.valor;
  if (pendiente) return pendiente;

  pendiente = api
    .get('/configuracion/publica')
    .then((res) => {
      const data = extractData<ConfigPublica>(res);
      const valor: ConfigPublica = {
        comision_porcentaje:
          Number(data?.comision_porcentaje) || COMISION_FALLBACK,
        monto_maximo_servicio_rapido:
          Number(data?.monto_maximo_servicio_rapido) || MONTO_EXPRESS_FALLBACK,
      };
      cache = { valor, ts: Date.now() };
      return valor;
    })
    .catch(() => {
      // Red caída o sin backend: mostramos el copy de fallback.
      return {
        comision_porcentaje: COMISION_FALLBACK,
        monto_maximo_servicio_rapido: MONTO_EXPRESS_FALLBACK,
      } satisfies ConfigPublica;
    })
    .finally(() => {
      pendiente = null;
    });

  return pendiente;
}

/** Solo para tests: limpia el cache en memoria. */
export function limpiarCacheConfigPublica(): void {
  cache = null;
  pendiente = null;
}
