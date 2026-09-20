'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { MessageSquare, Plus, Send, ArrowLeft, Circle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import type { Ticket } from '@/types';

interface Respuesta {
  id_respuesta: number;
  id_autor: string;
  contenido: string;
  es_interna: boolean;
  fecha_respuesta: string;
}

interface TicketDetalle extends Ticket {
  respuestas?: Respuesta[];
}

const estadoColors: Record<string, string> = {
  abierto: 'text-green-400 bg-green-500/10',
  en_proceso: 'text-yellow-400 bg-yellow-500/10',
  resuelto: 'text-blue-400 bg-blue-500/10',
  cerrado: 'text-slate-400 bg-slate-500/10',
};

const estadoIcons: Record<string, typeof Circle> = {
  abierto: Circle,
  en_proceso: Clock,
  resuelto: CheckCircle,
  cerrado: CheckCircle,
};

const prioridadColors: Record<string, string> = {
  baja: 'text-slate-400',
  media: 'text-yellow-400',
  alta: 'text-orange-400',
  critica: 'text-red-400',
};

export default function TicketsPage() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<TicketDetalle | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [nuevo, setNuevo] = useState({ asunto: '', descripcion: '', prioridad: 'media' });

  const fetchTickets = useCallback(async () => {
    try {
      const res = await api.get('/tickets', { params: { id_usuario: user?.id_usuario } });
      const data = extractData<any>(res);
      setTickets(data?.data || data || []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id_usuario]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const fetchDetalle = async (id: string) => {
    setLoadingDetalle(true);
    try {
      const res = await api.get(`/tickets/${id}`);
      const data = extractData<any>(res);
      setDetalle(data);
      setSelected(id);
    } catch {} finally {
      setLoadingDetalle(false);
    }
  };

  const handleReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selected || !user?.id_usuario) return;
    setSending(true);
    try {
      await api.post(`/tickets/${selected}/responder`, {
        id_autor: user.id_usuario,
        respuesta: reply.trim(),
      });
      setReply('');
      await fetchDetalle(selected);
    } catch {} finally {
      setSending(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!nuevo.asunto.trim() || !nuevo.descripcion.trim() || !user?.id_usuario) return;
    setSending(true);
    try {
      const res = await api.post('/tickets', {
        id_usuario: user.id_usuario,
        asunto: nuevo.asunto.trim(),
        descripcion: nuevo.descripcion.trim(),
        nivel: 'nivel_1',
        canal: 'formulario',
        prioridad: nuevo.prioridad,
      });
      const data = extractData<any>(res);
      setShowNew(false);
      setNuevo({ asunto: '', descripcion: '', prioridad: 'media' });
      await fetchTickets();
      if (data?.id_ticket) await fetchDetalle(data.id_ticket);
    } catch {} finally {
      setSending(false);
    }
  };

  const formatearFecha = (f: string) => {
    const d = new Date(f);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const inputCls = 'w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent';

  if (selected && !loadingDetalle) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setSelected(null); setDetalle(null); }} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        {detalle && (
          <>
            <Card>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-lg font-semibold text-white">{detalle.asunto}</h2>
                  <span className={`text-xs px-2 py-1 rounded ${estadoColors[detalle.estado] || ''}`}>
                    {detalle.estado}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-3">{detalle.descripcion}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className={prioridadColors[detalle.prioridad]}>{detalle.prioridad}</span>
                  <span>{formatearFecha(detalle.fecha_creacion)}</span>
                </div>
              </div>
            </Card>

            {detalle.respuestas && detalle.respuestas.length > 0 && (
              <div className="space-y-3">
                {detalle.respuestas.map((r) => (
                  <div
                    key={r.id_respuesta}
                    className={`p-4 rounded-xl border ${
                      r.id_autor === user?.id_usuario
                        ? 'bg-cyan-500/5 border-cyan-500/20 ml-8'
                        : 'bg-slate-800/50 border-slate-700 mr-8'
                    }`}
                  >
                    <p className="text-sm text-slate-300">{r.contenido}</p>
                    <p className="text-xs text-slate-500 mt-2">{formatearFecha(r.fecha_respuesta)}</p>
                  </div>
                ))}
              </div>
            )}

            {detalle.estado !== 'cerrado' && (
              <Card>
                <form onSubmit={handleReply} className="p-4 flex gap-3">
                  <input
                    className={inputCls}
                    placeholder="Escribí tu respuesta..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mis Mensajes</h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      {showNew && (
        <Card>
          <form onSubmit={handleCreate} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Asunto</label>
              <input className={inputCls} value={nuevo.asunto} onChange={(e) => setNuevo({ ...nuevo, asunto: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Mensaje</label>
              <textarea
                className={inputCls + ' min-h-[100px] resize-y'}
                value={nuevo.descripcion}
                onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Prioridad</label>
                <select className={inputCls} value={nuevo.prioridad} onChange={(e) => setNuevo({ ...nuevo, prioridad: e.target.value })}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div className="flex-1" />
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No tenés mensajes</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => {
            const Icon = estadoIcons[t.estado] || Circle;
            return (
              <div
                key={t.id_ticket}
                onClick={() => fetchDetalle(t.id_ticket)}
                className="flex items-center gap-4 p-4 bg-slate-800/30 border border-slate-800 rounded-xl hover:bg-slate-800/60 cursor-pointer transition-colors"
              >
                <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{t.asunto}</h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{t.descripcion}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs ${prioridadColors[t.prioridad]}`}>{t.prioridad}</span>
                  <span className="text-xs text-slate-600">{formatearFecha(t.fecha_creacion)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
