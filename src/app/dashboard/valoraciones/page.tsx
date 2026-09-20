'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Star, MessageSquare, Filter } from 'lucide-react';
import type { Valoracion } from '@/types';

type Tab = 'recibidas' | 'dadas';

export default function ValoracionesPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('recibidas');
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchValoraciones = useCallback(async () => {
    if (!user?.id_usuario) return;
    setLoading(true);
    try {
      const param = tab === 'recibidas' ? 'id_evaluado' : 'id_evaluador';
      const res = await api.get('/valoraciones', { params: { [param]: user.id_usuario } });
      const data = extractData<any>(res);
      setValoraciones(data?.data || data || []);
    } catch {
      setValoraciones([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id_usuario, tab]);

  useEffect(() => {
    fetchValoraciones();
  }, [fetchValoraciones]);

  const promedio = valoraciones.length
    ? (valoraciones.reduce((acc, v) => acc + v.puntuacion, 0) / valoraciones.length).toFixed(1)
    : '0.0';

  const distribucion = [5, 4, 3, 2, 1].map((n) => ({
    stars: n,
    count: valoraciones.filter((v) => v.puntuacion === n).length,
  }));

  const maxCount = Math.max(...distribucion.map((d) => d.count), 1);

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Mis Valoraciones</h1>

      <div className="flex gap-1 border-b border-slate-700">
        {(['recibidas', 'dadas'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4" />
            {t === 'recibidas' ? 'Recibidas' : 'Dadas'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6 text-center">
            <div className="text-4xl font-bold text-white mb-1">{promedio}</div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${s <= Math.round(parseFloat(promedio)) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                />
              ))}
            </div>
            <p className="text-sm text-slate-400">{valoraciones.length} valoraciones</p>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <div className="p-6 space-y-2">
            {distribucion.map((d) => (
              <div key={d.stars} className="flex items-center gap-3">
                <span className="text-sm text-slate-400 w-6 text-right">{d.stars}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${(d.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : valoraciones.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {tab === 'recibidas' ? 'Aún no tenés valoraciones recibidas' : 'Aún no dejaste valoraciones'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {valoraciones.map((v) => (
            <Card key={v.id_valoracion}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                      <span className="text-xs text-slate-300">
                        {v.tipo_evaluador === 'cliente' ? 'CL' : 'PV'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {v.tipo_evaluador === 'cliente' ? 'Cliente' : 'Proveedor'}
                      </p>
                      <p className="text-xs text-slate-500">{formatearFecha(v.fecha_valoracion)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= v.puntuacion ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                      />
                    ))}
                  </div>
                </div>
                {v.comentario && (
                  <p className="text-sm text-slate-300 mt-2">{v.comentario}</p>
                )}
                <div className="mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    v.estado === 'publicada' ? 'text-green-400 bg-green-500/10' :
                    v.estado === 'pendiente_moderacion' ? 'text-yellow-400 bg-yellow-500/10' :
                    'text-slate-400 bg-slate-500/10'
                  }`}>
                    {v.estado}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
