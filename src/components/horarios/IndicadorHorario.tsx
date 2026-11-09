'use client';

import { useEffect, useState } from 'react';
import api, { extractData } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';

interface EstadoHorario {
  horarios: Record<string, { inicio: string; fin: string }>;
  es_abierto_ahora: boolean;
  siguiente_apertura: string | null;
  feriado_hoy: boolean;
}

interface IndicadorHorarioProps {
  className?: string;
}

export default function IndicadorHorario({ className }: IndicadorHorarioProps) {
  const [estado, setEstado] = useState<EstadoHorario | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    let activo = true;

    api
      .get('/horario-atencion')
      .then((res) => {
        const data = extractData<EstadoHorario>(res);
        if (activo) {
          setEstado(
            data && typeof data.es_abierto_ahora === 'boolean' ? data : null,
          );
        }
      })
      .catch(() => {
        if (activo) setEstado(null);
      })
      .finally(() => {
        if (activo) setCargado(true);
      });

    return () => {
      activo = false;
    };
  }, []);

  if (!cargado || !estado) return null;

  const proxima = estado.siguiente_apertura
    ? new Date(estado.siguiente_apertura)
    : null;
  const proximaValida = proxima && !Number.isNaN(proxima.getTime());

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {estado.es_abierto_ahora ? (
        <>
          <Wifi className="w-4 h-4 text-green-400" />
          <span className="text-green-400 font-medium">Estamos en línea</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">
            {estado.feriado_hoy ? 'Hoy es feriado' : 'Fuera de horario'}
            {proximaValida && (
              <span className="text-slate-500 ml-1">
                · Próximo: {proxima.toLocaleDateString('es-AR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </span>
        </>
      )}
    </div>
  );
}
