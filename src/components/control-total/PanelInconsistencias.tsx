'use client';

import { Card } from '@/components/ui/Card';
import { Chip } from './Semaforo';
import { descargarCsv, fmtNum } from '@/lib/control-total';
import type { Inconsistencia } from '@/lib/control-total';
import { Download, ShieldAlert } from 'lucide-react';

const COLOR_SEVERIDAD: Record<Inconsistencia['severidad'], 'red' | 'yellow' | 'slate'> = {
  critica: 'red',
  media: 'yellow',
  baja: 'slate',
};

export function PanelInconsistenciasSeccion({
  datos,
  onInspeccionar,
}: {
  datos: Inconsistencia[] | null;
  onInspeccionar: (id: string) => void;
}) {
  if (!datos) return null;

  const exportar = () => {
    const filas: string[] = [
      'regla,severidad,cantidad,recomendacion,id_transaccion',
      ...datos.map((i) =>
        [
          `"${i.regla.replace(/"/g, '""')}"`,
          i.severidad,
          i.cantidad,
          `"${i.recomendacion.replace(/"/g, '""')}"`,
          i.id_transaccion ?? '',
        ].join(','),
      ),
    ];
    descargarCsv('control-total-inconsistencias', filas);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h3 className="font-medium text-white text-sm">
          Auditoría de inconsistencias · {datos.length} reglas activas
        </h3>
        <button
          type="button"
          onClick={exportar}
          className="ml-auto inline-flex items-center text-xs text-slate-300 hover:text-white"
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          CSV
        </button>
      </div>

      {datos.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-emerald-300">
          <ShieldAlert className="w-4 h-4" />
          Sin inconsistencias detectadas. Los contadores MP ↔ BD coinciden.
        </div>
      ) : (
        <ul className="space-y-2">
          {datos.map((i) => (
            <li
              key={i.regla}
              className={`rounded-xl border px-4 py-3 ${
                i.severidad === 'critica'
                  ? 'bg-red-500/5 border-red-500/20'
                  : i.severidad === 'media'
                    ? 'bg-yellow-500/5 border-yellow-500/20'
                    : 'bg-slate-800/40 border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Chip tono={COLOR_SEVERIDAD[i.severidad]}>
                  {i.severidad === 'critica' ? 'Crítica' : i.severidad === 'media' ? 'Media' : 'Baja'}
                </Chip>
                <span className="text-sm text-white">{i.regla}</span>
                <span
                  className={`ml-auto text-lg font-bold ${
                    i.severidad === 'critica' ? 'text-red-400' : 'text-slate-200'
                  }`}
                >
                  {fmtNum(i.cantidad)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{i.recomendacion}</p>
              {(i.id_transaccion || i.id_pago) && (
                <button
                  type="button"
                  onClick={() => onInspeccionar(i.id_transaccion ?? i.id_pago ?? '')}
                  className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  Inspeccionar {(i.id_transaccion ?? i.id_pago)?.slice(0, 12)}…
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
