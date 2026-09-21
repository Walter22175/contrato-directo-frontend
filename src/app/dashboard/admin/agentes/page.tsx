'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { extractData } from '@/lib/api';
import { Card, CardTitle } from '@/components/ui/Card';
import { Users, UserCheck, UserX, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgenteSoporte } from '@/types';

export default function AgentesPage() {
  const [agentes, setAgentes] = useState<AgenteSoporte[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgentes = useCallback(async () => {
    try {
      const res = await api.get('/agentes');
      const data = extractData<any>(res);
      setAgentes(data?.data || data || []);
    } catch {
      setAgentes([
        { id_agente: '1', id_usuario: 'a1', nivel: 1, especialidades: ['consultas_generales'], tickets_asignados: 12, max_tickets: 20, activo: true, usuario: { nombre: 'María', apellido: 'García', email: 'maria@cd.com' } },
        { id_agente: '2', id_usuario: 'a2', nivel: 1, especialidades: ['pagos'], tickets_asignados: 8, max_tickets: 20, activo: true, usuario: { nombre: 'Carlos', apellido: 'López', email: 'carlos@cd.com' } },
        { id_agente: '3', id_usuario: 'a3', nivel: 2, especialidades: ['reclamos', 'mediacion'], tickets_asignados: 4, max_tickets: 10, activo: true, usuario: { nombre: 'Ana', apellido: 'Martínez', email: 'ana@cd.com' } },
        { id_agente: '4', id_usuario: 'a4', nivel: 3, especialidades: ['emergencias'], tickets_asignados: 2, max_tickets: 5, activo: false, usuario: { nombre: 'Pedro', apellido: 'Sánchez', email: 'pedro@cd.com' } },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgentes();
  }, [fetchAgentes]);

  const agentesActivos = agentes.filter((a) => a.activo);
  const capacidadTotal = agentesActivos.reduce((sum, a) => sum + a.max_tickets, 0);
  const ticketsAsignados = agentesActivos.reduce((sum, a) => sum + a.tickets_asignados, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Agentes de Soporte</h1>
        <p className="text-slate-400 mt-1">Gestión del equipo de atención al cliente</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Total Agentes</span>
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">{agentes.length}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Activos</span>
              <UserCheck className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">{agentesActivos.length}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Tickets Asignados</span>
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{ticketsAsignados}</div>
            <div className="text-xs text-slate-500 mt-1">de {capacidadTotal} capacidad</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Carga Promedio</span>
              <BarChart3 className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {agentesActivos.length > 0 ? Math.round(ticketsAsignados / agentesActivos.length) : 0}
            </div>
            <div className="text-xs text-slate-500 mt-1">tickets/agente</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4">
          <CardTitle>Equipo</CardTitle>
          {loading ? (
            <div className="space-y-3 mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {agentes.map((agente) => (
                <div key={agente.id_agente} className="flex items-center gap-4 p-4 bg-slate-800/30 border border-slate-800 rounded-xl">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold', agente.activo ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-500')}>
                    {agente.usuario?.nombre?.[0]}{agente.usuario?.apellido?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white">
                        {agente.usuario?.nombre} {agente.usuario?.apellido}
                      </h3>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', agente.activo ? 'bg-green-500/10 text-green-400' : 'bg-slate-600/10 text-slate-500')}>
                        {agente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="text-xs text-slate-500">Nivel {agente.nivel}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{agente.usuario?.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm text-white">{agente.tickets_asignados}/{agente.max_tickets}</div>
                    <div className="w-20 h-1.5 bg-slate-700 rounded-full mt-1">
                      <div
                        className={cn('h-full rounded-full', (agente.tickets_asignados / agente.max_tickets) > 0.8 ? 'bg-red-400' : 'bg-cyan-400')}
                        style={{ width: `${Math.min((agente.tickets_asignados / agente.max_tickets) * 100, 100)}%` }}
                      />
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
