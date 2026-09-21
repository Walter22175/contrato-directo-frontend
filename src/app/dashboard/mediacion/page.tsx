'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import {
  Scale,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Send,
  User,
  Calendar,
  FileText,
  Ban,
  Gavel,
  Shield,
} from 'lucide-react';
import type { Mediacion, ResolverMediacionDto, AsignarMediadorDto, ConvocarAudienciaDto } from '@/types';

const ESTADO_COLORS: Record<string, string> = {
  asignada: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  en_analisis: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  audiencia_convocada: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  resuelta: 'text-green-400 bg-green-500/10 border-green-500/20',
  en_cumplimiento: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  cerrada: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

const ESTADO_LABELS: Record<string, string> = {
  asignada: 'Asignada',
  en_analisis: 'En análisis',
  audiencia_convocada: 'Audiencia Convocada',
  resuelta: 'Resuelta',
  en_cumplimiento: 'En Cumplimiento',
  cerrada: 'Cerrada',
};

const ETAPAS = ['asignada', 'en_analisis', 'audiencia_convocada', 'resuelta', 'en_cumplimiento', 'cerrada'];

const TIPOS_RESOLUCION = [
  { value: 'desestimacion', label: 'Desestimación del reclamo' },
  { value: 'estimacion_total', label: 'Estimación total del reclamo' },
  { value: 'reembolso_total', label: 'Reembolso total' },
  { value: 'reembolso_parcial', label: 'Reembolso parcial' },
  { value: 'liberacion_pago', label: 'Liberación de pago' },
  { value: 'retencion_pago', label: 'Retención de pago' },
  { value: 'compensacion_economica', label: 'Compensación económica' },
  { value: 'reparacion_servicio', label: 'Reparación del servicio' },
  { value: 'cancelacion_transaccion', label: 'Cancelación de la transacción' },
  { value: 'medidas_correctivas', label: 'Medidas correctivas' },
];

export default function MediacionPage() {
  const { user } = useAuthStore();
  const [mediaciones, setMediaciones] = useState<Mediacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Mediacion | null>(null);
  const [tab, setTab] = useState<'en_proceso' | 'resueltas' | 'todas'>('en_proceso');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  const [showResolver, setShowResolver] = useState(false);
  const [resolverForm, setResolverForm] = useState<ResolverMediacionDto>({ tipo_resolucion: '', fundamentos: '', plazo_cumplimiento_dias: 5 });

  const [showAsignar, setShowAsignar] = useState(false);
  const [asignarForm, setAsignarForm] = useState<AsignarMediadorDto>({ id_mediador: '' });

  const [showAudiencia, setShowAudiencia] = useState(false);
  const [audienciaForm, setAudienciaForm] = useState<ConvocarAudienciaDto>({ fecha_audiencia: '', audiencia_virtual: true, duracion_audiencia_minutos: 30 });

  const fetchMediaciones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/mediacion');
      const data = extractData<any>(res);
      let list = data?.data || data || [];
      if (tab === 'en_proceso') list = list.filter((m: Mediacion) => !['resuelta', 'cerrada'].includes(m.estado));
      else if (tab === 'resueltas') list = list.filter((m: Mediacion) => ['resuelta', 'cerrada'].includes(m.estado));
      setMediaciones(list);
    } catch {
      setMediaciones([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchMediaciones(); }, [fetchMediaciones]);

  const fetchDetalle = async (id: string) => {
    try {
      const res = await api.get(`/mediacion/${id}`);
      const data = extractData<any>(res);
      setDetalle(data);
      setSelected(id);
      setMsg(null);
      setShowResolver(false);
      setShowAsignar(false);
      setShowAudiencia(false);
    } catch {}
  };

  const handleAsignar = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSending(true);
    setMsg(null);
    try {
      await api.patch(`/mediacion/${selected}/asignar`, asignarForm);
      setShowAsignar(false);
      await fetchDetalle(selected);
      await fetchMediaciones();
      setMsg({ type: 'success', text: 'Mediador asignado correctamente' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error al asignar mediador' });
    } finally {
      setSending(false);
    }
  };

  const handleConvocarAudiencia = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSending(true);
    setMsg(null);
    try {
      await api.patch(`/mediacion/${selected}/audiencia`, audienciaForm);
      setShowAudiencia(false);
      await fetchDetalle(selected);
      setMsg({ type: 'success', text: 'Audiencia convocada correctamente' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error al convocar audiencia' });
    } finally {
      setSending(false);
    }
  };

  const handleResolver = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSending(true);
    setMsg(null);
    try {
      await api.patch(`/reclamos/mediacion/${selected}/resolver`, resolverForm);
      setShowResolver(false);
      await fetchDetalle(selected);
      await fetchMediaciones();
      setMsg({ type: 'success', text: 'Resolución emitida correctamente' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error al resolver' });
    } finally {
      setSending(false);
    }
  };

  const formatearFecha = (f: string) => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const inputCls = 'w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent';
  const labelCls = 'block text-sm font-medium text-slate-300 mb-1';

  if (selected && detalle) {
    const currentStep = ETAPAS.indexOf(detalle.estado);
    return (
      <div className="space-y-4">
        <button onClick={() => { setSelected(null); setDetalle(null); setMsg(null); }} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        {msg && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {msg.text}
          </div>
        )}

        {/* Timeline */}
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between overflow-x-auto">
              {ETAPAS.map((step, i) => (
                <div key={step} className="flex items-center min-w-0">
                  <div className={`flex flex-col items-center ${i <= currentStep ? 'text-cyan-400' : 'text-slate-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${i < currentStep ? 'bg-cyan-500/20 border-cyan-500' : i === currentStep ? 'bg-cyan-500/20 border-cyan-400 animate-pulse' : 'bg-slate-800 border-slate-700'}`}>
                      {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className="text-[10px] mt-1 whitespace-nowrap">{ESTADO_LABELS[step]}</span>
                  </div>
                  {i < ETAPAS.length - 1 && <div className={`w-8 md:w-16 h-0.5 mx-0.5 ${i < currentStep ? 'bg-cyan-500' : 'bg-slate-700'}`} />}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Info general */}
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Mediación #{detalle.id_mediacion?.slice(0, 8)}</h2>
                {detalle.reclamo && <p className="text-sm text-slate-400">{detalle.reclamo.tipo_reclamo}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded border ${ESTADO_COLORS[detalle.estado] || ''}`}>{ESTADO_LABELS[detalle.estado]}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-400"><Calendar className="w-4 h-4" /> Asignación: {formatearFecha(detalle.fecha_asignacion)}</div>
              {detalle.mediador && <div className="flex items-center gap-2 text-slate-400"><User className="w-4 h-4" /> Mediador: {detalle.mediador.nombre}</div>}
              {detalle.fecha_audiencia && <div className="flex items-center gap-2 text-slate-400"><Gavel className="w-4 h-4" /> Audiencia: {formatearFecha(detalle.fecha_audiencia)}</div>}
              {detalle.fecha_limite_resolucion && <div className="flex items-center gap-2 text-yellow-400"><Clock className="w-4 h-4" /> Límite: {formatearFecha(detalle.fecha_limite_resolucion)}</div>}
            </div>
          </div>
        </Card>

        {/* Resolución */}
        {detalle.resolucion && (
          <Card>
            <div className="p-6 space-y-3">
              <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2"><FileText className="w-4 h-4" /> Resolución</h3>
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg space-y-2">
                <p className="text-sm font-medium text-green-400">{TIPOS_RESOLUCION.find((t) => t.value === detalle.resolucion!.tipo_resolucion)?.label}</p>
                {detalle.resolucion.fundamentos && <p className="text-sm text-slate-300">{detalle.resolucion.fundamentos}</p>}
                {detalle.resolucion.plazo_cumplimiento_dias && <p className="text-xs text-slate-500">Plazo: {detalle.resolucion.plazo_cumplimiento_dias} días</p>}
              </div>

              {detalle.resolucion.apelaciones && detalle.resolucion.apelaciones.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-xs font-medium text-slate-400">Apelaciones</h4>
                  {detalle.resolucion.apelaciones.map((a) => (
                    <div key={a.id_apelacion} className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                      <p className="text-sm text-slate-300">{a.motivo}</p>
                      <p className="text-xs text-slate-500 mt-1">Estado: {a.estado}</p>
                      {a.resolucion_final && <p className="text-xs text-green-400 mt-1">Resolución: {a.resolucion_final}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Sanciones */}
        {detalle.sanciones && detalle.sanciones.length > 0 && (
          <Card>
            <div className="p-4 space-y-2">
              <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2"><Shield className="w-4 h-4" /> Sanciones</h3>
              {detalle.sanciones.map((s) => (
                <div key={s.id_sancion} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-slate-300">{s.tipo_sancion}: {s.descripcion}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.fecha_fin ? `${formatearFecha(s.fecha_inicio)} - ${formatearFecha(s.fecha_fin)}` : formatearFecha(s.fecha_inicio)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Acciones admin */}
        <Card>
          <div className="p-4 flex flex-wrap gap-3">
            {detalle.estado === 'asignada' && (
              <button onClick={() => { setShowAsignar(true); setMsg(null); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-600/30 transition-colors">
                <User className="w-4 h-4" /> Asignar Mediador
              </button>
            )}
            {detalle.estado === 'en_analisis' && (
              <button onClick={() => { setShowAudiencia(true); setMsg(null); }} className="flex items-center gap-2 px-4 py-2 bg-orange-600/20 text-orange-400 border border-orange-500/30 rounded-lg text-sm hover:bg-orange-600/30 transition-colors">
                <Gavel className="w-4 h-4" /> Convocar Audiencia
              </button>
            )}
            {['en_analisis', 'audiencia_convocada'].includes(detalle.estado) && (
              <button onClick={() => { setShowResolver(true); setMsg(null); }} className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-600/30 transition-colors">
                <Scale className="w-4 h-4" /> Emitir Resolución
              </button>
            )}
          </div>
        </Card>

        {/* Form Asignar */}
        {showAsignar && (
          <Card>
            <form onSubmit={handleAsignar} className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Asignar Mediador</h3>
              <div>
                <label className={labelCls}>ID Mediador *</label>
                <input className={inputCls} value={asignarForm.id_mediador} onChange={(e) => setAsignarForm({ ...asignarForm, id_mediador: e.target.value })} required placeholder="UUID del mediador" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAsignar(false)} className="px-4 py-2.5 text-slate-400 hover:text-white text-sm">Cancelar</button>
                <button type="submit" disabled={sending} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">{sending ? 'Asignando...' : 'Asignar'}</button>
              </div>
            </form>
          </Card>
        )}

        {/* Form Audiencia */}
        {showAudiencia && (
          <Card>
            <form onSubmit={handleConvocarAudiencia} className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Convocar Audiencia Virtual</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Fecha y Hora *</label>
                  <input className={inputCls} type="datetime-local" value={audienciaForm.fecha_audiencia} onChange={(e) => setAudienciaForm({ ...audienciaForm, fecha_audiencia: e.target.value })} required />
                </div>
                <div>
                  <label className={labelCls}>Duración (minutos)</label>
                  <input className={inputCls} type="number" min={1} max={30} value={audienciaForm.duracion_audiencia_minutos} onChange={(e) => setAudienciaForm({ ...audienciaForm, duracion_audiencia_minutos: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAudiencia(false)} className="px-4 py-2.5 text-slate-400 hover:text-white text-sm">Cancelar</button>
                <button type="submit" disabled={sending} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">{sending ? 'Convocando...' : 'Convocar'}</button>
              </div>
            </form>
          </Card>
        )}

        {/* Form Resolver */}
        {showResolver && (
          <Card>
            <form onSubmit={handleResolver} className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Emitir Resolución</h3>
              <div>
                <label className={labelCls}>Tipo de Resolución *</label>
                <select className={inputCls} value={resolverForm.tipo_resolucion} onChange={(e) => setResolverForm({ ...resolverForm, tipo_resolucion: e.target.value })} required>
                  <option value="">Seleccionar...</option>
                  {TIPOS_RESOLUCION.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Fundamentos</label>
                <textarea className={inputCls + ' min-h-[120px] resize-y'} value={resolverForm.fundamentos} onChange={(e) => setResolverForm({ ...resolverForm, fundamentos: e.target.value })} placeholder="Fundamentación de la resolución..." />
              </div>
              <div>
                <label className={labelCls}>Plazo de cumplimiento (días)</label>
                <input className={inputCls} type="number" min={1} value={resolverForm.plazo_cumplimiento_dias} onChange={(e) => setResolverForm({ ...resolverForm, plazo_cumplimiento_dias: Number(e.target.value) })} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowResolver(false)} className="px-4 py-2.5 text-slate-400 hover:text-white text-sm">Cancelar</button>
                <button type="submit" disabled={sending} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">{sending ? 'Emitiendo...' : 'Emitir Resolución'}</button>
              </div>
            </form>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Mediación</h1>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      <div className="flex gap-1 border-b border-slate-700">
        {(['en_proceso', 'resueltas', 'todas'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
            <Scale className="w-4 h-4" /> {t === 'en_proceso' ? 'En Proceso' : t === 'resueltas' ? 'Resueltas' : 'Todas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />)}
        </div>
      ) : mediaciones.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Scale className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay mediaciones</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {mediaciones.map((m) => (
            <div key={m.id_mediacion} onClick={() => fetchDetalle(m.id_mediacion)} className="flex items-center gap-4 p-4 bg-slate-800/30 border border-slate-800 rounded-xl hover:bg-slate-800/60 cursor-pointer transition-colors">
              <span className={`text-xs px-2 py-1 rounded border ${ESTADO_COLORS[m.estado] || ''}`}>{ESTADO_LABELS[m.estado]}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">Mediación #{m.id_mediacion?.slice(0, 8)}</h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">{m.reclamo?.tipo_reclamo || m.id_reclamo}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs text-slate-600">{formatearFecha(m.fecha_asignacion)}</span>
                {m.mediador && <span className="text-xs text-slate-500">{m.mediador.nombre}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
