'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { calcularTiempoRestanteMin, formatearTiempoRestante } from '@/lib/sla';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface SlaTimerProps {
  fechaLimite: string;
  completado?: boolean;
  className?: string;
}

export default function SlaTimer({ fechaLimite, completado = false, className }: SlaTimerProps) {
  const [minutos, setMinutos] = useState(() => calcularTiempoRestanteMin(fechaLimite));

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutos(calcularTiempoRestanteMin(fechaLimite));
    }, 60000);
    return () => clearInterval(interval);
  }, [fechaLimite]);

  if (completado) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs text-green-400', className)}>
        <CheckCircle className="w-3 h-3" /> Cumplido
      </span>
    );
  }

  const color = minutos <= 0 ? 'text-red-400' : minutos < 30 ? 'text-yellow-400' : 'text-slate-400';
  const Icon = minutos <= 0 ? AlertTriangle : Clock;

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', color, className)}>
      <Icon className="w-3 h-3" />
      {minutos <= 0 ? 'Vencido' : formatearTiempoRestante(minutos)}
    </span>
  );
}
