'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { extractData, mensajeError } from '@/lib/api';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Send,
  CheckCircle,
  AlertTriangle,
  Download,
  Eye,
  Calendar,
  Layers,
  ArrowLeft,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';

interface ReporteFiscalTransaccion {
  id_reporte: string;
  id_transaccion: string;
  monto_base: number;
  comision_monto: number;
  iva_recaudado: number;
  alicuota: number;
  fecha_creacion: string;
  transaccion?: {
    id_transaccion: string;
    descripcion?: string;
    tipo_servicio?: string;
    estado?: string;
  };
}

interface ReporteFiscal {
  id_reporte: string;
  periodo: string;
  total_iva_recaudado: number | string;
  cantidad_transacciones: number;
  estado: 'pendiente' | 'enviado' | 'confirmado' | 'rechazado';
  fecha_generacion: string;
  fecha_envio?: string | null;
  respuesta_arca?: Record<string, unknown> | null;
  payload_enviado?: Record<string, unknown> | null;
  transacciones?: ReporteFiscalTransaccion[];
}

function periodoMesAnterior(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${anio}-${mes}`;
}

export default function AdminReporteFiscalPage() {
  const [reportes, setReportes] = useState<ReporteFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [accionando, setAccionando] = useState<string | null>(null);
  const [periodoInput, setPeriodoInput] = useState(periodoMesAnterior());
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Modales
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteFiscal | null>(null);
  const [transaccionesModal, setTransaccionesModal] = useState<ReporteFiscalTransaccion[] | null>(null);
  const [cargandoTx, setCargandoTx] = useState(false);

  const [payloadModal, setPayloadModal] = useState<{ id: string; payload: unknown } | null>(null);
  const [cargandoPayload, setCargandoPayload] = useState(false);

  const cargarReportes = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get<{ data?: ReporteFiscal[] }>('/reportes-fiscales');
      const data = extractData<ReporteFiscal[] | { data?: ReporteFiscal[] }>(res);
      const lista = Array.isArray(data) ? data : data?.data || [];
      setReportes(lista);
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeError(e, 'Error cargando reportes fiscales') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarReportes();
  }, [cargarReportes]);

  const generarReporte = async () => {
    if (!/^\d{4}-\d{2}$/.test(periodoInput)) {
      setMsg({ tipo: 'error', texto: 'El período debe tener formato AAAA-MM (ej: 2026-10)' });
      return;
    }
    setGenerando(true);
    setMsg(null);
    try {
      await api.post('/reportes-fiscales', { periodo: periodoInput });
      setMsg({ tipo: 'ok', texto: `Reporte fiscal para ${periodoInput} generado exitosamente` });
      await cargarReportes();
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeError(e, 'Error al generar reporte fiscal') });
    } finally {
      setGenerando(false);
    }
  };

  const verTransacciones = async (r: ReporteFiscal) => {
    setReporteSeleccionado(r);
    setCargandoTx(true);
    setTransaccionesModal(null);
    try {
      const res = await api.get<ReporteFiscalTransaccion[]>(`/reportes-fiscales/${r.id_reporte}/transacciones`);
      const data = extractData<ReporteFiscalTransaccion[]>(res);
      setTransaccionesModal(Array.isArray(data) ? data : []);
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeError(e, 'Error al cargar transacciones del reporte') });
    } finally {
      setCargandoTx(false);
    }
  };

  const verPayload = async (r: ReporteFiscal) => {
    setCargandoPayload(true);
    setPayloadModal(null);
    try {
      const res = await api.get(`/reportes-fiscales/${r.id_reporte}/payload`);
      const data = extractData<Record<string, unknown>>(res);
      setPayloadModal({ id: r.id_reporte, payload: data });
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeError(e, 'Error al generar payload ARCA') });
    } finally {
      setCargandoPayload(false);
    }
  };

  const enviarArca = async (id: string) => {
    setAccionando(id);
    setMsg(null);
    try {
      await api.patch(`/reportes-fiscales/${id}/enviar`, {
        respuesta_arca: {
          codigo_recepcion: `REC-ARCA-${Date.now().toString(36).toUpperCase()}`,
          estado: 'recibido_conforme',
          timestamp: new Date().toISOString(),
        },
      });
      setMsg({ tipo: 'ok', texto: 'Reporte enviado a ARCA y registrado como ENVIADO' });
      await cargarReportes();
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeError(e, 'Error al enviar reporte a ARCA') });
    } finally {
      setAccionando(null);
    }
  };

  const confirmarArca = async (id: string) => {
    setAccionando(id);
    setMsg(null);
    try {
      await api.patch(`/reportes-fiscales/${id}/confirmar`);
      setMsg({ tipo: 'ok', texto: 'Reporte fiscal confirmado por ARCA exitosamente' });
      await cargarReportes();
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeError(e, 'Error al confirmar reporte fiscal') });
    } finally {
      setAccionando(null);
    }
  };

  const descargarJson = (payload: unknown, periodo: string) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `reporte_fiscal_arca_${periodo}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const totalIvaAcumulado = reportes.reduce((acc, r) => acc + Number(r.total_iva_recaudado || 0), 0);
  const totalTransaccionesAuditadas = reportes.reduce((acc, r) => acc + Number(r.cantidad_transacciones || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header y navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/admin/reportes"
              className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Reportes
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
            Reportes Fiscales (RG 5794/2025 ARCA)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Módulo de recaudación de IVA, percepciones y auditoría de transacciones conforme a normativa ARCA (OE13).
          </p>
        </div>

        {/* Generar nuevo reporte */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
          <Calendar className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="text"
            value={periodoInput}
            onChange={(e) => setPeriodoInput(e.target.value)}
            placeholder="AAAA-MM"
            className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-center"
          />
          <Button
            onClick={generarReporte}
            disabled={generando}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generando ? 'animate-spin' : ''}`} />
            {generando ? 'Generando...' : 'Generar Reporte'}
          </Button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            msg.tipo === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {msg.tipo === 'ok' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span>{msg.texto}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reportes Emitidos</span>
            <FileText className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{reportes.length}</div>
          <p className="text-xs text-slate-500 mt-1">Períodos fiscales procesados</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">IVA Total Recaudado</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            ${totalIvaAcumulado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1">Alícuota general 21%</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transacciones Auditadas</span>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalTransaccionesAuditadas}</div>
          <p className="text-xs text-slate-500 mt-1">Operaciones vinculadas y congeladas</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Normativa Aplicable</span>
            <Layers className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-base font-bold text-white">RG 5794/2025</div>
          <p className="text-xs text-slate-500 mt-1">ARCA (Ex AFIP) · Plataformas digitales</p>
        </Card>
      </div>

      {/* Tabla de Reportes */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg text-white">Historial de Reportes Fiscales Mensuales</CardTitle>
          <button
            onClick={cargarReportes}
            disabled={loading}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : reportes.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-base font-medium">No se han generado reportes fiscales aún</p>
            <p className="text-xs text-slate-500 mt-1">
              Indicá un período (ej. 2026-10) y presioná &quot;Generar Reporte&quot; para crear la primera declaración.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Período</th>
                  <th className="py-3 px-3">Transacciones</th>
                  <th className="py-3 px-3">Total IVA Recaudado</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3">Fecha Generación</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {reportes.map((r) => {
                  const estadoColor =
                    r.estado === 'confirmado'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : r.estado === 'enviado'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';

                  return (
                    <tr key={r.id_reporte} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-white font-mono">{r.periodo}</td>
                      <td className="py-3 px-3 text-slate-300">
                        <button
                          onClick={() => verTransacciones(r)}
                          className="hover:underline flex items-center gap-1.5 text-cyan-400"
                        >
                          {r.cantidad_transacciones} tx
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="py-3 px-3 text-emerald-400 font-mono font-medium">
                        ${Number(r.total_iva_recaudado).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${estadoColor}`}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{formatDate(r.fecha_generacion)}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => verPayload(r)}
                            disabled={cargandoPayload}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors border border-slate-700 flex items-center gap-1"
                            title="Ver Payload ARCA"
                          >
                            <FileText className="w-3.5 h-3.5 text-purple-400" />
                            Payload
                          </button>

                          {r.estado === 'pendiente' && (
                            <button
                              onClick={() => enviarArca(r.id_reporte)}
                              disabled={accionando === r.id_reporte}
                              className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs rounded-lg transition-colors flex items-center gap-1"
                              title="Simular envío a ARCA"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Enviar
                            </button>
                          )}

                          {r.estado === 'enviado' && (
                            <button
                              onClick={() => confirmarArca(r.id_reporte)}
                              disabled={accionando === r.id_reporte}
                              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs rounded-lg transition-colors flex items-center gap-1"
                              title="Confirmar recepción"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Confirmar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Transacciones Asociadas al Reporte */}
      {reporteSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  Transacciones del Período {reporteSeleccionado.periodo}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detalle auditado de operaciones comerciales que integran la base imponible del reporte fiscal.
                </p>
              </div>
              <button
                onClick={() => setReporteSeleccionado(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              {cargandoTx ? (
                <div className="py-12 text-center text-slate-400 animate-pulse">Cargando transacciones auditadas...</div>
              ) : !transaccionesModal || transaccionesModal.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p>No se encontraron transacciones asociadas individualmente para este reporte.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    (Los reportes previos a la migración histórica guardan el agregado numérico; los nuevos conservan el detalle 1 a N).
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">ID Transacción</th>
                        <th className="py-2.5 px-3">Monto Base</th>
                        <th className="py-2.5 px-3">Comisión</th>
                        <th className="py-2.5 px-3">IVA Recaudado</th>
                        <th className="py-2.5 px-3">Alícuota</th>
                        <th className="py-2.5 px-3">Fecha Fijación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-xs">
                      {transaccionesModal.map((tx) => (
                        <tr key={tx.id_transaccion} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 text-cyan-400 truncate max-w-[180px]">{tx.id_transaccion}</td>
                          <td className="py-2.5 px-3 text-white">${Number(tx.monto_base).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-slate-300">${Number(tx.comision_monto).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-semibold">${Number(tx.iva_recaudado).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-slate-400">{Number(tx.alicuota)}%</td>
                          <td className="py-2.5 px-3 text-slate-500 font-sans">{formatDate(tx.fecha_creacion)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
              <Button onClick={() => setReporteSeleccionado(null)} className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Payload ARCA */}
      {payloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Estructura JSON Payload ARCA (RG 5794/2025)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Payload oficial para el régimen de información y recaudación de plataformas.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => descargarJson(payloadModal.payload, payloadModal.id)}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar JSON
                </Button>
                <button
                  onClick={() => setPayloadModal(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 flex-1 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-300">
              <pre className="whitespace-pre-wrap">{JSON.stringify(payloadModal.payload, null, 2)}</pre>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
              <Button onClick={() => setPayloadModal(null)} className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
