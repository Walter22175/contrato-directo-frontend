'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Send,
  Paperclip,
  ArrowLeft,
  Plus,
  X,
  Scale,
  FileText,
  Upload,
  Calendar,
  Ban,
} from 'lucide-react';
import type { Reclamo, CreateReclamoDto, ContestarReclamoDto, Transaccion } from '@/types';

const TIPOS_RECLAMO = [
  { value: 'incumplimiento_servicio', label: 'Incumplimiento de servicio' },
  { value: 'incumplimiento_pago', label: 'Incumplimiento de pago' },
  { value: 'problema_calidad', label: 'Problemas de calidad' },
  { value: 'incumplimiento_hitos', label: 'Incumplimiento de hitos' },
  { value: 'conducta_inapropiada', label: 'Conducta inapropiada' },
  { value: 'fraude', label: 'Fraude o mala fe' },
  { value: 'disputa_valoracion', label: 'Disputas sobre valoraciones' },
];

const ESTADO_COLORS: Record<string, string> = {
  abierto: 'text-green-400 bg-green-500/10 border-green-500/20',
  en_revision: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  resuelto: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  en_cumplimiento: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  cerrado: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

const ESTADO_LABELS: Record<string, string> = {
  abierto: 'Abierto',
  en_revision: 'En revisión',
  resuelto: 'Resuelto',
  en_cumplimiento: 'En cumplimiento',
  cerrado: 'Cerrado',
};

const STEPS = ['abierto', 'en_revision', 'resuelto', 'en_cumplimiento', 'cerrado'];

export default function ReclamosPage() {
  const { user } = useAuthStore();
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Reclamo | null>(null);
  const [tab, setTab] = useState<'mis_reclamos' | 'todos'>('mis_reclamos');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loadingTransacciones, setLoadingTransacciones] = useState(false);

  const isAdmin = user?.usuario_roles?.some((r: any) => r.rol?.nombre === 'super_admin');

  const [form, setForm] = useState<CreateReclamoDto>({
    id_transaccion: '',
    id_reclamante: user?.id_usuario || '',
    id_reclamado: '',
    tipo_reclamo: '',
    descripcion: '',
    fecha_incidente: '',
  });

  const [contestacion, setContestacion] = useState('');

  const fetchTransacciones = async () => {
    setLoadingTransacciones(true);
    try {
      const res = await api.get('/transacciones', { params: { id_cliente: user?.id_usuario } });
      const data = extractData<any>(res);
      setTransacciones(data?.data || data || []);
    } catch {
      setTransacciones([]);
    } finally {
      setLoadingTransacciones(false);
    }
  };

  const fetchReclamos = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (tab === 'mis_reclamos' && user?.id_usuario) params.id_reclamante = user.id_usuario;
      if (filtroEstado) params.estado = filtroEstado;
      const res = await api.get('/reclamos', { params });
      const data = extractData<any>(res);
      setReclamos(data?.data || data || []);
    } catch {
      setReclamos([]);
    } finally {
      setLoading(false);
    }
  }, [tab, user?.id_usuario, filtroEstado]);

  useEffect(() => { fetchReclamos(); }, [fetchReclamos]);

  useEffect(() => {
    if (user?.id_usuario) setForm((f) => ({ ...f, id_reclamante: user.id_usuario! }));
  }, [user?.id_usuario]);

  const fetchDetalle = async (id: string) => {
    try {
      const res = await api.get(`/reclamos/${id}`);
      const data = extractData<any>(res);
      setDetalle(data);
      setSelected(id);
      setMsg(null);
    } catch {}
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMsg(null);
    try {
      const res = await api.post('/reclamos', form);
      const data = extractData<any>(res);
      setShowForm(false);
      setForm({ id_transaccion: '', id_reclamante: user?.id_usuario || '', id_reclamado: '', tipo_reclamo: '', descripcion: '', fecha_incidente: '' });
      setMsg({ type: 'success', text: 'Reclamo creado correctamente' });
      await fetchReclamos();
      if (data?.id_reclamo) await fetchDetalle(data.id_reclamo);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error al crear reclamo' });
    } finally {
      setSending(false);
    }
  };

  const handleContestar = async (e: FormEvent) => {
    e.preventDefault();
    if (!contestacion.trim() || !selected) return;
    setSending(true);
    setMsg(null);
    try {
      const dto: ContestarReclamoDto = { id_contestatario: user?.id_usuario || '', respuesta: contestacion.trim() };
      await api.post(`/reclamos/${selected}/contestar`, dto);
      setContestacion('');
      await fetchDetalle(selected);
      setMsg({ type: 'success', text: 'Contestación enviada' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error al contestar' });
    } finally {
      setSending(false);
    }
  };

  const handleCerrar = async () => {
    if (!selected) return;
    try {
      await api.patch(`/reclamos/${selected}/cerrar`);
      await fetchDetalle(selected);
      setMsg({ type: 'success', text: 'Reclamo cerrado' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error al cerrar' });
    }
  };

  const handleProrroga = async () => {
    if (!selected) return;
    try {
      await api.post(`/reclamos/${selected}/solicitar-prorroga`);
      await fetchDetalle(selected);
      setMsg({ type: 'success', text: 'Prórroga concedida (3 días hábiles)' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error al solicitar prórroga' });
    }
  };

  const handleMediacionVoluntaria = async () => {
    if (!selected) return;
    try {
      await api.post(`/reclamos/${selected}/mediacion-voluntaria`);
      await fetchDetalle(selected);
      setMsg({ type: 'success', text: 'Mediación voluntaria ofrecida (3 días hábiles)' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error' });
    }
  };

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const inputCls = 'w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent';
  const labelCls = 'block text-sm font-medium text-slate-300 mb-1';

  if (selected && detalle) {
    const currentStep = STEPS.indexOf(detalle.estado);
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
            <div className="flex items-center justify-between">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center">
                  <div className={`flex flex-col items-center ${i <= currentStep ? 'text-cyan-400' : 'text-slate-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${i < currentStep ? 'bg-cyan-500/20 border-cyan-500' : i === currentStep ? 'bg-cyan-500/20 border-cyan-400 animate-pulse' : 'bg-slate-800 border-slate-700'}`}>
                      {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className="text-xs mt-1 hidden md:block">{ESTADO_LABELS[step]}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-12 md:w-24 h-0.5 mx-1 ${i < currentStep ? 'bg-cyan-500' : 'bg-slate-700'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Detalle */}
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Reclamo #{detalle.id_reclamo?.slice(0, 8)}</h2>
                <p className="text-sm text-slate-400">{TIPOS_RECLAMO.find((t) => t.value === detalle.tipo_reclamo)?.label || detalle.tipo_reclamo}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded border ${ESTADO_COLORS[detalle.estado] || ''}`}>
                {ESTADO_LABELS[detalle.estado] || detalle.estado}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Descripción</h3>
              <p className="text-slate-300">{detalle.descripcion}</p>
            </div>

            <div className="flex gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatearFecha(detalle.fecha_apertura)}</span>
              <span>Transacción: #{detalle.id_transaccion?.slice(0, 8)}</span>
            </div>

            {detalle.fecha_limite_contestacion && (
              <div className="flex items-center gap-2 text-xs text-yellow-400">
                <Clock className="w-3 h-3" /> Límite contestación: {formatearFecha(detalle.fecha_limite_contestacion)}
              </div>
            )}

            {detalle.fecha_limite_apelacion && (
              <div className="flex items-center gap-2 text-xs text-orange-400">
                <Clock className="w-3 h-3" /> Límite apelación: {formatearFecha(detalle.fecha_limite_apelacion)}
              </div>
            )}
          </div>
        </Card>

        {/* Documentos */}
        {detalle.documentos && detalle.documentos.length > 0 && (
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Documentos Adjuntos</h3>
              <div className="flex flex-wrap gap-2">
                {detalle.documentos.map((d) => (
                  <a key={d.id_documento} href={d.url_archivo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                    <Paperclip className="w-3 h-3" /> {d.nombre_archivo}
                  </a>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Contestaciones */}
        {detalle.contestaciones && detalle.contestaciones.length > 0 && (
          <Card>
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-slate-400">Contestaciones</h3>
              {detalle.contestaciones.map((c) => (
                <div key={c.id_contestacion} className={`p-4 rounded-xl border ${c.id_contestante === user?.id_usuario ? 'bg-cyan-500/5 border-cyan-500/20 ml-8' : 'bg-slate-800/50 border-slate-700 mr-8'}`}>
                  <p className="text-sm text-slate-300">{c.descripcion}</p>
                  <p className="text-xs text-slate-500 mt-2">{formatearFecha(c.fecha_contestacion)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Mediación vinculada */}
        {detalle.mediacion && (
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2"><Scale className="w-4 h-4" /> Mediación Vinculada</h3>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded border ${detalle.mediacion.estado === 'resuelta' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'}`}>
                  {detalle.mediacion.estado}
                </span>
                {detalle.mediacion.mediador && (
                  <span className="text-sm text-slate-400">Mediador: {detalle.mediacion.mediador.nombre}</span>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Acciones */}
        <Card>
          <div className="p-4 flex flex-wrap gap-3">
            {detalle.estado !== 'cerrado' && (
              <form onSubmit={handleContestar} className="flex gap-2 flex-1">
                <input className={inputCls + ' flex-1'} placeholder="Escribí tu contestación..." value={contestacion} onChange={(e) => setContestacion(e.target.value)} />
                <button type="submit" disabled={sending || !contestacion.trim()} className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

            {detalle.estado === 'en_revision' && (
              <>
                <button onClick={handleProrroga} className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm hover:bg-yellow-600/30 transition-colors">
                  <Clock className="w-4 h-4" /> Solicitar Prórroga
                </button>
                <button onClick={handleMediacionVoluntaria} className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm hover:bg-purple-600/30 transition-colors">
                  <Scale className="w-4 h-4" /> Mediación Voluntaria
                </button>
              </>
            )}

            {detalle.estado === 'resuelto' && (
              <button onClick={handleCerrar} className="flex items-center gap-2 px-4 py-2 bg-slate-600/20 text-slate-300 border border-slate-500/30 rounded-lg text-sm hover:bg-slate-600/30 transition-colors">
                <Ban className="w-4 h-4" /> Cerrar Reclamo
              </button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reclamos</h1>
        <button onClick={() => { setShowForm(true); setMsg(null); fetchTransacciones(); }} className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Reclamo
        </button>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700">
        {(['mis_reclamos', 'todos'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
            <AlertTriangle className="w-4 h-4" /> {t === 'mis_reclamos' ? 'Mis Reclamos' : 'Todos'}
          </button>
        ))}
      </div>

      {/* Filtro estado */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFiltroEstado('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filtroEstado ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
          Todos
        </button>
        {Object.entries(ESTADO_LABELS).map(([k, v]) => (
          <button key={k} onClick={() => setFiltroEstado(k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroEstado === k ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {v}
          </button>
        ))}
      </div>

      {/* Formulario nuevo reclamo */}
      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-white">Nuevo Reclamo</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tipo de Reclamo *</label>
                <select className={inputCls} value={form.tipo_reclamo} onChange={(e) => setForm({ ...form, tipo_reclamo: e.target.value })} required>
                  <option value="">Seleccionar...</option>
                  {TIPOS_RECLAMO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Transacción *</label>
                <select
                  className={inputCls}
                  value={form.id_transaccion}
                  onChange={(e) => {
                    const txId = e.target.value;
                    const tx = transacciones.find((t) => t.id_transaccion === txId);
                    setForm({
                      ...form,
                      id_transaccion: txId,
                      id_reclamado: tx?.id_proveedor || '',
                    });
                  }}
                  required
                  disabled={loadingTransacciones}
                >
                  <option value="">{loadingTransacciones ? 'Cargando...' : 'Seleccionar transacción...'}</option>
                  {transacciones.map((t) => (
                    <option key={t.id_transaccion} value={t.id_transaccion}>
                      #{t.id_transaccion?.slice(0, 8)} — {t.descripcion || t.tipo_transaccion} — ${t.monto_acordado}
                    </option>
                  ))}
                </select>
                {transacciones.length === 0 && !loadingTransacciones && (
                  <p className="text-xs text-slate-500 mt-1">No tenés transacciones disponibles</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Proveedor (reclamado)</label>
                <input className={inputCls + ' bg-slate-700'} value={form.id_reclamado ? `#${form.id_reclamado.slice(0, 8)}` : 'Se completa automáticamente'} readOnly />
              </div>
              <div>
                <label className={labelCls}>Fecha del Incidente *</label>
                <input className={inputCls} type="date" value={form.fecha_incidente} onChange={(e) => setForm({ ...form, fecha_incidente: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className={labelCls}>Descripción * (máx. 800 caracteres)</label>
              <textarea className={inputCls + ' min-h-[120px] resize-y'} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value.slice(0, 800) })} required placeholder="Describí el problema..." />
              <p className="text-xs text-slate-500 mt-1">{form.descripcion.length}/800</p>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors text-sm">Cancelar</button>
              <button type="submit" disabled={sending} className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors">
                <FileText className="w-4 h-4" /> {sending ? 'Creando...' : 'Crear Reclamo'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />)}
        </div>
      ) : reclamos.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay reclamos</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {reclamos.map((r) => (
            <div key={r.id_reclamo} onClick={() => fetchDetalle(r.id_reclamo)} className="flex items-center gap-4 p-4 bg-slate-800/30 border border-slate-800 rounded-xl hover:bg-slate-800/60 cursor-pointer transition-colors">
              <div className="flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded border ${ESTADO_COLORS[r.estado] || ''}`}>
                  {ESTADO_LABELS[r.estado] || r.estado}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">{TIPOS_RECLAMO.find((t) => t.value === r.tipo_reclamo)?.label || r.tipo_reclamo}</h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">{r.descripcion}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs text-slate-600">{formatearFecha(r.fecha_apertura)}</span>
                {r.mediacion && <Scale className="w-3 h-3 text-purple-400" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
