'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card, CardTitle } from '@/components/ui/Card';
import SlaBadge from '@/components/sla/SlaBadge';
import SlaTimer from '@/components/sla/SlaTimer';
import SlaDashboard from '@/components/sla/SlaDashboard';
import { SLA_CONFIGURACIONES, calcularEstadoSla, formatearTiempoRestante, calcularTiempoRestanteMin } from '@/lib/sla';
import { Clock, AlertTriangle, CheckCircle, Filter, BarChart3 } from 'lucide-react';
import type { Ticket, SlaTracking, SlaNivel } from '@/types';

interface TicketConSla extends Ticket {
  sla?: SlaTracking;
}

const nivelLabels: Record<string, string> = {
  nivel_1: 'Consultas simples',
  nivel_2: 'Consultas complejas',
  nivel_3: 'Reclamos y mediación',
  nivel_4: 'Emergencias',
  nivel_5: 'Sugerencias',
};

export default function SlaPage() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<TicketConSla[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroNivel, setFiltroNivel] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  const fetchTickets = useCallback(async () => {
    try {
      const res = await api.get('/tickets', { params: { id_usuario: user?.id_usuario } });
      const data = extractData<any>(res);
      const ticketsRaw = data?.data || data || [];
      const ticketsConSla: TicketConSla[] = ticketsRaw.map((t: Ticket) => {
        const config = SLA_CONFIGURACIONES.find((c) => c.nivel === t.nivel) || SLA_CONFIGURACIONES[0];
        const fechaCreacion = new Date(t.fecha_creacion);
        const limitePrimeraRespuesta = new Date(fechaCreacion.getTime() + config.tiempo_primera_respuesta_min * 60000);
        const limiteResolucion = new Date(fechaCreacion.getTime() + config.tiempo_resolucion_min * 60000);
        const tracking: SlaTracking = {
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
        return { ...t, sla: tracking };
      });
      setTickets(ticketsConSla);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id_usuario]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const ticketsFiltrados = tickets.filter((t) => {
    if (filtroNivel && t.nivel !== filtroNivel) return false;
    if (filtroEstado && t.sla?.estado_sla !== filtroEstado) return false;
    return true;
  });

  const metricas = [
    {
      titulo: 'Tickets totales',
      valor: tickets.length,
      icono: BarChart3,
      color: 'text-cyan-400',
    },
    {
      titulo: 'Cumplidos',
      valor: tickets.filter((t) => t.sla?.estado_sla === 'cumplido').length,
      icono: CheckCircle,
      color: 'text-green-400',
      cambio: tickets.length > 0 ? `${Math.round((tickets.filter((t) => t.sla?.estado_sla === 'cumplido').length / tickets.length) * 100)}%` : '0%',
    },
    {
      titulo: 'En riesgo',
      valor: tickets.filter((t) => t.sla?.estado_sla === 'en_riesgo').length,
      icono: Clock,
      color: 'text-yellow-400',
    },
    {
      titulo: 'Vencidos',
      valor: tickets.filter((t) => t.sla?.estado_sla === 'vencido').length,
      icono: AlertTriangle,
      color: 'text-red-400',
      meta: '< 5%',
    },
  ];

  const inputCls = 'w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Gestión de SLA</h1>
        <p className="text-slate-400 mt-1">Seguimiento de niveles de servicio y tiempos de respuesta</p>
      </div>

      <SlaDashboard metricas={metricas} />

      <Card>
        <div className="p-4">
          <CardTitle>Configuración de Niveles SLA</CardTitle>
          <div className="mt-4 space-y-3">
            {SLA_CONFIGURACIONES.map((config) => (
              <div key={config.nivel} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-white">{config.nombre}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{config.descripcion}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div>1ra respuesta: <span className="text-white">{formatearTiempoRestante(config.tiempo_primera_respuesta_min)}</span></div>
                  <div>Resolución: <span className="text-white">{formatearTiempoRestante(config.tiempo_resolucion_min)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Seguimiento de Tickets</CardTitle>
            <div className="flex items-center gap-3">
              <select className={inputCls + ' w-auto text-sm'} value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}>
                <option value="">Todos los niveles</option>
                {SLA_CONFIGURACIONES.map((c) => (
                  <option key={c.nivel} value={c.nivel}>{c.nombre}</option>
                ))}
              </select>
              <select className={inputCls + ' w-auto text-sm'} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="cumplido">Cumplido</option>
                <option value="en_riesgo">En riesgo</option>
                <option value="vencido">Vencido</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : ticketsFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No hay tickets para mostrar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ticketsFiltrados.map((t) => (
                <div key={t.id_ticket} className="flex items-center gap-4 p-4 bg-slate-800/30 border border-slate-800 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white truncate">{t.asunto}</h3>
                      <SlaBadge estado={t.sla?.estado_sla || 'pendiente'} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{nivelLabels[t.nivel] || t.nivel}</span>
                      <span>·</span>
                      <span>{t.canal}</span>
                      <span>·</span>
                      <span className={t.estado === 'resuelto' || t.estado === 'cerrado' ? 'text-green-400' : ''}>{t.estado}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <SlaTimer
                      fechaLimite={t.sla?.tiempo_limite_resolucion || ''}
                      completado={t.estado === 'resuelto' || t.estado === 'cerrado'}
                    />
                    <div className="text-xs text-slate-600 mt-1">
                      Límite: {new Date(t.sla?.tiempo_limite_resolucion || '').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
