'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Bell, BellOff, CheckCheck, CreditCard, Activity, Globe } from 'lucide-react';
import type { Notificacion } from '@/types';

const tipoIcon: Record<string, typeof Bell> = {
  transaccional: CreditCard,
  actividad: Activity,
  plataforma: Globe,
};

const tipoColor: Record<string, string> = {
  transaccional: 'text-green-400 bg-green-500/10 border-green-500/20',
  actividad: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  plataforma: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'no_leidas'>('todas');

  const fetchNotificaciones = useCallback(async () => {
    try {
      const res = await api.get('/notificaciones');
      const data = extractData<any>(res);
      setNotificaciones(data?.data || data || []);
    } catch {
      setNotificaciones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  const marcarLeida = async (id: string) => {
    try {
      await api.patch(`/notificaciones/${id}/leer`);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id_notificacion === id ? { ...n, leida: true } : n)),
      );
    } catch {}
  };

  const marcarTodas = async () => {
    try {
      await api.patch('/notificaciones/leer-todas');
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch {}
  };

  const filtradas =
    filtro === 'no_leidas'
      ? notificaciones.filter((n) => !n.leida)
      : notificaciones;

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

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
          <button
            onClick={() => setFiltro(filtro === 'todas' ? 'no_leidas' : 'todas')}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
          >
            {filtro === 'todas' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {filtro === 'todas' ? 'Sin leer' : 'Todas'}
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

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {filtro === 'no_leidas' ? 'No tenés notificaciones sin leer' : 'No tenés notificaciones'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtradas.map((n) => {
            const Icon = tipoIcon[n.tipo] || Bell;
            const colors = tipoColor[n.tipo] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
            return (
              <div
                key={n.id_notificacion}
                onClick={() => !n.leida && marcarLeida(n.id_notificacion)}
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
