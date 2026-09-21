'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import SlaBadge from '@/components/sla/SlaBadge';
import SlaTimer from '@/components/sla/SlaTimer';
import { SLA_CONFIGURACIONES } from '@/lib/sla';
import { ArrowLeft, Send, Circle, CheckCircle, Clock } from 'lucide-react';
import type { Ticket, SlaTracking, SlaNivel } from '@/types';

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

export default function TicketDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const ticketId = params.id as string;
  const [detalle, setDetalle] = useState<TicketDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const fetchDetalle = useCallback(async () => {
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      const data = extractData<any>(res);
      setDetalle(data);
    } catch {
      setDetalle(null);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchDetalle();
  }, [fetchDetalle]);

  const handleReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !user?.id_usuario) return;
    setSending(true);
    try {
      await api.post(`/tickets/${ticketId}/responder`, {
        id_autor: user.id_usuario,
        respuesta: reply.trim(),
      });
      setReply('');
      await fetchDetalle();
    } catch {} finally {
      setSending(false);
    }
  };

  const formatearFecha = (f: string) => {
    return new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getSlaTracking = (t: Ticket): SlaTracking | null => {
    const config = SLA_CONFIGURACIONES.find((c) => c.nivel === t.nivel) || SLA_CONFIGURACIONES[0];
    const fechaCreacion = new Date(t.fecha_creacion);
    const limitePrimeraRespuesta = new Date(fechaCreacion.getTime() + config.tiempo_primera_respuesta_min * 60000);
    const limiteResolucion = new Date(fechaCreacion.getTime() + config.tiempo_resolucion_min * 60000);
    return {
      id_ticket: t.id_ticket,
      nivel: t.nivel as SlaNivel,
      canal: (t.canal as any) || 'formulario',
      fecha_creacion: t.fecha_creacion,
      fecha_primera_respuesta: undefined,
      fecha_resolucion: t.estado === 'resuelto' || t.estado === 'cerrado' ? t.fecha_creacion : undefined,
      estado_sla: 'pendiente',
      tiempo_limite_primera_respuesta: limitePrimeraRespuesta.toISOString(),
      tiempo_limite_resolucion: limiteResolucion.toISOString(),
    };
  };

  const inputCls = 'w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-slate-800/50 rounded animate-pulse" />
        <div className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!detalle) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Ticket no encontrado</p>
        <button onClick={() => router.back()} className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm">
          Volver
        </button>
      </div>
    );
  }

  const sla = getSlaTracking(detalle);

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a tickets
      </button>

      <Card>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">{detalle.asunto}</h2>
            <div className="flex items-center gap-2">
              {sla && <SlaBadge estado={sla.estado_sla} />}
              <span className={`text-xs px-2 py-1 rounded ${estadoColors[detalle.estado] || ''}`}>
                {detalle.estado}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-3">{detalle.descripcion}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className={prioridadColors[detalle.prioridad]}>{detalle.prioridad}</span>
            <span>Nivel: {detalle.nivel}</span>
            <span>Canal: {detalle.canal}</span>
            <span>{formatearFecha(detalle.fecha_creacion)}</span>
          </div>
          {sla && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Tiempo de resolución:</span>
                <SlaTimer
                  fechaLimite={sla.tiempo_limite_resolucion}
                  completado={detalle.estado === 'resuelto' || detalle.estado === 'cerrado'}
                />
              </div>
            </div>
          )}
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
    </div>
  );
}
