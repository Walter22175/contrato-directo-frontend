'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { BarChart3, TrendingUp, Users, DollarSign, AlertTriangle, FileText } from 'lucide-react';

interface Metrica {
  label: string;
  valor: string | number;
  icono: typeof TrendingUp;
  color: string;
}

export default function AdminReportesPage() {
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('actual');

  const fetchReportes = useCallback(async () => {
    setLoading(true);
    try {
      const [transRes, usersRes, reclamosRes] = await Promise.allSettled([
        api.get('/transacciones'),
        api.get('/usuarios'),
        api.get('/reclamos'),
      ]);
      const txData = transRes.status === 'fulfilled' ? extractData<any>(transRes.value) : null;
      const usersData = usersRes.status === 'fulfilled' ? extractData<any>(usersRes.value) : null;
      const reclamosData = reclamosRes.status === 'fulfilled' ? extractData<any>(reclamosRes.value) : null;

      const txArr = txData?.data || [];
      const totalIngresos = txArr.reduce((acc: number, t: any) => acc + (Number(t.monto_total) || 0), 0);

      setMetricas([
        { label: 'Total Usuarios', valor: usersData?.meta?.total || usersData?.data?.length || 0, icono: Users, color: 'text-cyan-400' },
        { label: 'Transacciones', valor: txArr.length || 0, icono: TrendingUp, color: 'text-green-400' },
        { label: 'Ingresos Totales', valor: `$${totalIngresos.toLocaleString('es-AR')}`, icono: DollarSign, color: 'text-yellow-400' },
        { label: 'Reclamos Activos', valor: reclamosData?.data?.filter((r: any) => r.estado !== 'cerrado').length || 0, icono: AlertTriangle, color: 'text-red-400' },
      ]);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReportes(); }, [fetchReportes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reportes Agregados</h1>
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="actual">Período Actual</option>
          <option value="trimestre">Trimestre</option>
          <option value="anual">Anual</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricas.map((m) => {
            const Icon = m.icono;
            return (
              <Card key={m.label}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-8 h-8 ${m.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{m.valor}</div>
                  <p className="text-sm text-slate-400">{m.label}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Transacciones por Período
            </h2>
            <div className="space-y-3">
              {['Enero', 'Febrero', 'Marzo'].map((mes, i) => (
                <div key={mes} className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 w-20">{mes}</span>
                  <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${[65, 80, 45][i]}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-10 text-right">{[65, 80, 45][i]}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-400" />
              Actividad Reciente
            </h2>
            <div className="space-y-3">
              {[
                { texto: 'Nuevo usuario registrado', tiempo: 'Hace 5 min', color: 'text-green-400' },
                { texto: 'Transacción completada', tiempo: 'Hace 15 min', color: 'text-cyan-400' },
                { texto: 'Reclamo abierto', tiempo: 'Hace 1 hora', color: 'text-red-400' },
                { texto: 'Proveedor verificado', tiempo: 'Hace 2 horas', color: 'text-yellow-400' },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <span className="text-sm text-slate-300">{a.texto}</span>
                  <span className={`text-xs ${a.color}`}>{a.tiempo}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
