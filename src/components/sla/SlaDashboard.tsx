'use client';

import { Card, CardTitle } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricaItem {
  titulo: string;
  valor: string | number;
  cambio?: string;
  meta?: string;
  icono: typeof TrendingUp;
  color: string;
  cumplido?: boolean;
}

interface SlaDashboardProps {
  metricas: MetricaItem[];
}

export default function SlaDashboard({ metricas }: SlaDashboardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricas.map((m) => {
        const Icon = m.cumplido === undefined ? m.icono : m.cumplido ? CheckCircle : AlertTriangle;
        return (
          <Card key={m.titulo}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{m.titulo}</span>
                <Icon className={cn('w-5 h-5', m.color)} />
              </div>
              <div className="text-2xl font-bold text-white">{m.valor}</div>
              <div className="flex items-center gap-2 mt-1">
                {m.cambio && (
                  <span className={cn('text-xs', m.cambio.startsWith('+') ? 'text-green-400' : 'text-red-400')}>
                    {m.cambio}
                  </span>
                )}
                {m.meta && <span className="text-xs text-slate-500">Meta: {m.meta}</span>}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
