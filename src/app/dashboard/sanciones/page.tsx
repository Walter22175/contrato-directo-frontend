'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Plus,
  X,
  Ban,
  Clock,
  User,
  Calendar,
} from 'lucide-react';
import type { Sancion, CrearSancionDto } from '@/types';

const TIPOS_SANCION = [
  { value: 'amonestacion_escrita', label: 'Amonestación escrita' },
  { value: 'suspension_temporal', label: 'Suspensión temporal de cuenta' },
  { value: 'suspension_privilegios', label: 'Suspensión de privilegios' },
  { value: 'reduccion_visibilidad', label: 'Reducción de visibilidad' },
  { value: 'cancelacion_cuenta', label: 'Cancelación de cuenta' },
  { value: 'reporte_autoridades', label: 'Reporte a autoridades' },
];

const TIPO_COLORS: Record<string, string> = {
  amonestacion_escrita: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  suspension_temporal: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  suspension_privilegios: 'text-red-400 bg-red-500/10 border-red-500/20',
  reduccion_visibilidad: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  cancelacion_cuenta: 'text-red-500 bg-red-600/10 border-red-600/20',
  reporte_autoridades: 'text-red-600 bg-red-700/10 border-red-700/20',
};

export default function SancionesPage() {
  const { user } = useAuthStore();
  const [sanciones, setSanciones] = useState<Sancion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filtroActiva, setFiltroActiva] = useState<'todas' | 'activas' | 'inactivas'>('todas');

  const [form, setForm] = useState<CrearSancionDto>({
    id_usuario: '',
    tipo_sancion: '',
    descripcion: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    id_aplicador: user?.id_usuario || '',
  });

  const fetchSanciones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/sanciones');
      const data = extractData<any>(res);
      setSanciones(data?.data || data || []);
    } catch {
      setSanciones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSanciones(); }, [fetchSanciones]);
  useEffect(() => { if (user?.id_usuario) setForm((f) => ({ ...f, id_aplicador: user.id_usuario! })); }, [user?.id_usuario]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMsg(null);
    try {
      await api.post('/sanciones', form);
      setShowForm(false);
      setForm({ id_usuario: '', tipo_sancion: '', descripcion: '', fecha_inicio: new Date().toISOString().split('T')[0], id_aplicador: user?.id_usuario || '' });
      setMsg({ type: 'success', text: 'Sanción creada correctamente' });
      await fetchSanciones();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error al crear sanción' });
    } finally {
      setSending(false);
    }
  };

  const handleDesactivar = async (id: number) => {
    try {
      await api.patch(`/sanciones/${id}/desactivar`);
      setMsg({ type: 'success', text: 'Sanción desactivada' });
      await fetchSanciones();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error al desactivar' });
    }
  };

  const filtered = sanciones.filter((s) => {
    if (filtroActiva === 'activas') return s.activa;
    if (filtroActiva === 'inactivas') return !s.activa;
    return true;
  });

  const formatearFecha = (f: string) => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  const inputCls = 'w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent';
  const labelCls = 'block text-sm font-medium text-slate-300 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Sanciones</h1>
        <button onClick={() => { setShowForm(true); setMsg(null); }} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nueva Sanción
        </button>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2">
        {(['todas', 'activas', 'inactivas'] as const).map((f) => (
          <button key={f} onClick={() => setFiltroActiva(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroActiva === f ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {f === 'todas' ? 'Todas' : f === 'activas' ? 'Activas' : 'Inactivas'}
          </button>
        ))}
      </div>

      {/* Formulario */}
      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-white">Nueva Sanción</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>ID Usuario Sancionado *</label>
                <input className={inputCls} value={form.id_usuario} onChange={(e) => setForm({ ...form, id_usuario: e.target.value })} required placeholder="UUID del usuario" />
              </div>
              <div>
                <label className={labelCls}>Tipo de Sanción *</label>
                <select className={inputCls} value={form.tipo_sancion} onChange={(e) => setForm({ ...form, tipo_sancion: e.target.value })} required>
                  <option value="">Seleccionar...</option>
                  {TIPOS_SANCION.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>ID Mediación (opcional)</label>
                <input className={inputCls} value={form.id_mediacion || ''} onChange={(e) => setForm({ ...form, id_mediacion: e.target.value || undefined })} placeholder="UUID de la mediación" />
              </div>
              <div>
                <label className={labelCls}>Fecha de Inicio *</label>
                <input className={inputCls} type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} required />
              </div>
              <div>
                <label className={labelCls}>Fecha de Fin (opcional)</label>
                <input className={inputCls} type="date" value={form.fecha_fin || ''} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value || undefined })} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Descripción *</label>
              <textarea className={inputCls + ' min-h-[100px] resize-y'} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required placeholder="Descripción de la sanción..." />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 text-slate-400 hover:text-white text-sm">Cancelar</button>
              <button type="submit" disabled={sending} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors">
                {sending ? 'Creando...' : 'Crear Sanción'}
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
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay sanciones</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id_sancion} className={`flex items-center gap-4 p-4 bg-slate-800/30 border rounded-xl transition-colors ${s.activa ? 'border-slate-800' : 'border-slate-800/50 opacity-60'}`}>
              <span className={`text-xs px-2 py-1 rounded border ${TIPO_COLORS[s.tipo_sancion] || ''}`}>
                {TIPOS_SANCION.find((t) => t.value === s.tipo_sancion)?.label || s.tipo_sancion}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 truncate">{s.descripcion}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {s.id_usuario?.slice(0, 8)}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatearFecha(s.fecha_inicio)}</span>
                  {s.fecha_fin && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> hasta {formatearFecha(s.fecha_fin)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded ${s.activa ? 'text-red-400 bg-red-500/10' : 'text-slate-500 bg-slate-700/50'}`}>
                  {s.activa ? 'Activa' : 'Inactiva'}
                </span>
                {s.activa && (
                  <button onClick={() => handleDesactivar(s.id_sancion)} className="text-xs text-slate-400 hover:text-red-400 transition-colors" title="Desactivar">
                    <Ban className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
