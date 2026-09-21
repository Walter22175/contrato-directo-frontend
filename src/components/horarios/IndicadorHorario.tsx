'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { estaEnHorario, obtenerHorarios, obtenerProximoHorario } from '@/lib/horarios';
import { Wifi, WifiOff } from 'lucide-react';

interface IndicadorHorarioProps {
  canal?: string;
  className?: string;
}

export default function IndicadorHorario({ canal, className }: IndicadorHorarioProps) {
  const [enHorario, setEnHorario] = useState<boolean | null>(null);
  const [proximoHorario, setProximoHorario] = useState<{ fecha: Date; horario: { nombre: string } } | null>(null);

  useEffect(() => {
    const horarios = obtenerHorarios();
    setEnHorario(estaEnHorario(horarios, canal));
    const proximo = obtenerProximoHorario(horarios);
    setProximoHorario(proximo);
  }, [canal]);

  if (enHorario === null) return null;

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {enHorario ? (
        <>
          <Wifi className="w-4 h-4 text-green-400" />
          <span className="text-green-400 font-medium">Estamos en línea</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">
            Fuera de horario
            {proximoHorario && (
              <span className="text-slate-500 ml-1">
                · Próximo: {proximoHorario.fecha.toLocaleDateString('es-AR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </span>
        </>
      )}
    </div>
  );
}
