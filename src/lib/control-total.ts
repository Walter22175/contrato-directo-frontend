import api, { extractData } from './api';

// ===========================================================================
// Tipos espejo de las respuestas de control-total.controller.ts (solo admin)
// ===========================================================================

export type Semaforo = 'verde' | 'amarillo' | 'rojo' | 'gris';

export interface ResumenControlTotal {
  generado_en: string;
  pagos_en_custodia: number;
  eventos_24h: number;
  errores_24h: number;
  inconsistencias_criticas: number;
  inconsistencias_totales: number;
  modo_colas: 'redis' | 'inline' | 'desconocido';
  tokens_problema: number;
  marketplace_habilitado: boolean;
  semaforo: Exclude<Semaforo, 'gris'>;
}

export interface EventoControl {
  id: number;
  tipo: string;
  entidad: string;
  id_entidad: string | null;
  id_transaccion: string | null;
  id_pago: string | null;
  origen: string;
  severidad: string;
  titulo: string | null;
  detalle: Record<string, unknown> | null;
  correlacion_mp: Record<string, unknown> | null;
  fecha: string;
}

export interface TimelineTransaccion {
  clave: string;
  id_transaccion: string | null;
  id_pago: string | null;
  eventos: EventoControl[];
}

export interface TimelineGlobal {
  generado_en: string;
  total: number;
  cursor: number | null;
  transacciones: TimelineTransaccion[];
}

export interface EspejoMP {
  mp_status: string | null;
  mp_payment_id: string | null;
  captured_at: string | null;
  cancelled_at: string | null;
  capture_requested_at: string | null;
  auto_capture_at: string | null;
  application_fee: number;
  monto_proveedor: number;
  monto_plataforma: number;
  ultimos_webhooks: Array<{
    tipo: string;
    fecha: string;
    firma_valida: boolean | null;
    titulo: string | null;
  }>;
  ultimo_webhook_at: string | null;
}

export interface EspejoBD {
  estado: string;
  monto: number;
  monto_liberado: number;
  monto_comision: number;
  monto_anticipado: number;
  fecha_pago: string | null;
  entrega_proveedor_at: string | null;
  fecha_inicio_servicio_at: string | null;
  fecha_liberacion_anticipada_at: string | null;
  fecha_liberacion: string | null;
  fondos_retenidos: boolean;
}

export interface VistaEspejo {
  generado_en: string;
  id_transaccion: string;
  mp: EspejoMP | null;
  bd: EspejoBD | null;
  semaforo: Exclude<Semaforo, 'gris'>;
  motivos: string[];
}

