'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Chip, Semaforo } from './Semaforo';
import { fmtArs, fmtFecha } from '@/lib/control-total';
import type { VistaEspejo } from '@/lib/control-total';
import { Copy, Search } from 'lucide-react';

function Fila({
  label,
  valorMp,
  valorBd,
  divergente,
}: {
  label: string;
  valorMp: React.ReactNode;
  valorBd: React.ReactNode;
  divergente?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 border-b border-slate-800 last:border-0 ${
        divergente ? 'bg-red-500/5' : ''
      }`}
    >
      <div className="text-xs text-slate-300 text-right">{valorMp}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wide text-center px-2">
        {label}
        {divergente && <span className="block text-red-400 font-bold">≠</span>}
      </div>
      <div className="text-xs text-slate-300">{valorBd}</div>
    </div>
  );
}

export function VistaEspejoSeccion({
  datos,
  onInspeccionar,
}: {
  datos: VistaEspejo | null;
  onInspeccionar?: (id: string) => void;
}) {
  const [id, setId] = useState('');

  if (!datos) {
    return (
      <Card>
        <p className="text-sm text-slate-500">
          Selecciona una transacción desde el Timeline o el Inspector para ver la vista espejo.
        </p>
      </Card>
    );
  }

  const mp = datos.mp;
  const bd = datos.bd;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h3 className="font-medium text-white text-sm">Vista espejo MP ↔ BD</h3>
        <span className="font-mono text-xs text-cyan-300">{datos.id_transaccion}</span>
        <Semaforo valor={datos.semaforo} className="ml-auto" />
        {onInspeccionar && (
          <Button size="sm" onClick={() => onInspeccionar(datos.id_transaccion)}>
            <Search className="w-3.5 h-3.5 mr-1" />
            Inspeccionar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="text-right font-semibold text-slate-400">Mercado Pago</div>
        <div className="font-semibold text-slate-400">Base de datos</div>
      </div>

      {mp || bd ? (
        <div>
          <Fila
            label="Estado"
            valorMp={mp?.mp_status ?? '—'}
            valorBd={bd?.estado ?? '—'}
          />
          <Fila
            label="Monto"
            valorMp={mp ? fmtArs(mp.application_fee + mp.monto_proveedor) : '—'}
            valorBd={bd ? fmtArs(bd.monto) : '—'}
            divergente={
              !!mp && !!bd && Math.abs(mp.application_fee + mp.monto_proveedor - bd.monto) > 0.01
            }
          />
          <Fila
            label="Comisión"
            valorMp={mp ? fmtArs(mp.application_fee) : '—'}
            valorBd={bd ? fmtArs(bd.monto_comision) : '—'}
            divergente={!!mp && !!bd && Math.abs(mp.application_fee - bd.monto_comision) > 0.01}
          />
          <Fila
            label="Neto proveedor"
            valorMp={mp ? fmtArs(mp.monto_proveedor) : '—'}
            valorBd={bd ? fmtArs(bd.monto_liberado) : '—'}
            divergente={
              !!mp && !!bd && Math.abs(mp.monto_proveedor - bd.monto_liberado) > 0.01
            }
          />
          <Fila
            label="Capturado"
            valorMp={fmtFecha(mp?.captured_at)}
            valorBd={fmtFecha(bd?.entrega_proveedor_at)}
          />
          <Fila
            label="Cancelado"
            valorMp={fmtFecha(mp?.cancelled_at)}
            valorBd={bd?.estado === 'rechazado' ? 'rechazado (interno)' : '—'}
          />
          <Fila
            label="Anticipo 30%"
            valorMp="—"
            valorBd={bd ? fmtArs(bd.monto_anticipado) : '—'}
          />
          <Fila
            label="Liberado"
            valorMp="—"
            valorBd={fmtFecha(bd?.fecha_liberacion)}
          />
        </div>
      ) : (
        <p className="text-sm text-slate-500">Sin pago ni registro que comparar.</p>
      )}

      {datos.motivos.length > 0 && (
        <div className="mt-4 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
          <p className="text-xs font-semibold text-red-300 mb-1">Divergencias detectadas</p>
          <ul className="space-y-1">
            {datos.motivos.map((m) => (
              <li key={m} className="text-xs text-red-200/90 flex items-start gap-1.5">
                <span className="text-red-400 mt-0.5">•</span>
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mp && mp.ultimos_webhooks.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-400 mb-2">Últimos webhooks</p>
          <ul className="space-y-1">
            {mp.ultimos_webhooks.slice(0, 5).map((w, i) => (
              <li key={`${w.tipo}-${i}`} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-slate-300">{w.tipo}</span>
                <span className="text-slate-500">{fmtFecha(w.fecha)}</span>
                {w.firma_valida !== null && (
                  <Chip tono={w.firma_valida ? 'emerald' : 'red'}>
                    {w.firma_valida ? 'firma válida' : 'firma inválida'}
                  </Chip>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Pegar id de transacción…"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white px-3 py-1.5 font-mono"
        />
        <Button
          size="sm"
          disabled={!id.trim()}
          onClick={() => onInspeccionar?.(id.trim())}
        >
          <Copy className="w-3.5 h-3.5 mr-1" />
          Ver espejo
        </Button>
      </div>
    </Card>
  );
}
