import api from './api';

const REPORTES_KEY = 'busquedas_fallidas_reportadas';
const REPORTE_DUP_MS = 60_000;

export interface BusquedaFallidaPayload {
  consulta: string;
  tipo: 'rubro' | 'servicio';
  id_categoria?: number;
}

function yaReportada(consulta: string): boolean {
  try {
    const raw = localStorage.getItem(REPORTES_KEY);
    if (!raw) return false;
    const map: Record<string, number> = JSON.parse(raw);
    const ultima = map[consulta.toLowerCase()];
    return !!ultima && Date.now() - ultima < REPORTE_DUP_MS;
  } catch {
    return false;
  }
}

function marcarReportada(consulta: string): void {
  try {
    const raw = localStorage.getItem(REPORTES_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    map[consulta.toLowerCase()] = Date.now();
    const claves = Object.keys(map);
    if (claves.length > 50) {
      const ordenadas = claves.sort((a, b) => map[a] - map[b]);
      for (const k of ordenadas.slice(0, claves.length - 50)) delete map[k];
    }
    localStorage.setItem(REPORTES_KEY, JSON.stringify(map));
  } catch {
    // localStorage no disponible: simplemente no deduplicar
  }
}

/**
 * Registra una búsqueda sin resultados para el catálogo dinámico.
 * Endpoint público (no requiere token). Deduplica por consulta durante 60s
 * y falla silenciosamente (el usuario no debe verse afectado).
 */
export async function reportarBusquedaFallida(payload: BusquedaFallidaPayload): Promise<void> {
  const consulta = payload.consulta.trim();
  if (!consulta || consulta.length > 150) return;
  if (yaReportada(consulta)) return;

  marcarReportada(consulta);
  try {
    await api.post('/catalogo/busquedas-fallidas', {
      consulta,
      tipo: payload.tipo,
      ...(payload.id_categoria ? { id_categoria: payload.id_categoria } : {}),
    });
  } catch {
    // silencioso: el reporte nunca debe romper la UX
  }
}
