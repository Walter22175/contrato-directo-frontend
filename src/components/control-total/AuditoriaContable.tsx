'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { descargarCsv, fmtArs, fmtFecha } from '@/lib/control-total';
import type { AuditoriaContable } from '@/lib/control-total';
import { Download } from 'lucide-react';

type Frecuencia = 'dia' | 'semana' | 'mes';

const ETIQUETAS: Record<string, string> = {
  total_cobrado: 'Total cobrado',
  total_retenido: 'Total retenido (custodia)',
  total_liberado: 'Total liberado',
  total_anticipado: 'Total anticipado (30%)',
  total_devuelto: 'Total devuelto',
  total_comisiones: 'Total comisiones',
  total_application_fee_mp: 'Application fee MP',
  total_neto_proveedor: 'Neto proveedor',
  total_neto_plataforma: 'Neto plataforma',
};

export function AuditoriaContableSeccion({
  datos,
  frecuencia,
  onFrecuencia,
  onRango,
}: {
  datos: AuditoriaContable | null;
  frecuencia: Frecuencia;
  onFrecuencia: (f: Frecuencia) => void;
  onRango: (desde: string, hasta: string) => void;
}) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  if (!datos) return null;

  const maxCobrado = Math.max(1, ...datos.por_periodo.map((p) => p.cobrado));

  const exportar = () => {
    const filas: string[] = [
      'clave,valor',
      ...Object.entries(datos.totales).map(([k, v]) => `${k},${v}`),
      '',
      'periodo,cobrado,comision,liberado,cantidad',
      ...datos.por_periodo.map((p) =>
        [p.periodo, p.cobrado, p.comision, p.liberado, p.cantidad].join(','),
      ),
    ];
    descargarCsv('control-total-contabilidad', filas);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <h3 className="font-medium text-white text-sm">
            Auditoría contable · {fmtFecha(datos.desde)} → {fmtFecha(datos.hasta)}
          </h3>
          <div className="ml-auto flex items-center gap-1">
            {(['dia', 'semana', 'mes'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onFrecuencia(f)}
                className={`text-xs px-2 py-1 rounded ${
                  frecuencia === f ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
            <Button variant="ghost" size="sm" onClick={exportar}>
              <Download className="w-3.5 h-3.5 mr-1" />
              CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          {Object.entries(datos.totales).map(([clave, valor]) => (
            <div key={clave} className="bg-slate-900/40 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1">{ETIQUETAS[clave] ?? clave}</p>
              <p
                className={`text-sm font-bold ${
                  clave.startsWith('total_neto') || clave === 'total_liberado'
                    ? 'text-emerald-300'
                    : clave === 'total_comisiones' || clave === 'total_application_fee_mp'
                      ? 'text-cyan-300'
                      : clave === 'total_devuelto'
                        ? 'text-red-300'
                        : 'text-slate-100'
                }`}
              >
                {fmtArs(valor)}
              </p>
            </div>
          ))}
        </div>

        {datos.por_periodo.length === 0 ? (
          <p className="text-sm text-slate-500">Sin actividad en el rango.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {datos.por_periodo.map((p) => (
              <div key={p.periodo} className="bg-slate-900/40 rounded-lg px-3 py-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-mono">{p.periodo}</span>
                  <span className="text-slate-400">
                    cobrado {fmtArs(p.cobrado)} · liberado {fmtArs(p.liberado)}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-cyan-500/70"
                    style={{ width: `${(p.cobrado / maxCobrado) * 100}%` }}
                  />
                  <div
                    className="h-full bg-emerald-500/70"
                    style={{ width: `${(p.liberado / maxCobrado) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1" htmlFor="cont-desde">
              Contabilidad desde
            </label>
            <input
              id="cont-desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-white px-3 py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1" htmlFor="cont-hasta">
              hasta
            </label>
            <input
              id="cont-hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-white px-3 py-1.5"
            />
          </div>
          <Button
            size="sm"
            disabled={!desde || !hasta}
            onClick={() => onRango(`${desde}T00:00:00.000Z`, `${hasta}T23:59:59.999Z`)}
          >
            Aplicar rango
          </Button>
          <p className="text-[11px] text-slate-500 ml-auto">
            Cobrado = monto de pagos no rechazados · Liberado = monto_liberado acumulado
          </p>
        </div>
      </Card>
    </div>
  );
}
