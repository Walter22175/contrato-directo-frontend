import { cn } from '@/lib/utils';
import type { Semaforo as TipoSemaforo } from '@/lib/control-total';

const ESTILOS: Record<TipoSemaforo, { punto: string; texto: string; label: string }> = {
  verde: { punto: 'bg-emerald-400', texto: 'text-emerald-400', label: 'OK' },
  amarillo: { punto: 'bg-yellow-400', texto: 'text-yellow-400', label: 'Atención' },
  rojo: { punto: 'bg-red-500', texto: 'text-red-400', label: 'Crítico' },
  gris: { punto: 'bg-slate-500', texto: 'text-slate-400', label: 'Sin datos' },
};

export function Semaforo({
  valor,
  label,
  className,
}: {
  valor: TipoSemaforo;
  label?: string;
  className?: string;
}) {
  const e = ESTILOS[valor];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border border-slate-700',
        e.texto,
        className,
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', e.punto)} aria-hidden="true" />
      {label ?? e.label}
    </span>
  );
}

export function Chip({
  children,
  tono = 'slate',
  className,
}: {
  children: React.ReactNode;
  tono?: 'slate' | 'cyan' | 'emerald' | 'yellow' | 'red' | 'orange';
  className?: string;
}) {
  const tonos: Record<string, string> = {
    slate: 'bg-slate-700/40 text-slate-300 border-slate-600/50',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-300 border-red-500/20',
    orange: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border',
        tonos[tono],
        className,
      )}
    >
      {children}
    </span>
  );
}
