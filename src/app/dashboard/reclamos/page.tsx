'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { AlertTriangle, Search, ArrowLeft, Clock, CheckCircle, Send, Paperclip } from 'lucide-react';
import type { Reclamo } from '@/types';

interface ReclamoDetalle extends Reclamo {
  documentos?: { id_documento: number; nombre: string; url: string }[];
  contestaciones?: { id_contestacion: number; contenido: string; fecha: string; id_autor: string }[];
}

const estadoColors: Record<string, string> = {
  abierto: 'text-green-400 bg-green-500/10',
  en_proceso: 'text-yellow-400 bg-yellow-500/10',
  resuelto: 'text-blue-400 bg-blue-500/10',
  cerrado: 'text-slate-400 bg-slate-500/10',
};

const estadoIcons: Record<string, typeof Clock> = {
  abierto: AlertTriangle,
  en_proceso: Clock,
  resuelto: CheckCircle,
  cerrado: CheckCircle,
};

export default function ReclamosPage() {
  const { user } = useAuthStore();
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<ReclamoDetalle | null>(null);
  const [contestacion, setContestacion] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'mis_reclamos' | 'todos'>('mis_reclamos');

  const fetchReclamos = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (tab === 'mis_reclamos' && user?.id_usuario) params.id_usuario = user.id_usuario;
      const res = await api.get('/reclamos', { params });
      const data = extractData<any>(res);
      setReclamos(data?.data || data || []);
    } catch {
      setReclamos([]);
    } finally {
      setLoading(false);
    }
  }, [tab, user?.id_usuario]);

  useEffect(() => { fetchReclamos(); }, [fetchReclamos]);

  const fetchDetalle = async (id: string) => {
    try {
      const res = await api.get(`/reclamos/${id}`);
      const data = extractData<any>(res);
      setDetalle(data);
      setSelected(id);
    } catch {}
  };

  const handleContestar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestacion.trim() || !selected) return;
    setSending(true);
    try {
      await api.post(`/reclamos/${selected}/contestar`, {
        contenido: contestacion.trim(),
        id_autor: user?.id_usuario,
      });
      setContestacion('');
      await fetchDetalle(selected);
    } catch {} finally {
      setSending(false);
    }
  };

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

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
                  <h2 className="text-lg font-semibold text-white">Reclamo #{detalle.id_reclamo}</h2>
                  <p className="text-sm text-slate-400">{detalle.tipo_reclamo}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${estadoColors[detalle.estado] || ''}`}>
                {detalle.estado}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">Descripción</h3>
                <p className="text-slate-300">{detalle.descripcion}</p>
              </div>

              <div className="flex gap-4 text-sm text-slate-500">
                <span>Fecha: {formatearFecha(detalle.fecha_apertura)}</span>
                <span>Transacción: #{detalle.id_transaccion}</span>
              </div>

              {detalle.documentos && detalle.documentos.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Documentos Adjuntos</h3>
                  <div className="flex flex-wrap gap-2">
                    {detalle.documentos.map((d) => (
                      <a
                        key={d.id_documento}
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        <Paperclip className="w-3 h-3" />
                        {d.nombre}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {detalle.contestaciones && detalle.contestaciones.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h3 className="text-sm font-medium text-slate-400">Contestaciones</h3>
                  {detalle.contestaciones.map((c) => (
                    <div
                      key={c.id_contestacion}
                      className={`p-4 rounded-xl border ${
                        c.id_autor === user?.id_usuario
                          ? 'bg-cyan-500/5 border-cyan-500/20 ml-8'
                          : 'bg-slate-800/50 border-slate-700 mr-8'
                      }`}
                    >
                      <p className="text-sm text-slate-300">{c.contenido}</p>
                      <p className="text-xs text-slate-500 mt-2">{formatearFecha(c.fecha)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {detalle.estado !== 'cerrado' && (
          <Card>
            <form onSubmit={handleContestar} className="p-4 flex gap-3">
              <input
                className={inputCls}
                placeholder="Escribí tu contestación..."
                value={contestacion}
                onChange={(e) => setContestacion(e.target.value)}
              />
              <button
                type="submit"
                disabled={sending || !contestacion.trim()}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Mis Reclamos</h1>

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
            <AlertTriangle className="w-4 h-4" />
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
      ) : reclamos.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No tenés reclamos</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {reclamos.map((r) => {
            const Icon = estadoIcons[r.estado] || Clock;
            return (
              <div
                key={r.id_reclamo}
                onClick={() => fetchDetalle(r.id_reclamo)}
                className="flex items-center gap-4 p-4 bg-slate-800/30 border border-slate-800 rounded-xl hover:bg-slate-800/60 cursor-pointer transition-colors"
              >
                <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{r.tipo_reclamo}</h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{r.descripcion}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded ${estadoColors[r.estado] || ''}`}>
                    {r.estado}
                  </span>
                  <span className="text-xs text-slate-600">{formatearFecha(r.fecha_apertura)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
