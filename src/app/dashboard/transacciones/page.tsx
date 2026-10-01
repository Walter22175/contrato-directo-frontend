'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Handshake,
  Send,
  X,
} from 'lucide-react';
import type { Transaccion } from '@/types';

const estadoColors: Record<string, string> = {
  pendiente: 'text-yellow-400 bg-yellow-400/10',
  en_proceso: 'text-blue-400 bg-blue-400/10',
  en_custodia: 'text-cyan-400 bg-cyan-400/10',
  completada: 'text-green-400 bg-green-400/10',
  cancelada: 'text-red-400 bg-red-400/10',
  en_disputa: 'text-orange-400 bg-orange-400/10',
  reembolsada: 'text-purple-400 bg-purple-400/10',
};

const estadoIcons: Record<string, typeof Clock> = {
  pendiente: Clock,
  en_proceso: AlertCircle,
  en_custodia: ShieldCheck,
  completada: CheckCircle,
  cancelada: XCircle,
  en_disputa: AlertCircle,
  reembolsada: XCircle,
};

const FILTROS = [
  'todas',
  'pendiente',
  'en_proceso',
  'en_custodia',
  'completada',
  'en_disputa',
  'cancelada',
];

type Modal = 'conformidad' | 'reembolso' | null;

export default function TransaccionesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [filtro, setFiltro] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [accionando, setAccionando] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [txModal, setTxModal] = useState<Transaccion | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const [porcentaje, setPorcentaje] = useState('100');
  const [comentario, setComentario] = useState('');
  const [montoReembolso, setMontoReembolso] = useState('');
  const [motivoReembolso, setMotivoReembolso] = useState('');

  const fetchTransacciones = useCallback(async () => {
    try {
      const res = await api.get('/transacciones');
      const raw = extractData<Transaccion[] | { data: Transaccion[] } | null>(res);
      const lista = Array.isArray(raw) ? raw : raw?.data || [];
      setTransacciones(lista);
    } catch {
      setTransacciones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const inicio = async () => {
      await fetchTransacciones();
    };
    void inicio();
  }, [fetchTransacciones]);

  const accion = async (
    id: string,
    metodo: 'post' | 'patch',
    url: string,
    body?: unknown,
    okMsg = 'Acción realizada',
  ) => {
    setAccionando(id + url);
    setMsg(null);
    try {
      if (metodo === 'post') await api.post(url, body);
      else await api.patch(url, body);
      setMsg({ tipo: 'ok', texto: okMsg });
      await fetchTransacciones();
    } catch (e) {
      const err = e as { response?: { data?: { message?: unknown } }; message?: string };
      const m =
        err?.response?.data?.message || err?.message || 'No se pudo completar la acción';
      setMsg({ tipo: 'error', texto: Array.isArray(m) ? m.join(', ') : String(m ?? 'No se pudo completar la acción') });
    } finally {
      setAccionando(null);
    }
  };

  const enviarConformidad = async () => {
    if (!txModal) return;
    const pct = parseInt(porcentaje, 10);
    if (!pct || pct < 1 || pct > 100) {
      setMsg({ tipo: 'error', texto: 'El porcentaje debe estar entre 1 y 100' });
      return;
    }
    await accion(
      txModal.id_transaccion,
      'post',
      `/transacciones/${txModal.id_transaccion}/conformidad`,
      { porcentaje: pct, comentario: comentario || undefined },
      pct >= 100
        ? 'Conformidad registrada. El pago se liberará en 24 horas hábiles.'
        : `Conformidad parcial del ${pct}% registrada. La parte aceptada se libera; el resto queda en disputa.`,
    );
    setModal(null);
    setTxModal(null);
    setComentario('');
    setPorcentaje('100');
  };

  const enviarReembolso = async () => {
    if (!txModal) return;
    const monto = parseFloat(montoReembolso);
    if (!monto || monto <= 0) {
      setMsg({ tipo: 'error', texto: 'Ingresá un monto válido' });
      return;
    }
    if (!motivoReembolso.trim()) {
      setMsg({ tipo: 'error', texto: 'Contanos el motivo del reembolso' });
      return;
    }
    await accion(
      txModal.id_transaccion,
      'post',
      '/reembolsos',
      {
        id_transaccion: txModal.id_transaccion,
        monto_solicitado: monto,
        motivo: motivoReembolso,
      },
      'Solicitud de reembolso enviada. Plazo máximo de resolución: 10 días hábiles.',
    );
    setModal(null);
    setTxModal(null);
    setMontoReembolso('');
    setMotivoReembolso('');
  };

  const filtradas = transacciones.filter((t) => {
    if (filtro === 'todas') return true;
    return t.estado === filtro;
  });

  const ocupado = (id: string) => accionando !== null && accionando.startsWith(id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Mis Transacciones</h1>
        <p className="text-slate-400 mt-1">
          Ofertas, pagos en custodia y conformidad del servicio
        </p>
      </div>

      {msg && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            msg.tipo === 'ok'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {msg.texto}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTROS.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtro === f
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
            }`}
          >
            {f === 'todas' ? 'Todas' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Sin transacciones</h2>
            <p className="text-slate-400">Tus transacciones aparecerán aquí cuando contrates un servicio.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtradas.map((t) => {
            const Icon = estadoIcons[t.estado] || Clock;
            const esCliente = !!user && t.id_cliente === user.id_usuario;
            const esProveedor = !!user && t.id_proveedor === user.id_usuario;
            const busy = ocupado(t.id_transaccion);

            return (
              <Card key={t.id_transaccion}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${estadoColors[t.estado] || 'text-slate-400 bg-slate-700/50'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {t.servicio?.nombre || 'Servicio'}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {t.descripcion || `Transacción #${t.id_transaccion.slice(0, 8)}`}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                      <span>{esCliente ? 'Sos cliente' : esProveedor ? 'Sos proveedor' : ''}</span>
                      {t.fecha_limite_conformidad && !t.fecha_conformidad && (
                        <span className="text-yellow-500/80">
                          Conformidad hasta: {formatDate(t.fecha_limite_conformidad)}
                        </span>
                      )}
                      {t.fecha_liberacion_programada && !t.fecha_liberacion && (
                        <span className="text-cyan-400/80">
                          Liberación: {formatDate(t.fecha_liberacion_programada)}
                        </span>
                      )}
                      {t.fondos_retenidos && (
                        <span className="text-orange-400 font-medium">Fondos retenidos</span>
                      )}
                      {typeof t.conformidad_porcentaje === 'number' &&
                        t.conformidad_porcentaje < 100 && (
                          <span className="text-orange-400">
                            Conformidad parcial: {t.conformidad_porcentaje}%
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{formatCurrency(t.monto_acordado)}</p>
                    <p className="text-xs text-slate-500">{formatDate(t.fecha_creacion)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColors[t.estado] || 'text-slate-400 bg-slate-700/50'}`}>
                    {t.estado.replace('_', ' ')}
                  </span>
                </div>

                {/* Acciones según estado y rol */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/60">
                  {t.estado === 'pendiente' && esProveedor && (
                    <>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          accion(t.id_transaccion, 'post', `/transacciones/${t.id_transaccion}/aceptar`, undefined, 'Oferta aceptada. El cliente ya puede pagar.')
                        }
                      >
                        {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                        Aceptar oferta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          accion(t.id_transaccion, 'post', `/transacciones/${t.id_transaccion}/rechazar`, undefined, 'Oferta rechazada.')
                        }
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rechazar
                      </Button>
                    </>
                  )}

                  {t.estado === 'pendiente' && esCliente && (
                    <span className="text-xs text-slate-400 self-center">
                      Esperando la aceptación del proveedor…
                    </span>
                  )}

                  {t.estado === 'en_proceso' && esCliente && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => router.push(`/checkout?id_transaccion=${t.id_transaccion}`)}
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Pagar con custodia
                    </Button>
                  )}

                  {t.estado === 'en_proceso' && esProveedor && (
                    <span className="text-xs text-slate-400 self-center">
                      Esperando el pago del cliente…
                    </span>
                  )}

                  {t.estado === 'en_custodia' && !t.fecha_fin_servicio && esProveedor && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        accion(
                          t.id_transaccion,
                          'post',
                          `/transacciones/${t.id_transaccion}/completar-servicio`,
                          undefined,
                          'Servicio finalizado. El cliente tiene 72 horas hábiles para dar conformidad.',
                        )
                      }
                    >
                      {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Handshake className="w-4 h-4 mr-1" />}
                      Marcar servicio completado
                    </Button>
                  )}

                  {t.estado === 'en_custodia' && !t.fecha_fin_servicio && esCliente && (
                    <span className="text-xs text-slate-400 self-center">
                      Pago en custodia. Esperando que el proveedor finalice el servicio…
                    </span>
                  )}

                  {t.estado === 'en_custodia' &&
                    t.fecha_fin_servicio &&
                    !t.fecha_conformidad &&
                    esCliente && (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          setTxModal(t);
                          setPorcentaje('100');
                          setComentario('');
                          setModal('conformidad');
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Dar conformidad
                      </Button>
                    )}

                  {t.estado === 'en_custodia' && t.fecha_fin_servicio && !t.fecha_conformidad && esProveedor && (
                    <span className="text-xs text-slate-400 self-center">
                      Esperando la conformidad del cliente…
                    </span>
                  )}

                  {(t.estado === 'en_disputa' || t.estado === 'completada') && esCliente && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setTxModal(t);
                        setMontoReembolso(String(t.monto_acordado));
                        setMotivoReembolso('');
                        setModal('reembolso');
                      }}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Solicitar reembolso
                    </Button>
                  )}

                  {t.estado === 'completada' && t.fecha_liberacion && (
                    <span className="text-xs text-green-400/80 self-center">
                      Pago liberado el {formatDate(t.fecha_liberacion)}
                      {typeof t.monto_liberado === 'number' &&
                        ` — proveedor recibió ${formatCurrency(t.monto_liberado)}`}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal conformidad */}
      {modal === 'conformidad' && txModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Conformidad del servicio</CardTitle>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-xs text-slate-400">
                Monto en custodia: <span className="text-white font-semibold">{formatCurrency(txModal.monto_acordado)}</span>.
                Al confirmar, el pago se libera al proveedor en 24 horas hábiles
                (se deduce la comisión del 8%). Si el trabajo está incompleto, indicá un
                porcentaje menor a 100: esa parte queda retenida y se abre una disputa.
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Porcentaje conforme (1-100)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={porcentaje}
                  onChange={(e) => setPorcentaje(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Comentario (opcional)</label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Contanos cómo quedó el trabajo…"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={enviarConformidad} disabled={!!accionando}>
                  {accionando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Confirmar conformidad
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal reembolso */}
      {modal === 'reembolso' && txModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Solicitar reembolso</CardTitle>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-xs text-slate-400">
                El reembolso se devuelve al medio de pago original dentro de los
                10 días hábiles de su aprobación.
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Monto a reembolsar ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={montoReembolso}
                  onChange={(e) => setMontoReembolso(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Motivo</label>
                <textarea
                  value={motivoReembolso}
                  onChange={(e) => setMotivoReembolso(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Explicá por qué solicitás el reembolso…"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={enviarReembolso} disabled={!!accionando}>
                  {accionando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Enviar solicitud
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
