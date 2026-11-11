'use client';

import { useEffect, useState } from 'react';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { LlaveIcon } from '@/components/ui/LlaveIcon';
import {
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface RankingData {
  id_ranking: string;
  id_proveedor: string;
  puntaje_rating: number;
  puntaje_antiguedad: number;
  puntaje_transacciones: number;
  puntaje_respuesta: number;
  puntaje_cumplimiento: number;
  puntaje_ranking: number;
  posicion_ranking: number;
  total_valoraciones: number;
  promedio_valoraciones: number;
  proveedor_destacado: boolean;
  fecha_calculo: string;
}

interface MiReputacionCardProps {
  idProveedor: string;
}

export function MiReputacionCard({ idProveedor }: MiReputacionCardProps) {
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    const fetchRanking = async () => {
      try {
        const res = await api.get<RankingData>(`/ranking/${idProveedor}`);
        const data = extractData<RankingData>(res);
        if (!cancel && data) {
          setRanking(data);
        }
      } catch {
        // Si no tiene ranking aún o falla, se degrada elegantemente
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    if (idProveedor) {
      fetchRanking();
    }
    return () => {
      cancel = true;
    };
  }, [idProveedor]);

  if (loading) {
    return (
      <Card className="p-6 mb-8 animate-pulse bg-slate-800/40">
        <div className="h-6 w-48 bg-slate-700/60 rounded mb-4" />
        <div className="h-20 bg-slate-700/30 rounded" />
      </Card>
    );
  }

  if (!ranking) {
    return null;
  }

  const pilares = [
    {
      label: 'Valoración Promedio',
      peso: '40%',
      valor: `${Number(ranking.promedio_valoraciones || 0).toFixed(1)} / 5`,
      puntaje: ranking.puntaje_rating,
      icono: LlaveIcon,
      color: 'text-yellow-400',
    },
    {
      label: 'Antigüedad',
      peso: '20%',
      valor: `${Math.round(ranking.puntaje_antiguedad)} pts`,
      puntaje: ranking.puntaje_antiguedad,
      icono: Clock,
      color: 'text-cyan-400',
    },
    {
      label: 'Transacciones Completadas',
      peso: '20%',
      valor: `${Math.round(ranking.puntaje_transacciones)} pts`,
      puntaje: ranking.puntaje_transacciones,
      icono: TrendingUp,
      color: 'text-emerald-400',
    },
    {
      label: 'Tasa de Respuesta',
      peso: '10%',
      valor: `${Math.round(ranking.puntaje_respuesta)}%`,
      puntaje: ranking.puntaje_respuesta,
      icono: MessageSquare,
      color: 'text-blue-400',
    },
    {
      label: 'Tasa de Cumplimiento',
      peso: '10%',
      valor: `${Math.round(ranking.puntaje_cumplimiento)}%`,
      puntaje: ranking.puntaje_cumplimiento,
      icono: CheckCircle,
      color: 'text-purple-400',
    },
  ];

  return (
    <Card className="p-6 mb-8 border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/80">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">Mi Reputación en la Plataforma</h2>
              {ranking.proveedor_destacado ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Proveedor Destacado
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Posición #{ranking.posicion_ranking || '-'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Algoritmo de visibilidad OE7 recalculado periódicamente por tus servicios completados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Puntaje Global</span>
            <div className="text-2xl font-black text-white font-mono">
              {Number(ranking.puntaje_ranking || 0).toFixed(1)}
              <span className="text-xs text-slate-500 font-normal"> / 100</span>
            </div>
          </div>

          <Link
            href="/proveedores?ordenar_por=ranking"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            Ver Ranking Completo
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Grid de 5 Pilares */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {pilares.map((p) => {
          const Icon = p.icono;
          return (
            <div
              key={p.label}
              className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {p.peso}
                  </span>
                  <Icon className={`w-4 h-4 ${p.color}`} />
                </div>
                <p className="text-xs text-slate-300 font-medium leading-tight">{p.label}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                <span className="text-sm font-bold text-white font-mono">{p.valor}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sugerencia o condición para destacado */}
      {!ranking.proveedor_destacado && (
        <div className="mt-4 p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl flex items-center gap-2.5 text-xs text-slate-400">
          <HelpCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            Para obtener el distintivo de <strong className="text-white">Proveedor Destacado</strong> se requiere un promedio ≥ 4.5 llaves y más de 10 valoraciones verificadas.
          </span>
        </div>
      )}
    </Card>
  );
}
