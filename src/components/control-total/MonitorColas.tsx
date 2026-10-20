'use client';

import { Card } from '@/components/ui/Card';
import { Chip } from './Semaforo';
import { fmtNum } from '@/lib/control-total';
import type { MonitorColas } from '@/lib/control-total';
import { AlertTriangle, Database, Layers } from 'lucide-react';

function EstadoColaFila({
  nombre,
  waiting,
  active,
  completed,
  failed,
  delayed,
}: {
  nombre: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}) {
  const conProblemas = failed > 0 || waiting > 10;
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-cyan-400" />
        <span className="font-mono text-sm text-white">{nombre}</span>
        {conProblemas ? (
          <Chip tono="red">{failed > 0 ? `${failed} fallidos` : `${waiting} esperando`}</Chip>
        ) : (
          <Chip tono="emerald">saludable</Chip>
        )}
      </div>
      <div className="grid grid-cols-5 gap-2 text-center">
        {(
          [
            ['esperando', waiting, 'text-slate-300'],
            ['activos', active, 'text-cyan-300'],
            ['completados', completed, 'text-emerald-300'],
            ['fallidos', failed, 'text-red-300'],
            ['retrasados', delayed, 'text-yellow-300'],
          ] as const
        ).map(([label, valor, color]) => (
          <div key={label}>
            <p className={`text-lg font-bold ${failed > 0 && label === 'fallidos' ? 'text-red-400' : color}`}>
              {fmtNum(valor)}
            </p>
            <p className="text-[10px] text-slate-500 uppercase">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonitorColasSeccion({ datos }: { datos: MonitorColas | null }) {
  if (!datos) return null;

  const riesgos = datos.riesgos;
  const hayRiesgos =
    riesgos.jobs_fallidos_24h > 0 ||
    riesgos.jobs_sin_job_id_24h > 0 ||
    riesgos.jobs_stuck > 0 ||
    riesgos.jobs_duplicados_24h > 0 ||
    riesgos.marcado_sin_encolar > 0 ||
    riesgos.encolado_sin_marcado > 0;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="font-medium text-white text-sm">Monitor de colas</h3>
          <Chip tono={datos.modo === 'redis' ? 'cyan' : 'orange'}>
            <Database className="w-3 h-3" />
            modo {datos.modo === 'redis' ? 'Redis' : 'inline (sin Redis)'}
          </Chip>
          {datos.error_conexion && <Chip tono="red">error: {datos.error_conexion}</Chip>}
        </div>
        {datos.colas.length === 0 ? (
          <p className="text-sm text-slate-500">Sin colas registradas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {datos.colas.map((c) => (
              <EstadoColaFila key={c.nombre} {...c} />
            ))}
          </div>
        )}
        <p className="mt-3 text-[11px] text-slate-500">
          {datos.modo === 'inline'
            ? 'Sin Redis: los jobs se procesan en línea y los contadores provienen de control_evento (últimas 24 h).'
            : 'Contadores en vivo desde Redis/BullMQ.'}
        </p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="font-medium text-white text-sm">Riesgos de jobs (24 h)</h3>
          {hayRiesgos ? (
            <Chip tono="red">
              <AlertTriangle className="w-3 h-3" />
              {riesgos.detalle.length} hallazgos
            </Chip>
          ) : (
            <Chip tono="emerald">sin riesgos detectados</Chip>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4 text-center">
          {(
            [
              ['fallidos', riesgos.jobs_fallidos_24h],
              ['sin job id', riesgos.jobs_sin_job_id_24h],
              ['stuck', riesgos.jobs_stuck],
              ['duplicados', riesgos.jobs_duplicados_24h],
              ['marcado sin encolar', riesgos.marcado_sin_encolar],
              ['encolado sin marcar', riesgos.encolado_sin_marcado],
            ] as const
          ).map(([label, valor]) => (
            <div key={label} className="bg-slate-900/40 rounded-lg p-3">
              <p className={`text-lg font-bold ${valor > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                {fmtNum(valor)}
              </p>
              <p className="text-[10px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        {riesgos.detalle.length > 0 && (
          <ul className="space-y-2">
            {riesgos.detalle.map((d) => (
              <li key={d.tipo} className="bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-red-300">{d.tipo}</span>
                  <span className="font-bold text-red-400">{d.cantidad}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{d.recomendacion}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
