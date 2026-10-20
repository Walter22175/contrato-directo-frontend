'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { descargarCsv, fmtArs, fmtFecha, fmtNum } from '@/lib/control-total';
import type { PanelComisiones } from '@/lib/control-total';
import { Download } from 'lucide-react';

type Frecuencia = 'dia' | 'semana' | 'mes';

export function PanelComisionesSeccion({
  datos,
  frecuencia,
  onFrecuencia,
  onRango,
}: {
  datos: PanelComisiones | null;
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
      'periodo,cobrado,comision,liberado,cantidad',
      ...datos.por_periodo.map((p) =>
        [p.periodo, p.cobrado, p.comision, p.liberado, p.cantidad].join(','),
      ),
      '',
      'clave,valor',
      ...Object.entries(datos.totales).map(([k, v]) => `${k},${v}`),
    ];
    descargarCsv('control-total-comisiones', filas);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <h3 className="font-medium text-white text-sm">Comisiones · {fmtFecha(datos.desde)} → {fmtFecha(datos.hasta)}</h3>
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

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
          {(
            [
              ['Application fee MP', datos.totales.application_fee_mp, 'text-cyan-300'],
              ['Comisión interna', datos.totales.comision_interna, 'text-cyan-300'],
              ['Neto proveedor', datos.totales.neto_proveedor, 'text-emerald-300'],
              ['Neto plataforma', datos.totales.neto_plataforma, 'text-emerald-300'],
              ['Anticipado (30%)', datos.totales.anticipado, 'text-yellow-300'],
              ['Descuentos finales', datos.totales.descuentos_finales, 'text-red-300'],
            ] as const
          ).map(([label, valor, color]) => (
            <div key={label} className="bg-slate-900/40 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1">{label}</p>
              <p className={`text-sm font-bold ${color}`}>{fmtArs(valor)}</p>
            </div>
          ))}
        </div>

        {datos.por_periodo.length === 0 ? (
          <p className="text-sm text-slate-500">Sin pagos en el rango seleccionado.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {datos.por_periodo.map((p) => (
              <div key={p.periodo} className="bg-slate-900/40 rounded-lg px-3 py-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-mono">{p.periodo}</span>
                  <span className="text-slate-400">
                    {fmtNum(p.cantidad)} pagos · comisión {fmtArs(p.comision)}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500/70 rounded-full"
                    style={{ width: `${(p.cobrado / maxCobrado) * 100}%` }}
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
            <label className="block text-xs text-slate-400 mb-1" htmlFor="com-desde">
              Comisiones desde
            </label>
            <input
              id="com-desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-white px-3 py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1" htmlFor="com-hasta">
              hasta
            </label>
            <input
              id="com-hasta"
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
        </div>
      </Card>
    </div>
  );
}
