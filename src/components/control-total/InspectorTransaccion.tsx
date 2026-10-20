'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Chip, Semaforo } from './Semaforo';
import { fmtArs, fmtFecha } from '@/lib/control-total';
import type { EventoControl, InspectorTransaccion } from '@/lib/control-total';
import { Search } from 'lucide-react';

function ListaEventos({ eventos, vacio }: { eventos: EventoControl[]; vacio: string }) {
  if (eventos.length === 0) {
    return <p className="text-xs text-slate-500">{vacio}</p>;
  }
  return (
    <ul className="space-y-1">
      {eventos.map((ev) => (
        <li key={ev.id} className="flex flex-wrap items-center gap-2 text-xs bg-slate-900/40 rounded-lg px-3 py-2">
          <span className="font-mono text-slate-500">{fmtFecha(ev.fecha)}</span>
          <span className="font-mono text-slate-200">{ev.tipo}</span>
          <Chip tono={ev.severidad === 'error' ? 'red' : 'slate'}>{ev.origen}</Chip>
          {ev.titulo && <span className="text-slate-400 truncate">{ev.titulo}</span>}
        </li>
      ))}
    </ul>
  );
}

export function InspectorTransaccionSeccion({
  datos,
  onBuscar,
  buscando,
}: {
  datos: InspectorTransaccion | null;
  onBuscar: (id: string) => void;
  buscando: boolean;
}) {
  const [id, setId] = useState('');

  if (!datos) {
    return (
      <Card>
        <h3 className="font-medium text-white text-sm mb-3">Inspector de trazabilidad</h3>
        <p className="text-sm text-slate-500 mb-4">
          Ingresa un id de transacción (o usa el botón «Inspeccionar» del espejo o de las
          inconsistencias) para ver la traza completa.
        </p>
        <div className="flex items-center gap-2">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="uuid de la transacción…"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white px-3 py-2 font-mono"
          />
          <Button size="sm" disabled={!id.trim() || buscando} onClick={() => onBuscar(id.trim())}>
            <Search className="w-3.5 h-3.5 mr-1" />
            Inspeccionar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="font-medium text-white text-sm">Inspector de trazabilidad</h3>
          <span className="font-mono text-xs text-cyan-300">{datos.id_transaccion}</span>
          {datos.espejo && <Semaforo valor={datos.espejo.semaforo} className="ml-auto" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {datos.comision && (
            <div className="bg-slate-900/40 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-400 mb-2">Comisión y liberación</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-slate-500">Monto total</span>
                <span className="text-slate-200">{fmtArs(datos.comision.monto)}</span>
                <span className="text-slate-500">Comisión</span>
                <span className="text-cyan-300">{fmtArs(datos.comision.monto_comision)}</span>
                <span className="text-slate-500">Liberado</span>
                <span className="text-emerald-300">{fmtArs(datos.comision.monto_liberado)}</span>
                <span className="text-slate-500">Neto proveedor</span>
                <span className="text-emerald-300">{fmtArs(datos.comision.neto_proveedor)}</span>
              </div>
            </div>
          )}
          {datos.anticipo && (
            <div className="bg-slate-900/40 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-400 mb-2">
                Anticipo {datos.anticipo.porcentaje}%
              </p>
              <p className="text-lg font-bold text-yellow-300">{fmtArs(datos.anticipo.bruto)}</p>
              <p className="text-xs text-slate-500 mt-1">
                Liberado el {fmtFecha(datos.anticipo.fecha)}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">
              Webhooks ({datos.webhooks.length})
            </p>
            <ListaEventos
              eventos={datos.webhooks}
              vacio="Sin webhooks registrados para esta transacción."
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">Jobs ({datos.jobs.length})</p>
            <ListaEventos eventos={datos.jobs} vacio="Sin jobs registrados." />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">
              Cambios de estado ({datos.cambios_estado.length})
            </p>
            <ListaEventos eventos={datos.cambios_estado} vacio="Sin cambios de estado." />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">Crons ({datos.cron.length})</p>
            <ListaEventos eventos={datos.cron} vacio="Sin intervenciones de cron." />
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-slate-400 mb-2">
              Cálculos de comisión / liberación / anticipo ({datos.calculos.length})
            </p>
            <ListaEventos
              eventos={datos.calculos}
              vacio="Sin cálculos registrados (aún no liberado)."
            />
          </div>
        </div>

        <details className="mt-4">
          <summary className="text-xs text-cyan-400 cursor-pointer">
            Ver los {datos.todos_eventos.length} eventos en crudo (JSON)
          </summary>
          <pre className="mt-2 text-[11px] text-slate-400 bg-slate-900/70 border border-slate-800 rounded-lg p-3 overflow-x-auto max-h-72">
            {JSON.stringify(datos.todos_eventos, null, 2)}
          </pre>
        </details>

        <p className="mt-3 text-[11px] text-slate-500">
          Generado el {fmtFecha(datos.generado_en)}
        </p>
      </Card>
    </div>
  );
}