export interface EstadoCola {
  nombre: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface RiesgosColas {
  jobs_fallidos_24h: number;
  jobs_sin_job_id_24h: number;
  jobs_stuck: number;
  jobs_duplicados_24h: number;
  marcado_sin_encolar: number;
  encolado_sin_marcado: number;
  detalle: Array<{ tipo: string; cantidad: number; recomendacion: string }>;
}

export interface MonitorColas {
  generado_en: string;
  modo: 'redis' | 'inline';
  error_conexion?: string;
  colas: EstadoCola[];
  riesgos: RiesgosColas;
}

export interface EstadoCron {
  nombre: string;
  expresion: string;
  descripcion: string;
  ultima_ejecucion: string | null;
  proxima_ejecucion: string | null;
  duracion_ms: number | null;
  candidatos: number | null;
  ejecuciones_exitosas_24h: number;
  ejecuciones_fallidas_24h: number;
  ultimoResultado: string | null;
  ultimoError: string | null;
  semaforo: Semaforo;
}

export interface MonitorCrons {
  generado_en: string;
  crons: EstadoCron[];
}

export interface FilaToken {
  id_usuario: string;
  mp_user_id: string | null;
  token_valido: boolean | null;
  mp_token_expires_at: string | null;
  mp_scopes: string | null;
  ultimo_error_token: string | null;
  fecha_ultimo_error: string | null;
  marketplace_habilitado: boolean;
  fecha_conexion: string | null;
  fecha_ultimo_refresh: string | null;
  semaforo: Semaforo;
}

export interface PanelTokens {
  generado_en: string;
  tokens: FilaToken[];
}

export interface PeriodoContable {
  periodo: string;
  cobrado: number;
  comision: number;
  liberado: number;
  cantidad: number;
}

export interface PanelComisiones {
  generado_en: string;
  desde: string;
  hasta: string;
  totales: {
    application_fee_mp: number;
    comision_interna: number;
    neto_proveedor: number;
    neto_plataforma: number;
    anticipado: number;
    descuentos_finales: number;
  };
  por_periodo: PeriodoContable[];
}

export interface FilaRetencion {
  id_pago: string;
  id_transaccion: string | null;
  monto: number;
  estado: string;
  mp_status: string | null;
  monto_liberado: number;
  monto_comision: number;
  fecha_pago: string | null;
  fecha_liberacion: string | null;
  entrega_proveedor_at: string | null;
  captured_at: string | null;
  cancelled_at: string | null;
}

export interface PanelRetencion {
  generado_en: string;
  data: FilaRetencion[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  contadores: Record<string, number>;
}

export interface Inconsistencia {
  regla: string;
  severidad: 'critica' | 'media' | 'baja';
  cantidad: number;
  recomendacion: string;
  id_pago?: string;
  id_transaccion?: string;
}

export interface AuditoriaContable {
  generado_en: string;
  desde: string;
  hasta: string;
  totales: Record<string, number>;
  por_periodo: PeriodoContable[];
}

export interface InspectorTransaccion {
  generado_en: string;
  id_transaccion: string;
  transaccion: Record<string, unknown> | null;
  pago: Record<string, unknown> | null;
  anticipo: { porcentaje: number; bruto: number; fecha: string } | null;
  comision: {
    monto_comision: number;
    monto_liberado: number;
    monto: number;
    neto_proveedor: number;
  } | null;
  webhooks: EventoControl[];
  jobs: EventoControl[];
  cambios_estado: EventoControl[];
  cron: EventoControl[];
  calculos: EventoControl[];
  todos_eventos: EventoControl[];
  espejo: VistaEspejo | null;
}

// ===========================================================================
// Cliente (solo SUPER_ADMIN; el backend responde 403 para otros roles)
// ===========================================================================

export async function obtenerResumenControlTotal(): Promise<ResumenControlTotal> {
  const res = await api.get('/control-total/resumen');
  return extractData<ResumenControlTotal>(res);
}

export async function obtenerTimeline(params?: {
  desde?: string;
  hasta?: string;
  id_transaccion?: string;
  id_pago?: string;
  id_proveedor?: string;
  tipo?: string;
  limit?: number;
  cursor?: number;
}): Promise<TimelineGlobal> {
  const res = await api.get('/control-total/timeline', { params });
  return extractData<TimelineGlobal>(res);
}

export async function obtenerEspejo(idTransaccion: string): Promise<VistaEspejo | null> {
  const res = await api.get(`/control-total/transacciones/${idTransaccion}/espejo`);
  return extractData<VistaEspejo | null>(res);
}

export async function obtenerMonitorColas(): Promise<MonitorColas> {
  const res = await api.get('/control-total/colas');
  return extractData<MonitorColas>(res);
}

export async function obtenerMonitorCrons(): Promise<MonitorCrons> {
  const res = await api.get('/control-total/crons');
  return extractData<MonitorCrons>(res);
}

export async function obtenerPanelTokens(): Promise<PanelTokens> {
  const res = await api.get('/control-total/tokens');
  return extractData<PanelTokens>(res);
}

export async function obtenerPanelComisiones(params?: {
  desde?: string;
  hasta?: string;
  frecuencia?: 'dia' | 'semana' | 'mes';
}): Promise<PanelComisiones> {
  const res = await api.get('/control-total/comisiones', { params });
  return extractData<PanelComisiones>(res);
}

export async function obtenerPanelRetencion(params?: {
  desde?: string;
  hasta?: string;
  id_proveedor?: string;
  id_cliente?: string;
  estado?: string;
  monto_min?: number;
  monto_max?: number;
  page?: number;
  limit?: number;
}): Promise<PanelRetencion> {
  const res = await api.get('/control-total/retencion', { params });
  return extractData<PanelRetencion>(res);
}

export async function obtenerInconsistencias(): Promise<Inconsistencia[]> {
  const res = await api.get('/control-total/inconsistencias');
  return extractData<Inconsistencia[]>(res);
}

export async function obtenerAuditoriaContable(params?: {
  desde?: string;
  hasta?: string;
  frecuencia?: 'dia' | 'semana' | 'mes';
  id_proveedor?: string;
  id_cliente?: string;
}): Promise<AuditoriaContable> {
  const res = await api.get('/control-total/contabilidad', { params });
  return extractData<AuditoriaContable>(res);
}

export async function obtenerInspector(idTransaccion: string): Promise<InspectorTransaccion | null> {
  const res = await api.get(`/control-total/transacciones/${idTransaccion}/inspector`);
  return extractData<InspectorTransaccion | null>(res);
}

// ===========================================================================
// Acciones administrativas (control tower SUPER_ADMIN)
// Todas requieren rol super_admin: el backend responde 403 para otros roles.
// ===========================================================================

export type CampoCorreccion =
  | 'captured_at'
  | 'cancelled_at'
  | 'refunded_at'
  | 'entrega_proveedor_at'
  | 'fecha_inicio_servicio_at'
  | 'fecha_liberacion_anticipada_at';

export const CAMPOS_CORREGIBLES: Array<{
  valor: CampoCorreccion;
  etiqueta: string;
  requiereMp: string | null;
}> = [
  {
    valor: 'captured_at',
    etiqueta: 'captured_at (MP ya capturó)',
    requiereMp: 'captured / approved',
  },
  {
    valor: 'cancelled_at',
    etiqueta: 'cancelled_at (MP ya canceló)',
    requiereMp: 'cancelled',
  },
  {
    valor: 'refunded_at',
    etiqueta: 'refunded_at (MP ya reembolsó)',
    requiereMp: 'refunded',
  },
  { valor: 'entrega_proveedor_at', etiqueta: 'entrega_proveedor_at', requiereMp: null },
  { valor: 'fecha_inicio_servicio_at', etiqueta: 'fecha_inicio_servicio_at', requiereMp: null },
  {
    valor: 'fecha_liberacion_anticipada_at',
    etiqueta: 'fecha_liberacion_anticipada_at',
    requiereMp: null,
  },
];

export interface ResultadoJobReencole {
  modo: 'redis' | 'inline';
  jobId: string;
  accion: 'reintentado' | 'recreado' | 'encolado' | 'ya_en_cola';
}

export interface ResultadoAccionPago {
  accion: string;
  ejecutado_en: string;
  job: ResultadoJobReencole;
  pago: Record<string, unknown>;
}

export interface ResultadoWebhookReintentado {
  accion: string;
  ejecutado_en: string;
  job: ResultadoJobReencole;
  id_pago_mercadopago: string;
  id_pago: string | null;
  id_transaccion: string | null;
  firma_valida_original: boolean | null;
}

export interface ResultadoTimelineRegenerado {
  accion: string;
  generado_en: string;
  id_transaccion: string;
  id_pago: string | null;
  timeline: Array<Record<string, unknown>>;
  correlaciones: Record<string, unknown>;
  semaforo: Semaforo | null;
  motivos: string[];
}

export interface ResultadoContabilidadRecalculada {
  accion: string;
  recalculado_en: string;
  contabilidad: AuditoriaContable;
  comisiones: Record<string, number>;
}

export interface ResultadoCronManual {
  accion: string;
  nombre: string;
  exitoso: boolean;
  duracion_ms: number;
  inicio: string;
  fin: string;
  error?: string;
}

export interface ResultadoJobReencolado {
  accion: string;
  ejecutado_en: string;
  cola: string;
  jobId: string;
  modo: 'redis' | 'inline';
  accion_job: 'reintentado' | 'recreado' | 'encolado' | 'ya_en_cola';
}

export interface ResultadoCorreccionEstado {
  accion: string;
  ejecutado_en: string;
  campo: CampoCorreccion;
  valor: string;
  entidad: 'pago' | 'transaccion';
  pago: Record<string, unknown>;
  transaccion: Record<string, unknown> | null;
}

/** Forzar captura MP del pago (SUPER_ADMIN). */
export async function forzarCapturaPago(idPago: string): Promise<ResultadoAccionPago> {
  const res = await api.post(`/control-total/pagos/${idPago}/forzar-captura`);
  return extractData<ResultadoAccionPago>(res);
}

/** Forzar cancelación MP del pago (SUPER_ADMIN). */
export async function forzarCancelacionPago(idPago: string): Promise<ResultadoAccionPago> {
  const res = await api.post(`/control-total/pagos/${idPago}/forzar-cancelacion`);
  return extractData<ResultadoAccionPago>(res);
}

/** Reencolar el payload original de un webhook (evento de control o id de MP). */
export async function reintentarWebhookMp(id: string): Promise<ResultadoWebhookReintentado> {
  const res = await api.post(`/control-total/webhooks/${id}/reintentar`);
  return extractData<ResultadoWebhookReintentado>(res);
}

/** Reconstruye el timeline desde control_evento y recalcula correlaciones. */
export async function regenerarTimelineTransaccion(
  idTransaccion: string,
): Promise<ResultadoTimelineRegenerado> {
  const res = await api.post(
    `/control-total/transacciones/${idTransaccion}/regenerar-timeline`,
  );
  return extractData<ResultadoTimelineRegenerado>(res);
}

/** Recalcula totales, series, comisiones, anticipos y devoluciones. */
export async function recalcularContabilidadTotal(params?: {
  desde?: string;
  hasta?: string;
  frecuencia?: 'dia' | 'semana' | 'mes';
  id_proveedor?: string;
  id_cliente?: string;
}): Promise<ResultadoContabilidadRecalculada> {
  const res = await api.post('/control-total/contabilidad/recalcular', params ?? {});
  return extractData<ResultadoContabilidadRecalculada>(res);
}

/** Ejecuta manualmente un cron (custodia | captura | refresh | monitor). */
export async function ejecutarCronManual(nombre: string): Promise<ResultadoCronManual> {
  const res = await api.post(`/control-total/crons/${encodeURIComponent(nombre)}/ejecutar`);
  return extractData<ResultadoCronManual>(res);
}

/** Reencola (o reintenta) un job de una cola BullMQ. */
export async function reencolarJobCola(
  cola: string,
  jobId: string,
): Promise<ResultadoJobReencolado> {
  const res = await api.post(
    `/control-total/colas/${encodeURIComponent(cola)}/jobs/${encodeURIComponent(jobId)}/reencolar`,
  );
  return extractData<ResultadoJobReencolado>(res);
}

/** Corrección aditiva de estado: solo setea campos vacíos respaldados por MP. */
export async function corregirEstadoPago(
  idPago: string,
  cuerpo: { campo: CampoCorreccion; valor?: string },
): Promise<ResultadoCorreccionEstado> {
  const res = await api.post(`/control-total/pagos/${idPago}/corregir-estado`, cuerpo);
  return extractData<ResultadoCorreccionEstado>(res);
}

/** Traza completa de la transacción (JSON sanitizado, sin tokens). */
export async function exportarTrazaTransaccion(
  idTransaccion: string,
): Promise<Record<string, unknown>> {
  const res = await api.get(`/control-total/transacciones/${idTransaccion}/exportar`);
  return extractData<Record<string, unknown>>(res);
}

/** Descarga la traza completa como archivo JSON en el navegador. */
export async function descargarTrazaJson(idTransaccion: string): Promise<void> {
  const traza = await exportarTrazaTransaccion(idTransaccion);
  const blob = new Blob([JSON.stringify(traza, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `traza-${idTransaccion}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.json`;
  enlace.click();
  URL.revokeObjectURL(url);
}

// ===========================================================================
// Helpers de formato (ARS, fechas es-AR)
// ===========================================================================

export function fmtArs(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return v.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  });
}

export function fmtFecha(v: string | Date | null | undefined): string {
  if (!v) return '—';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

export function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString('es-AR');
}

export function descargarCsv(nombre: string, filas: string[]): void {
  const blob = new Blob([filas.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${nombre}-${new Date().toISOString().slice(0, 10)}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}
