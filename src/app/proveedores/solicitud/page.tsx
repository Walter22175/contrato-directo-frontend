'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import {
  FilePlus, CheckCircle, Clock, Send, Star,
  ThumbsUp, MessageSquare, CalendarClock,
} from 'lucide-react';
import Link from 'next/link';

interface Solicitud {
  id_solicitud: number;
  nombre_propuesto: string;
  tipo: string;
  descripcion?: string;
  justificacion?: string;
  estado: string;
  origen?: string;
  fecha_solicitud: string;
  fecha_limite_legal?: string;
  fecha_limite_implementacion?: string;
  fecha_resolucion?: string;
  observaciones?: string;
  evaluacion_proceso?: number | null;
  evaluacion_comentario?: string | null;
  apoyos_count?: number;
  apoyos_min?: number;
}

type RespuestaLista<T> = T[] & { data?: T[] };

const mensajeDeApi = (err: unknown): string | string[] | undefined =>
  (err as { response?: { data?: { message?: string | string[] } } } | undefined)?.response?.data
    ?.message;

export default function SolicitudRubroPage() {
  const { user } = useAuthStore();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [accionando, setAccionando] = useState<number | null>(null);
  const [evaluando, setEvaluando] = useState<number | null>(null);
  const [form, setForm] = useState({ tipo: 'rubro', nombre_propuesto: '', descripcion: '', justificacion: '' });

  const fetchSolicitudes = useCallback(async () => {
    if (!user?.id_usuario) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/solicitud-rubro');
      const data = extractData<RespuestaLista<Solicitud>>(res);
      setSolicitudes(data?.data || data || []);
    } catch {
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id_usuario]);

  useEffect(() => { fetchSolicitudes(); }, [fetchSolicitudes]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nombre_propuesto.trim() || !form.descripcion.trim()) return;
    setSending(true);
    setFormError(null);
    try {
      await api.post('/solicitud-rubro', {
        tipo: form.tipo,
        nombre_propuesto: form.nombre_propuesto.trim(),
        descripcion: form.descripcion.trim(),
        justificacion: form.justificacion.trim() || undefined,
      });
      setForm({ tipo: 'rubro', nombre_propuesto: '', descripcion: '', justificacion: '' });
      setShowForm(false);
      setMsg({ tipo: 'ok', texto: 'Solicitud enviada. SLA de revisión legal: 5 días hábiles.' });
      await fetchSolicitudes();
    } catch (err) {
      const m = mensajeDeApi(err) || 'No se pudo enviar la solicitud.';
      setFormError(Array.isArray(m) ? m.join(' — ') : String(m));
    } finally {
      setSending(false);
    }
  };

  const apoyar = async (s: Solicitud) => {
    setAccionando(s.id_solicitud);
    setMsg(null);
    try {
      await api.post(`/solicitud-rubro/${s.id_solicitud}/apoyar`);
      setMsg({ tipo: 'ok', texto: 'Apoyo registrado. Gracias por impulsar este rubro.' });
      await fetchSolicitudes();
    } catch (e) {
      const m = mensajeDeApi(e) || 'No se pudo registrar el apoyo';
      setMsg({ tipo: 'error', texto: Array.isArray(m) ? m.join(' — ') : String(m) });
    } finally {
      setAccionando(null);
    }
  };

  const evaluar = async (s: Solicitud, puntuacion: number) => {
    setEvaluando(s.id_solicitud);
    setMsg(null);
    try {
      await api.post(`/solicitud-rubro/${s.id_solicitud}/evaluar`, { puntuacion });
      setMsg({ tipo: 'ok', texto: '¡Gracias! Tu evaluación alimenta la métrica de satisfacción del proceso.' });
      await fetchSolicitudes();
    } catch (e) {
      const m = mensajeDeApi(e) || 'No se pudo evaluar el proceso';
      setMsg({ tipo: 'error', texto: Array.isArray(m) ? m.join(' — ') : String(m) });
    } finally {
      setEvaluando(null);
    }
  };

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  const estadoLabels: Record<string, { label: string; cls: string }> = {
    pendiente: { label: 'Pendiente', cls: 'text-yellow-400 bg-yellow-500/10' },
    aprobado: { label: 'Aprobado', cls: 'text-green-400 bg-green-500/10' },
    rechazado: { label: 'Rechazado', cls: 'text-red-400 bg-red-500/10' },
    en_revision: { label: 'En revisión', cls: 'text-blue-400 bg-blue-500/10' },
    vencida: { label: 'Vencida', cls: 'text-orange-400 bg-orange-500/10' },
  };

  const inputCls = 'w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent';

  return (
    <main className="flex-1">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Solicitar Nuevo Rubro</h1>
            <p className="text-slate-400 mt-1">Proponé un nuevo rubro o servicio para el catálogo</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <FilePlus className="w-4 h-4" />
            Nueva Solicitud
          </button>
        </div>

        {/* Info de proceso (SLAs) */}
        <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-xs text-slate-400 space-y-1">
          <p className="flex items-center gap-2 text-slate-300 font-medium text-sm mb-1">
            <Clock className="w-4 h-4 text-cyan-400" /> Cómo funciona el proceso
          </p>
          <p>· Revisión legal: <span className="text-white">5 días hábiles</span> desde el envío.</p>
          <p>· Tras aprobación: implementación en <span className="text-white">7 días hábiles</span>.</p>
          <p>· Apoyos de proveedores verificados: <span className="text-white">5 para rubros</span>, <span className="text-white">2 para servicios</span>.</p>
        </div>

        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            msg.tipo === 'ok' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {msg.texto}
          </div>
        )}

        {showForm && (
          <Card>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                  {formError}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
                  <select
                    className={inputCls}
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="rubro">Rubro</option>
                    <option value="servicio">Servicio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Nombre Propuesto</label>
                  <input
                    className={inputCls}
                    placeholder="Ej: Instalación de Paneles Solares"
                    value={form.nombre_propuesto}
                    onChange={(e) => setForm({ ...form, nombre_propuesto: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
                <textarea
                  className={inputCls + ' min-h-[80px] resize-y'}
                  placeholder="Describí el tipo de servicios que incluiría este rubro..."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Justificación</label>
                <textarea
                  className={inputCls + ' min-h-[80px] resize-y'}
                  placeholder="¿Por qué debería agregarse este rubro al catálogo?"
                  value={form.justificacion}
                  onChange={(e) => setForm({ ...form, justificacion: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </Card>
        )}

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">Mis Solicitudes</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !user?.id_usuario ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">Iniciá sesión para ver y enviar solicitudes de rubro</p>
                <Link
                  href="/login"
                  className="inline-flex px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Iniciar sesión
                </Link>
              </div>
            </Card>
          ) : solicitudes.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <FilePlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Aún no enviaste solicitudes de rubro</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {solicitudes.map((s) => {
                const est = estadoLabels[s.estado] || { label: s.estado, cls: 'text-slate-400 bg-slate-500/10' };
                const resuelta = ['aprobado', 'rechazado'].includes(s.estado);
                return (
                  <Card key={s.id_solicitud}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-white">{s.nombre_propuesto}</h3>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">{s.tipo}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${est.cls}`}>{est.label}</span>
                            {s.origen === 'umbral_automatico' && (
                              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">Automática</span>
                            )}
                          </div>
                          {s.descripcion && <p className="text-sm text-slate-400 mt-1">{s.descripcion}</p>}
                          {s.justificacion && (
                            <p className="text-xs text-slate-500 mt-1">
                              <span className="text-slate-400 font-medium">Justificación:</span> {s.justificacion}
                            </p>
                          )}
                          {s.observaciones && resuelta && (
                            <p className="text-xs text-slate-500 mt-1 italic">Motivo / comunicación: {s.observaciones}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Enviada: {formatearFecha(s.fecha_solicitud)}
                            </span>
                            {s.fecha_limite_legal && !resuelta && (
                              <span className="flex items-center gap-1 text-cyan-400">
                                <CalendarClock className="w-3 h-3" />
                                SLA legal hasta: {formatearFecha(s.fecha_limite_legal)}
                              </span>
                            )}
                            {s.estado === 'aprobado' && s.fecha_limite_implementacion && (
                              <span className="flex items-center gap-1 text-cyan-400">
                                <CalendarClock className="w-3 h-3" />
                                Implementación hasta: {formatearFecha(s.fecha_limite_implementacion)}
                              </span>
                            )}
                            {typeof s.apoyos_count === 'number' && (
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3" />
                                Apoyos: {s.apoyos_count}/{s.apoyos_min ?? (s.tipo === 'rubro' ? 5 : 2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {!resuelta && (
                          <button
                            onClick={() => apoyar(s)}
                            disabled={accionando === s.id_solicitud}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            title="Manifestar interés como proveedor verificado"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {accionando === s.id_solicitud ? 'Registrando...' : 'Apoyar este rubro'}
                          </button>
                        )}
                        {resuelta && s.estado === 'aprobado' && s.evaluacion_proceso == null && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" />
                              ¿Cómo fue el proceso?
                            </span>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                onClick={() => evaluar(s, n)}
                                disabled={evaluando === s.id_solicitud}
                                className="p-1 disabled:opacity-50"
                                aria-label={`Evaluar con ${n} de 5`}
                              >
                                <Star className="w-4 h-4 text-slate-600 hover:text-yellow-400 hover:fill-yellow-400 transition-colors" />
                              </button>
                            ))}
                          </div>
                        )}
                        {resuelta && typeof s.evaluacion_proceso === 'number' && (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Proceso evaluado: {s.evaluacion_proceso}/5
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
