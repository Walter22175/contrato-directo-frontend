'use client';

import { cn } from '@/lib/utils';
import type { SlaTracking } from '@/types';

const estadoEstilos: Record<string, string> = {
  cumplido: 'text-green-400 bg-green-500/10 border-green-500/30',
  en_riesgo: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  vencido: 'text-red-400 bg-red-500/10 border-red-500/30',
  pendiente: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

const estadoLabels: Record<string, string> = {
  cumplido: 'Cumplido',
  en_riesgo: 'En riesgo',
  vencido: 'Vencido',
  pendiente: 'Pendiente',
};

interface SlaBadgeProps {
  estado: SlaTracking['estado_sla'];
  className?: string;
}

export default function SlaBadge({ estado, className }: SlaBadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', estadoEstilos[estado] || estadoEstilos.pendiente, className)}>
      {estadoLabels[estado] || estado}
    </span>
  );
}
