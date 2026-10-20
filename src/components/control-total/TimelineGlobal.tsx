'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Chip } from './Semaforo';
import { descargarCsv, fmtFecha } from '@/lib/control-total';
import type { EventoControl, TimelineGlobal } from '@/lib/control-total';
import { AlertTriangle, Download, ShieldCheck, Zap } from 'lucide-react';

const COLOR_SEVERIDAD: Record<string, string> = {
  error: 'bg-red-500/10 text-red-300 border-red-500/30',
  warning: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  info: 'bg-slate-600/30 text-slate-300 border-slate-600/50',
};

const COLOR_ORIGEN: Record<string, string> = {
  webhook: 'cyan',
  cron: 'orange',
  api: 'slate',
  sistema: 'slate',
};

function FilaEvento({ ev }: { ev: EventoControl }) {
  const [abierto, setAbierto] = useState(false);
  const detalle = ev.detalle as Record<string, unknown> | null;
  const correlacion = ev.correlacion_mp as Record<string, unknown> | null;
  const hayJson = (detalle && Object.keys(detalle).length > 0) || (correlacion && Object.keys(correlacion).length > 0);

  return (
    <li className="border-l-2 border-slate-700 pl-4 py-2 hover:border-cyan-500/60 transition-colors">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 font-mono">{fmtFecha(ev.fecha)}</span>
        <span className="font-mono text-slate-200">{ev.tipo}</span>
        <span
          className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${COLOR_SEVERIDAD[ev.severidad] ?? COLOR_SEVERIDAD.info}`}
        >
          {ev.severidad}
        </span>
        <Chip tono={(COLOR_ORIGEN[ev.origen] ?? 'slate') as 'slate'}>{ev.origen}</Chip>
        {ev.titulo && <span className="text-slate-300 truncate">{ev.titulo}</span>}
        {hayJson && (
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className="ml-auto text-cyan-400 hover:text-cyan-300 text-[11px]"
          >
            {abierto ? 'ocultar detalle' : 'ver detalle'}
          </button>
        )}
      </div>
      {abierto && hayJson && (
        <pre className="mt-2 text-[11px] text-slate-400 bg-slate-900/70 border border-slate-800 rounded-lg p-3 overflow-x-auto max-h-56">
          {JSON.stringify({ ...(detalle ?? {}), ...(correlacion ?? {}) }, null, 2)}
        </pre>
      )}
    </li>
  );
}

export function TimelineGlobalSeccion({ datos }: { datos: TimelineGlobal | null }) {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [filtroTipo, setFiltroTipo] = useState('');

  if (!datos) return null;

  const tipos = [...new Set(datos.transacciones.flatMap((t) => t.eventos.map((e) => e.tipo)))].sort();

  const grupos = datos.transacciones.filter(
    (t) => !filtroTipo || t.eventos.some((e) => e.tipo === filtroTipo),
  );

  const toggle = (clave: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(clave)) next.delete(clave);
      else next.add(clave);
      return next;
    });
  };

  const exportar = () => {
    const filas: string[] = ['fecha,tipo,severidad,origen,id_transaccion,id_pago,titulo'];
    for (const g of datos.transacciones) {
      for (const e of g.eventos) {
        filas.push(
          [
            e.fecha,
            e.tipo,
            e.severidad,
            e.origen,
            e.id_transaccion ?? '',
            e.id_pago ?? '',
            `"${(e.titulo ?? '').replace(/"/g, '""')}"`,
          ].join(','),
        );
      }
    }
    descargarCsv('control-total-timeline', filas);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h3 className="font-medium text-white text-sm">
          Timeline global · {datos.total} eventos · {datos.transacciones.length} transacciones
        </h3>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="ml-auto bg-slate-800 border border-slate-700 rounded-lg text-xs text-white px-2 py-1.5"
        >
          <option value="">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Button variant="ghost" size="sm" onClick={exportar}>
          <Download className="w-3.5 h-3.5 mr-1" />
          CSV
        </Button>
      </div>

      {grupos.length === 0 ? (
        <p className="text-sm text-slate-500">Sin eventos para los filtros actuales.</p>
      ) : (
        <ul className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
          {grupos.map((g) => {
            const abierta = expandidos.has(g.clave) || grupos.length === 1;
            return (
              <li key={g.clave} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {g.id_transaccion && (
                    <button
                      type="button"
                      onClick={() => toggle(g.clave)}
                      className="font-mono text-xs text-cyan-300 hover:text-cyan-200"
                      title="Expandir/colapsar"
                    >
                      {g.id_transaccion}
                    </button>
                  )}
                  {!g.id_transaccion && (
                    <span className="font-mono text-xs text-slate-400">sin transacción</span>
                  )}
                  {g.id_pago && <Chip tono="slate">pago {g.id_pago.slice(0, 8)}…</Chip>}
                  <span className="text-xs text-slate-500 ml-auto">
                    {g.eventos.length} eventos
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(g.clave)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    {abierta ? 'colapsar' : 'expandir'}
                  </button>
                </div>
                {abierta && (
                  <ul className="space-y-1">
                    {g.eventos.map((ev) => (
                      <FilaEvento key={ev.id} ev={ev} />
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-[11px] text-slate-500 flex items-center gap-1">
        {datos.cursor ? (
          <>
            <Zap className="w-3 h-3" /> Cursor de paginación: {datos.cursor} (consultas posteriores
            pueden paginar con él)
          </>
        ) : (
          <>
            <ShieldCheck className="w-3 h-3" /> Sin eventos recientes
          </>
        )}
        {datos.total >= 1000 && (
          <>
            <AlertTriangle className="w-3 h-3 text-yellow-400" /> Límite alcanzado: refina el rango
          </>
        )}
      </p>
    </Card>
  );
}
