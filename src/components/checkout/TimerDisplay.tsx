'use client';

import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatearTiempo } from '@/hooks/useStepTimer';

interface TimerDisplayProps {
  tiempoSegundos: number;
  pasoActual: number;
  pasoObjetivo: number;
  mostrarAlerta?: boolean;
  umbralAlerta?: number; // en segundos
  className?: string;
}

export function TimerDisplay({
  tiempoSegundos,
  pasoActual,
  pasoObjetivo,
  mostrarAlerta = true,
  umbralAlerta = 300, // 5 minutos por defecto
  className = '',
}: TimerDisplayProps) {
  const excedido = tiempoSegundos > umbralAlerta;
  const cerca = tiempoSegundos > umbralAlerta * 0.8 && !excedido;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
        excedido
          ? 'bg-red-500/10 border-red-500/30 text-red-400'
          : cerca
          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
      } ${className}`}
      role="timer"
      aria-live="polite"
      aria-label={`Tiempo en paso ${pasoActual}: ${formatearTiempo(tiempoSegundos)}`}
    >
      <Clock className={`w-5 h-5 ${excedido ? 'animate-pulse' : ''}`} />
      <span className="font-mono text-lg font-semibold tabular-nums">
        {formatearTiempo(tiempoSegundos)}
      </span>
      {mostrarAlerta && excedido && (
        <AlertTriangle className="w-4 h-4 animate-pulse" aria-hidden="true" />
      )}
      {mostrarAlerta && cerca && !excedido && (
        <span className="text-xs opacity-70">⚠</span>
      )}
      <span className="text-xs text-slate-500 ml-1">Paso {pasoActual}/{pasoObjetivo}</span>
    </div>
  );
}

export function TimerProgress({
  pasoActual,
  totalPasos = 4,
  className = '',
}: {
  pasoActual: number;
  totalPasos?: number;
  className?: string;
}) {
  const progreso = (pasoActual / totalPasos) * 100;

  return (
    <div className={`w-full h-2 bg-slate-800 rounded-full overflow-hidden ${className}`} role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
        style={{ width: `${progreso}%` }}
      />
      <div className="flex justify-between mt-1 text-xs text-slate-500">
        {Array.from({ length: totalPasos }, (_, i) => (
          <span key={i} className={i < pasoActual ? 'text-cyan-400 font-medium' : 'text-slate-600'}>
            Paso {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

export function StepTimerCard({
  tiempoSegundos,
  pasoActual,
  totalPasos = 4,
  titulo = 'Tiempo de Contratación',
  mostrarProgreso = true,
  className = '',
}: {
  tiempoSegundos: number;
  pasoActual: number;
  totalPasos?: number;
  titulo?: string;
  mostrarProgreso?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-slate-900/50 border border-slate-700 rounded-2xl p-4 ${className}`}>
      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-cyan-400" />
        {titulo}
      </h3>
      <TimerDisplay
        tiempoSegundos={tiempoSegundos}
        pasoActual={pasoActual}
        pasoObjetivo={totalPasos}
      />
      {mostrarProgreso && <TimerProgress pasoActual={pasoActual} totalPasos={totalPasos} className="mt-3" />}
    </div>
  );
}