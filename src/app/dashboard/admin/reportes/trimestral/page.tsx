'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { extractData, mensajeError } from '@/lib/api';
import { Card, CardTitle } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  Layers,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface CanalReporte {
  canal: string;
  creados: number;
  resueltos: number;
  tpr_promedio_min?: number;
  tr_promedio_min?: number;
}

interface DatosReporteAtencion {
  desde: string;
  hasta: string;
  tickets: {
    creados: number;
    resueltos: number;
    tpr_promedio_min: number;
    tr_promedio_min: number;
  };
  por_canal?: CanalReporte[];
  sla: {
    total: number;
    cumplidos: number;
    incumplidos: number;
    pct_cumplimiento: number;
  };
  encuestas: {
    respondidas: number;
    csat: number;
    nps: number;
    fcr: number;
  };
  autoservicio?: {
    uso_centro_ayuda: number;
    derivacion_chatbot: number;
  };
  temas_frecuentes?: { tema: string; cantidad: number }[];
}

interface ReporteAtencion {
  id_reporte: string;
  tipo: string;
  periodo: string;
  datos: DatosReporteAtencion | null;
  fecha_generacion: string;
  generado_por: string | null;
}

interface EdicionTrimestral {
  id_edicion: number;
  id_revision: number;
  id_categoria: number;
  id_usuario?: string | null;
  periodo: string;
  accion: string;
  detalle?: Record<string, unknown> | null;
  fecha_creacion: string;
}

const ETIQUETAS_EDICION: Record<string, string> = {
  categoria_inactiva: 'Categoría inactiva',
  rubro_baja_demanda: 'Rubro con baja demanda',
  servicio_baja_demanda: 'Servicio con baja demanda',
};

/**
 * El reporte de atención usa periodos `YYYY-Tn` y la revisión trimestral del
 * catálogo `YYYY-Qn`; ambos trimestres coinciden en número.
 */
function periodoRevision(periodo: string | undefined): string | null {
  if (!periodo) return null;
  const match = /^(\d{4})-T([1-4])$/.exec(periodo);
  return match ? `${match[1]}-Q${match[2]}` : null;
}

const ETIQUETAS_CANAL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  telefono: 'Teléfono',
  chatbot: 'Chatbot',
  formulario: 'Formulario',
};

function formatearPeriodo(periodo: string): string {
  const trimestre = /^(\d{4})-T([1-4])$/.exec(periodo);
  if (trimestre) return `Q${trimestre[2]} ${trimestre[1]}`;

  const mensual = /^(\d{4})-(\d{2})$/.exec(periodo);
  if (mensual) {
    const fecha = new Date(Number(mensual[1]), Number(mensual[2]) - 1, 1);
    return fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  }

  return periodo;
}

function formatearFinPeriodo(hasta: string): string {
  const fecha = new Date(hasta);
  if (Number.isNaN(fecha.getTime())) return formatDate(hasta);
  fecha.setDate(fecha.getDate() - 1);
  return formatDate(fecha);
}

function formatearMinutos(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos <= 0) return '0m';
  if (minutos < 60) return `${Math.round(minutos)}m`;
  const horas = minutos / 60;
  return `${horas.toFixed(horas < 10 ? 1 : 0)}h`;
}

function formatearFechaEdicion(fecha: string | undefined): string {
  if (!fecha) return '—';
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '—';
  return formatDate(fecha);
}

function calcularAreasMejora(datos: DatosReporteAtencion): string[] {
  const areas: string[] = [];
  const autoservicio = datos.autoservicio;

  if (datos.sla.total > 0 && datos.sla.pct_cumplimiento < 90) {
    areas.push('Revisar los incumplimientos de SLA y reforzar la capacidad del equipo.');
  }
  if (datos.tickets.creados > 0 && datos.tickets.resueltos / datos.tickets.creados < 0.9) {
    areas.push('Reducir la acumulación de tickets sin resolver dentro del trimestre.');
  }
  if (datos.encuestas.respondidas > 0 && datos.encuestas.csat < 4.5) {
    areas.push('Elevar la satisfacción (CSAT) por debajo de la meta de 4,5/5.');
  }
  if (datos.encuestas.respondidas > 0 && datos.encuestas.nps < 60) {
    areas.push('Trabajar la experiencia del cliente para alcanzar un NPS mayor a 60.');
  }
  if (datos.encuestas.respondidas > 0 && datos.encuestas.fcr < 80) {
    areas.push('Mejorar la resolución en el primer contacto para superar el 80%.');
  }
  if (autoservicio && datos.tickets.creados > 0 && autoservicio.uso_centro_ayuda < 60) {
    areas.push('Promover el centro de ayuda para reducir consultas evitables.');
  }

  return areas;
}

