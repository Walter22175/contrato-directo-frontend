import api, { extractData } from './api';

export type ResultadoAuditoria = 'exito' | 'error' | 'denegado';

export interface AuditoriaLog {
  id: string;
  user_id: string | null;
  rol_activo: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  descripcion: string | null;
  metadata_json: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  request_id: string | null;
  resultado: ResultadoAuditoria;
  created_at: string;
}

export interface AuditoriaQuery {
  fecha_desde?: string;
  fecha_hasta?: string;
  user_id?: string;
  accion?: string;
  entidad?: string;
  entidad_id?: string;
  resultado?: ResultadoAuditoria;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditoriaMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AuditoriaLista {
  data: AuditoriaLog[];
  meta: AuditoriaMeta;
}

export interface AuditoriaResumen {
  total: number;
  errores: number;
  denegados: number;
  por_accion: Array<{ accion: string; total: number }>;
  por_entidad: Array<{ entidad: string; total: number }>;
}

export async function obtenerAuditoria(
  query: AuditoriaQuery = {},
): Promise<AuditoriaLista> {
  const res = await api.get('/admin/dashboard/auditoria', { params: query });
  return extractData<AuditoriaLista>(res);
}

export async function obtenerResumenAuditoria(
  query: AuditoriaQuery = {},
): Promise<AuditoriaResumen> {
  const filtros = { ...query };
  delete filtros.page;
  delete filtros.limit;

  const res = await api.get('/admin/dashboard/auditoria/resumen', {
    params: filtros,
  });
  return extractData<AuditoriaResumen>(res);
}

export function fmtFechaAuditoria(valor: string | null | undefined): string {
  if (!valor) return '-';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '-';
  return fecha.toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

export function fmtNumAuditoria(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '-';
  return valor.toLocaleString('es-AR');
}

function celdaCsv(valor: unknown): string {
  let texto =
    valor === null || valor === undefined
      ? ''
      : typeof valor === 'object'
        ? JSON.stringify(valor)
        : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}

export function descargarAuditoriaCsv(logs: AuditoriaLog[]): void {
  const filas = [
    [
      'fecha',
      'accion',
      'entidad',
      'entidad_id',
      'usuario_id',
      'rol_activo',
      'resultado',
      'ip',
      'request_id',
      'descripcion',
      'metadata',
    ].join(','),
    ...logs.map((log) =>
      [
        log.created_at,
        log.accion,
        log.entidad,
        log.entidad_id,
        log.user_id,
        log.rol_activo,
        log.resultado,
        log.ip,
        log.request_id,
        log.descripcion,
        log.metadata_json,
      ]
        .map(celdaCsv)
        .join(','),
    ),
  ];

  const blob = new Blob([`\uFEFF${filas.join('\n')}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}
