'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Scale, Search, ArrowLeft, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';

interface Mediacion {
  id_mediacion: number;
  id_reclamante: string;
  id_reclamado: string;
  tipo_reclamo: string;
  descripcion: string;
  estado: string;
  fecha_apertura: string;
  resolucion?: string;
}

const estadoColors: Record<string, string> = {
  abierto: 'text-green-400 bg-green-500/10',
  en_revision: 'text-yellow-400 bg-yellow-500/10',
  en_mediacion: 'text-blue-400 bg-blue-500/10',
  resuelto: 'text-purple-400 bg-purple-500/10',
  cerrado: 'text-slate-400 bg-slate-500/10',
};

const estadoIcons: Record<string, typeof Clock> = {
  abierto: AlertCircle,
  en_revision: Clock,
  en_mediacion: Scale,
  resuelto: CheckCircle,
  cerrado: CheckCircle,
};

export default function MediacionPage() {
  const { user } = useAuthStore();
  const [mediaciones, setMediaciones] = useState<Mediacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<Mediacion | null>(null);
  const [resolucion, setResolucion] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'mis_reclamos' | 'todos'>('mis_reclamos');

  const fetchMediaciones = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (tab === 'mis_reclamos' && user?.id_usuario) params.id_reclamante = user.id_usuario;
      const res = await api.get('/mediacion', { params });
      const data = extractData<any>(res);
      setMediaciones(data?.data || data || []);
    } catch {
      setMediaciones([]);
    } finally {
      setLoading(false);
    }
  }, [tab, user?.id_usuario]);

  useEffect(() => { fetchMediaciones(); }, [fetchMediaciones]);

  const fetchDetalle = async (id: number) => {
    try {
      const res = await api.get(`/mediacion/${id}`);
      const data = extractData<any>(res);
      setDetalle(data);
      setSelected(id);
    } catch {}
  };

  const handleResolver = async (e: FormEvent) => {
    e.preventDefault();
    if (!resolucion.trim() || !selected) return;
    setSending(true);
    try {
      await api.patch(`/mediacion/${selected}/resolver`, { resolucion: resolucion.trim() });
      setResolucion('');
      await fetchDetalle(selected);
      await fetchMediaciones();
    } catch {} finally {
      setSending(false);
    }
  };

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  const inputCls = 'w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent';

  if (selected && detalle) {
    const Icon = estadoIcons[detalle.estado] || Clock;
    return (
      <div className="space-y-4">
        <button onClick={() => { setSelected(null); setDetalle(null); }} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <Card>
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Icon className="w-6 h-6 text-cyan-400" />
                <div>
                  <h2 className="text-lg font-semibold text-white">Mediación #{detalle.id_mediacion}</h2>
                  <p className="text-sm text-slate-400">{detalle.tipo_reclamo}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${estadoColors[detalle.estado] || ''}`}>
                {detalle.estado}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">Descripción del Reclamo</h3>
                <p className="text-slate-300">{detalle.descripcion}</p>
              </div>

              <div className="flex gap-4 text-sm text-slate-500">
                <span>Abierto: {formatearFecha(detalle.fecha_apertura)}</span>
              </div>

              {detalle.resolucion && (
                <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <h3 className="text-sm font-medium text-green-400 mb-1">Resolución</h3>
                  <p className="text-slate-300">{detalle.resolucion}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {detalle.estado !== 'cerrado' && detalle.estado !== 'resuelto' && (
          <Card>
            <form onSubmit={handleResolver} className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-slate-300">Emitir Resolución</h3>
              <textarea
                className={inputCls + ' min-h-[100px] resize-y'}
                placeholder="Describí la resolución del caso..."
                value={resolucion}
                onChange={(e) => setResolucion(e.target.value)}
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending || !resolucion.trim()}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Enviando...' : 'Enviar Resolución'}
                </button>
              </div>
            </form>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Espacio de Mediación</h1>

      <div className="flex gap-1 border-b border-slate-700">
        {(['mis_reclamos', 'todos'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4" />
            {t === 'mis_reclamos' ? 'Mis Reclamos' : 'Todos'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : mediaciones.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Scale className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No tenés mediaciones activas</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {mediaciones.map((m) => {
            const Icon = estadoIcons[m.estado] || Clock;
            return (
              <div
                key={m.id_mediacion}
                onClick={() => fetchDetalle(m.id_mediacion)}
                className="flex items-center gap-4 p-4 bg-slate-800/30 border border-slate-800 rounded-xl hover:bg-slate-800/60 cursor-pointer transition-colors"
              >
                <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{m.tipo_reclamo}</h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{m.descripcion}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded ${estadoColors[m.estado] || ''}`}>
                    {m.estado}
                  </span>
                  <span className="text-xs text-slate-600">{formatearFecha(m.fecha_apertura)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