function porcentajeResueltos(datos: DatosReporteAtencion): number {
  if (datos.tickets.creados <= 0) return 0;
  return Math.round((datos.tickets.resueltos / datos.tickets.creados) * 100);
}

export default function ReporteTrimestralPage() {
  const [reporte, setReporte] = useState<ReporteAtencion | null>(null);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ediciones, setEdiciones] = useState<EdicionTrimestral[]>([]);
  const [cargandoEdiciones, setCargandoEdiciones] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/reportes-atencion', {
        params: { tipo: 'trimestral' },
      });
      const data = extractData<ReporteAtencion[]>(res);
      setReporte(Array.isArray(data) && data.length > 0 ? data[0] : null);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cargar el reporte trimestral.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const periodoEdiciones = periodoRevision(reporte?.periodo);

  useEffect(() => {
    if (!periodoEdiciones) {
      setEdiciones([]);
      return;
    }

    let cancelado = false;
    const cargarEdiciones = async () => {
      setCargandoEdiciones(true);
      try {
        const res = await api.get('/catalogo/ediciones-trimestrales', {
          params: { periodo: periodoEdiciones },
        });
        if (!cancelado) {
          const data = extractData<EdicionTrimestral[]>(res);
          setEdiciones(
            Array.isArray(data)
              ? data.filter((ed) => ed && typeof ed.id_edicion === 'number')
              : [],
          );
        }
      } catch {
        // Degradación elegante: el reporte de atención sigue siendo visible
        // aunque el usuario no tenga permiso o no exista revisión del catálogo.
        if (!cancelado) setEdiciones([]);
      } finally {
        if (!cancelado) setCargandoEdiciones(false);
      }
    };

    cargarEdiciones();
    return () => {
      cancelado = true;
    };
  }, [periodoEdiciones]);

  const generar = async () => {
    setGenerando(true);
    setError(null);
    try {
      const res = await api.post('/reportes-atencion/generar', {
        tipo: 'trimestral',
      });
      const data = extractData<ReporteAtencion>(res);
      setReporte(data);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo generar el reporte trimestral.'));
    } finally {
      setGenerando(false);
    }
  };

  const exportarCsv = async () => {
    if (!reporte) return;
    setExportando(true);
    setError(null);
    try {
      const res = await api.get(`/reportes-atencion/${reporte.id_reporte}/exportar`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `reporte-atencion-${reporte.tipo}-${reporte.periodo}.csv`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo exportar el reporte.'));
    } finally {
      setExportando(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-800/50 rounded animate-pulse" />
        <div className="h-48 bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  const datos = reporte?.datos ?? null;
  const canales = datos?.por_canal ?? [];
  const temas = datos?.temas_frecuentes ?? [];
  const maxTema = Math.max(...temas.map((tema) => tema.cantidad), 1);
  const areasMejora = datos ? calcularAreasMejora(datos) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reporte Trimestral</h1>
          <p className="text-slate-400 mt-1">
            {reporte ? formatearPeriodo(reporte.periodo) : 'Sin reporte generado'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportarCsv}
            disabled={!reporte || exportando}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exportando ? 'Exportando...' : 'Exportar CSV'}
          </button>
          <button
            type="button"
            onClick={cargar}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <button
            type="button"
            onClick={generar}
            disabled={generando}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-sm font-medium text-slate-950 disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {generando ? 'Generando...' : 'Generar trimestre'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!reporte || !datos ? (
        <Card>
          <div className="p-8 text-center">
            <FileText className="w-10 h-10 text-slate-500 mx-auto" />
            <h2 className="text-lg font-semibold text-white mt-3">
              No hay reporte trimestral generado
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Se genera automáticamente al inicio de cada trimestre o podés generarlo ahora.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>Generado: {formatDate(reporte.fecha_generacion)}</span>
            <span>
              Período: {formatDate(datos.desde)} - {formatearFinPeriodo(datos.hasta)}
            </span>
            {reporte.generado_por && <span>Por: {reporte.generado_por}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Tickets Totales</span>
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white">{datos.tickets.creados}</div>
                <div className="text-xs text-green-400 mt-1">
                  {datos.tickets.resueltos} resueltos ({porcentajeResueltos(datos)}%)
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">CSAT Promedio</span>
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-white">{datos.encuestas.csat}/5</div>
                <div className="text-xs text-slate-500 mt-1">
                  {datos.encuestas.respondidas} encuestas respondidas
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">NPS</span>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white">{datos.encuestas.nps}</div>
                <div className="text-xs text-slate-500 mt-1">Meta: mayor a 60</div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">FCR</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white">{datos.encuestas.fcr}%</div>
                <div className="text-xs text-slate-500 mt-1">Meta: mayor a 80%</div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-4">
              <CardTitle>Distribución por Canal</CardTitle>
              {canales.length === 0 ? (
                <p className="text-sm text-slate-500 mt-4">
                  Sin tickets registrados en el periodo.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {canales.map((canal) => {
                    const maximo = Math.max(...canales.map((c) => c.creados), 1);
                    return (
                      <div key={canal.canal} className="flex items-center gap-3">
                        <span className="text-sm text-slate-300 w-24 capitalize">
                          {ETIQUETAS_CANAL[canal.canal] ?? canal.canal}
                        </span>
                        <div className="flex-1">
                          <div className="w-full h-1.5 bg-slate-700 rounded-full">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${(canal.creados / maximo) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 w-32 text-right">
                          {canal.creados} tickets - {canal.resueltos} resueltos
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <CardTitle>Temas de Consulta Más Frecuentes</CardTitle>
              {temas.length === 0 ? (
                <p className="text-sm text-slate-500 mt-4">
                  Sin asuntos de ticket registrados en el periodo.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {temas.map((tema, i) => (
                    <div key={`${tema.tema}-${i}`} className="flex items-center gap-3">
                      <span className="text-sm text-slate-500 w-6">{i + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-white">{tema.tema}</span>
                          <span className="text-xs text-slate-400">{tema.cantidad} consultas</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${(tema.cantidad / maxTema) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <CardTitle>Áreas de Mejora Identificadas</CardTitle>
              {areasMejora.length === 0 ? (
                <div className="flex items-center gap-3 mt-4 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-green-200">
                    Sin desvíos relevantes en los indicadores del periodo.
                  </span>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {areasMejora.map((area, i) => (
                    <div
                      key={`${area}-${i}`}
                      className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg"
                    >
                      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{area}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Ediciones del Catálogo (OE5)</CardTitle>
                {periodoEdiciones && (
                  <span className="text-xs text-slate-500">Revisión {periodoEdiciones}</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Categorías, rubros y servicios señalados por la revisión trimestral del catálogo
                para este mismo periodo.
              </p>

              {!periodoEdiciones ? (
                <p className="text-sm text-slate-500 mt-4">
                  El periodo del reporte no permite asociar una revisión trimestral del catálogo.
                </p>
              ) : cargandoEdiciones ? (
                <p className="text-sm text-slate-500 mt-4 animate-pulse">Cargando ediciones...</p>
              ) : ediciones.length === 0 ? (
                <div className="flex items-center gap-3 mt-4 p-3 bg-slate-800/50 rounded-lg">
                  <Layers className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-400">
                    Sin ediciones registradas para {periodoEdiciones}. Se persisten al marcar la
                    revisión trimestral como revisada.
                  </span>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {ediciones.map((ed) => {
                    const nombre =
                      typeof ed.detalle?.nombre === 'string' ? ed.detalle.nombre : null;
                    return (
                      <div
                        key={ed.id_edicion}
                        className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-800/50 rounded-lg text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <span className="text-slate-200 font-medium">
                            {nombre ?? `Categoría #${ed.id_categoria}`}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 text-[11px]">
                            {ETIQUETAS_EDICION[ed.accion] ?? ed.accion}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatearFechaEdicion(ed.fecha_creacion)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <CardTitle>Métricas Detalladas</CardTitle>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  {
                    label: 'TPR promedio',
                    value: formatearMinutos(datos.tickets.tpr_promedio_min),
                  },
                  {
                    label: 'TR promedio',
                    value: formatearMinutos(datos.tickets.tr_promedio_min),
                  },
                  {
                    label: 'SLA cumplido',
                    value: `${datos.sla.pct_cumplimiento}%`,
                  },
                  {
                    label: 'SLA incumplido',
                    value: `${datos.sla.incumplidos} de ${datos.sla.total}`,
                  },
                  {
                    label: 'Uso Centro Ayuda',
                    value: `${datos.autoservicio?.uso_centro_ayuda ?? 0}%`,
                  },
                  {
                    label: 'Derivación Chatbot',
                    value: `${datos.autoservicio?.derivacion_chatbot ?? 0}%`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {canales.some(
            (canal) =>
              canal.tpr_promedio_min !== undefined || canal.tr_promedio_min !== undefined,
          ) && (
            <Card>
              <div className="p-4">
                <CardTitle>Tiempos por Canal</CardTitle>
                <div className="mt-4 space-y-2">
                  {canales.map((canal) => (
                    <div
                      key={canal.canal}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-800/50 rounded-lg text-sm"
                    >
                      <span className="text-slate-300 capitalize">
                        {ETIQUETAS_CANAL[canal.canal] ?? canal.canal}
                      </span>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>TPR: {formatearMinutos(canal.tpr_promedio_min ?? 0)}</span>
                        <span>TR: {formatearMinutos(canal.tr_promedio_min ?? 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
