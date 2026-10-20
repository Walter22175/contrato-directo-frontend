'use client';

import { Card } from '@/components/ui/Card';
import { Chip, Semaforo } from './Semaforo';
import { fmtFecha, fmtNum } from '@/lib/control-total';
import type { MonitorCrons } from '@/lib/control-total';
import { Timer } from 'lucide-react';

export function MonitorCronsSeccion({ datos }: { datos: MonitorCrons | null }) {
  if (!datos) return null;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h3 className="font-medium text-white text-sm">Monitor de crons</h3>
        <span className="text-xs text-slate-500">
          4 trabajos programados monitoreados (semáforo: verde &lt; 2 períodos, rojo si se cae)
        </span>
      </div>

      <div className="space-y-3">
        {datos.crons.map((c) => (
          <div key={c.nombre} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Timer className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-sm text-white">{c.nombre}</span>
              <code className="text-[11px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                {c.expresion}
              </code>
              <Semaforo valor={c.semaforo} className="ml-auto" />
            </div>

            <p className="text-xs text-slate-400 mb-3">{c.descripcion}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-slate-500">Última ejecución</p>
                <p className="text-slate-200">{fmtFecha(c.ultima_ejecucion)}</p>
              </div>
              <div>
                <p className="text-slate-500">Próxima (estimada)</p>
                <p className="text-slate-200">{fmtFecha(c.proxima_ejecucion)}</p>
              </div>
              <div>
                <p className="text-slate-500">Duración / candidatos</p>
                <p className="text-slate-200">
                  {c.duracion_ms !== null ? `${fmtNum(c.duracion_ms)} ms` : '—'} ·{' '}
                  {c.candidatos !== null ? fmtNum(c.candidatos) : '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Éxitos / fallidos (24 h)</p>
                <p>
                  <span className="text-emerald-300">{fmtNum(c.ejecuciones_exitosas_24h)}</span>
                  <span className="text-slate-600"> / </span>
                  <span
                    className={
                      c.ejecuciones_fallidas_24h > 0 ? 'text-red-400 font-bold' : 'text-slate-300'
                    }
                  >
                    {fmtNum(c.ejecuciones_fallidas_24h)}
                  </span>
                </p>
              </div>
            </div>

            {(c.ultimoResultado || c.ultimoError) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {c.ultimoResultado && (
                  <Chip tono="slate">último: {c.ultimoResultado}</Chip>
                )}
                {c.ultimoError && <Chip tono="red">error: {String(c.ultimoError)}</Chip>}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
