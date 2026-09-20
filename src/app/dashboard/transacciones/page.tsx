'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard, Eye, Filter, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Transaccion } from '@/types';

const estadoColors: Record<string, string> = {
  pendiente: 'text-yellow-400 bg-yellow-400/10',
  en_proceso: 'text-blue-400 bg-blue-400/10',
  completada: 'text-green-400 bg-green-400/10',
  cancelada: 'text-red-400 bg-red-400/10',
  en_disputa: 'text-orange-400 bg-orange-400/10',
};

const estadoIcons: Record<string, typeof Clock> = {
  pendiente: Clock,
  en_proceso: AlertCircle,
  completada: CheckCircle,
  cancelada: XCircle,
};

export default function TransaccionesPage() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [filtro, setFiltro] = useState('todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransacciones = async () => {
      try {
        const res = await api.get('/transacciones');
        const raw = extractData<any>(res);
        setTransacciones(raw?.data || raw || []);
      } catch {
        setTransacciones([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransacciones();
  }, []);

  const filtradas = transacciones.filter((t) => {
    if (filtro === 'todas') return true;
    return t.estado === filtro;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Mis Transacciones</h1>
        <p className="text-slate-400 mt-1">Gestioná tus transacciones y pagos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['todas', 'pendiente', 'en_proceso', 'completada', 'cancelada'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtro === f
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
            }`}
          >
            {f === 'todas' ? 'Todas' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Sin transacciones</h2>
            <p className="text-slate-400">Tus transacciones aparecerán aquí cuando contrates un servicio.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtradas.map((t) => {
            const Icon = estadoIcons[t.estado] || Clock;
            return (
              <Card key={t.id_transaccion}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${estadoColors[t.estado] || 'text-slate-400 bg-slate-700/50'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {t.servicio?.nombre || 'Servicio'}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {t.descripcion || `Transacción #${t.id_transaccion.slice(0, 8)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{formatCurrency(t.monto_acordado)}</p>
                    <p className="text-xs text-slate-500">{formatDate(t.fecha_creacion)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColors[t.estado] || 'text-slate-400 bg-slate-700/50'}`}>
                    {t.estado.replace('_', ' ')}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
