'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Bell, BellOff, CheckCheck, CreditCard, Activity, Globe, Settings, Ticket } from 'lucide-react';
import type { Notificacion } from '@/types';

const tipoIcon: Record<string, typeof Bell> = {
  transaccional: CreditCard,
  actividad: Activity,
  plataforma: Globe,
  ticket: Ticket,
};

const tipoColor: Record<string, string> = {
  transaccional: 'text-green-400 bg-green-500/10 border-green-500/20',
  actividad: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  plataforma: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  ticket: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

const TIPOS: { value: '' | 'transaccional' | 'actividad' | 'plataforma' | 'ticket'; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'transaccional', label: 'Transaccional' },
  { value: 'actividad', label: 'Actividad' },
  { value: 'plataforma', label: 'Plataforma' },
  { value: 'ticket', label: 'Tickets' },
];

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState<'' | 'transaccional' | 'actividad' | 'plataforma' | 'ticket'>('');
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const router = useRouter();

  const fetchNotificaciones = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { limite: 50 };
      if (tipoFiltro && tipoFiltro !== 'ticket') params.tipo = tipoFiltro;
      if (soloNoLeidas) params.leida = false;

      const res = await api.get('/notificaciones', { params });
      const data = extractData<
        { data?: Notificacion[]; meta?: { no_leidas?: number } } | Notificacion[] | null
      >(res);
      const listaRaw = Array.isArray(data) ? data : data?.data || [];
      const lista =
        tipoFiltro === 'ticket'
          ? listaRaw.filter((n) => (n.evento || '').toLowerCase().includes('ticket'))
          : listaRaw;
      setNotificaciones(lista);
      setNoLeidas(
        tipoFiltro === 'ticket'
          ? lista.filter((n) => !n.leida).length
          : Array.isArray(data)
            ? lista.filter((n) => !n.leida).length
            : data?.meta?.no_leidas ?? lista.filter((n) => !n.leida).length,
      );
    } catch {
      setNotificaciones([]);
    } finally {
      setLoading(false);
    }
  }, [tipoFiltro, soloNoLeidas]);

  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  const marcarLeida = async (id: string) => {
    try {
      await api.patch(`/notificaciones/${id}/leer`);
      setNotificaciones((prev) =>
        soloNoLeidas
          ? prev.filter((n) => n.id_notificacion !== id)
          : prev.map((n) => (n.id_notificacion === id ? { ...n, leida: true } : n)),
      );
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const marcarTodas = async () => {
    try {
      await api.patch('/notificaciones/leer-todas');
      setNotificaciones((prev) =>
        soloNoLeidas ? [] : prev.map((n) => ({ ...n, leida: true })),
      );
      setNoLeidas(0);
    } catch {}
  };

  const formatearFecha = (f: string) => {
    const d = new Date(f);
    const ahora = new Date();
    const diff = ahora.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    const dias = Math.floor(hrs / 24);
    if (dias < 7) return `Hace ${dias}d`;
    return d.toLocaleDateString('es-AR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
          {noLeidas > 0 && <p className="text-sm text-slate-400">{noLeidas} sin leer</p>}
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/notificaciones/configuracion"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configuración
          </Link>
          <button
            onClick={() => setSoloNoLeidas((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
              soloNoLeidas
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {soloNoLeidas ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {soloNoLeidas ? 'Solo sin leer' : 'Sin leer'}
          </button>
          {noLeidas > 0 && (
            <button
              onClick={marcarTodas}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TIPOS.map((tipo) => (
          <button
            key={tipo.value || 'todas'}
            type="button"
            onClick={() => setTipoFiltro(tipo.value)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              tipoFiltro === tipo.value
                ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
            }`}
          >
            {tipo.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notificaciones.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {soloNoLeidas
                ? 'No tenés notificaciones sin leer'
                : tipoFiltro
                  ? `No tenés notificaciones de tipo ${tipoFiltro}`
                  : 'No tenés notificaciones'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {notificaciones.map((n) => {
            const Icon = tipoIcon[n.tipo] || Bell;
            const colors = tipoColor[n.tipo] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
            return (
              <div
                key={n.id_notificacion}
                onClick={() => {
                  if (!n.leida) marcarLeida(n.id_notificacion);
                  if (n.id_ticket) router.push(`/dashboard/tickets/${n.id_ticket}`);
                  else router.push('/dashboard/tickets');
                }}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                  n.leida
                    ? 'bg-slate-900/30 border-slate-800'
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 cursor-pointer'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${colors}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-medium ${n.leida ? 'text-slate-400' : 'text-white'}`}>
                      {n.titulo}
                    </h3>
                    <span className="text-xs text-slate-500 flex-shrink-0">{formatearFecha(n.fecha_envio)}</span>
                  </div>
                  <p className={`text-sm mt-1 ${n.leida ? 'text-slate-500' : 'text-slate-300'}`}>
                    {n.mensaje}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-500 capitalize">{n.tipo}</span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-500 capitalize">{n.canal}</span>
                  </div>
                </div>
                {!n.leida && (
                  <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
