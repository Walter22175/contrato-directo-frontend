'use client';

import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Chip, Semaforo } from './Semaforo';
import { descargarCsv, fmtArs, fmtFecha } from '@/lib/control-total';
import type { FilaRetencion, PanelRetencion } from '@/lib/control-total';
import { Download } from 'lucide-react';

const ESTADOS = [
  'EN_CUSTODIA',
  'APROBADO',
  'LIBERADO',
  'REEMBOLSADO',
  'RECHAZADO',
  'PENDIENTE',
] as const;

const COLOR_ESTADO: Record<string, string> = {
  EN_CUSTODIA: 'yellow',
  APROBADO: 'cyan',
  LIBERADO: 'emerald',
  REEMBOLSADO: 'orange',
  RECHAZADO: 'red',
  PENDIENTE: 'slate',
};

function FilaPago({
  p,
  onInspeccionar,
}: {
  p: FilaRetencion;
  onInspeccionar: (id: string) => void;
}) {
  return (
    <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
      <td className="py-2 pr-3 font-mono text-cyan-300">
        <button
          type="button"
          onClick={() => onInspeccionar(p.id_transaccion ?? p.id_pago)}
          className="hover:underline"
          title="Abrir en el inspector"
        >
          {(p.id_transaccion ?? p.id_pago).slice(0, 8)}…
        </button>
      </td>
      <td className="py-2 pr-3 text-slate-200">{fmtArs(p.monto)}</td>
      <td className="py-2 pr-3">
        <Chip tono={(COLOR_ESTADO[p.estado] ?? 'slate') as 'slate'}>{p.estado}</Chip>
      </td>
      <td className="py-2 pr-3 font-mono text-slate-400">{p.mp_status ?? '—'}</td>
      <td className="py-2 pr-3 text-emerald-300">{fmtArs(p.monto_liberado)}</td>
      <td className="py-2 pr-3 text-cyan-300">{fmtArs(p.monto_comision)}</td>
      <td className="py-2 pr-3 text-slate-400">{fmtFecha(p.fecha_pago)}</td>
      <td className="py-2 pr-3 text-slate-400">{fmtFecha(p.fecha_liberacion)}</td>
      <td className="py-2">
        <Semaforo
          valor={
            p.mp_status === 'captured' && p.estado === 'LIBERADO'
              ? 'verde'
              : p.estado === 'EN_CUSTODIA'
                ? 'amarillo'
                : p.estado === 'RECHAZADO' || p.estado === 'REEMBOLSADO'
                  ? 'gris'
                  : 'verde'
          }
          label=""
        />
      </td>
    </tr>
  );
}

export function PanelRetencionSeccion({
  datos,
  estadoFiltro,
  onEstado,
  onPagina,
  onInspeccionar,
}: {
  datos: PanelRetencion | null;
  estadoFiltro: string;
  onEstado: (estado: string) => void;
  onPagina: (page: number) => void;
  onInspeccionar: (id: string) => void;
}) {
  if (!datos) return null;

  const exportar = () => {
    const filas: string[] = [
      'id_pago,id_transaccion,monto,estado,mp_status,monto_liberado,monto_comision,fecha_pago,fecha_liberacion',
      ...datos.data.map((p) =>
        [
          p.id_pago,
          p.id_transaccion ?? '',
          p.monto,
          p.estado,
          p.mp_status ?? '',
          p.monto_liberado,
          p.monto_comision,
          p.fecha_pago ?? '',
          p.fecha_liberacion ?? '',
        ].join(','),
      ),
    ];
    descargarCsv('control-total-retencion', filas);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h3 className="font-medium text-white text-sm">Retención y liberación</h3>
        <select
          value={estadoFiltro}
          onChange={(e) => onEstado(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg text-xs text-white px-2 py-1.5"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <Button variant="ghost" size="sm" onClick={exportar} className="ml-auto">
          <Download className="w-3.5 h-3.5 mr-1" />
          CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(datos.contadores).map(([clave, valor]) => (
          <Chip key={clave} tono={valor > 0 ? 'cyan' : 'slate'}>
            {clave.replace(/_/g, ' ')}: {valor}
          </Chip>
        ))}
      </div>

      {datos.data.length === 0 ? (
        <p className="text-sm text-slate-500">Sin pagos para los filtros actuales.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="text-left py-2 pr-3">Transacción</th>
                <th className="text-left py-2 pr-3">Monto</th>
                <th className="text-left py-2 pr-3">Estado</th>
                <th className="text-left py-2 pr-3">mp_status</th>
                <th className="text-left py-2 pr-3">Liberado</th>
                <th className="text-left py-2 pr-3">Comisión</th>
                <th className="text-left py-2 pr-3">Pago</th>
                <th className="text-left py-2 pr-3">Liberación</th>
                <th className="text-left py-2">Sem.</th>
              </tr>
            </thead>
            <tbody>
              {datos.data.map((p) => (
                <FilaPago key={p.id_pago} p={p} onInspeccionar={onInspeccionar} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {datos.meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs">
          <span className="text-slate-500">
            Página {datos.meta.page} de {datos.meta.totalPages} · {datos.meta.total} pagos
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={datos.meta.page <= 1}
              onClick={() => onPagina(datos.meta.page - 1)}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={datos.meta.page >= datos.meta.totalPages}
              onClick={() => onPagina(datos.meta.page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
