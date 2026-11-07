'use client';

import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Chip, Semaforo } from './Semaforo';
import { fmtFecha, fmtNum } from '@/lib/control-total';
import type {
  EmailEventType,
  EventosEmail,
  MetricasPlantillasEmail,
  ResumenEmail,
} from '@/lib/control-total';
import { Mail, RefreshCw } from 'lucide-react';

const ETIQUETAS_EVENTO: Record<
  EmailEventType,
  { label: string; tono: 'slate' | 'cyan' | 'emerald' | 'yellow' | 'red' | 'orange' }
> = {
  send: { label: 'Enviado', tono: 'cyan' },
  delivery: { label: 'Entregado', tono: 'emerald' },
  bounce: { label: 'Rebote', tono: 'red' },
  complaint: { label: 'Queja', tono: 'red' },
  reject: { label: 'Rechazado', tono: 'orange' },
  open: { label: 'Apertura', tono: 'slate' },
  click: { label: 'Click', tono: 'slate' },
};

function colorTasa(valor: number, limite: number): string {
  return valor > limite ? 'text-red-400' : 'text-emerald-300';
}

export function PanelEmailSeccion({
  datos,
  eventos,
  plantillas,
  refrescar,
}: {
  datos: ResumenEmail | null;
  eventos: EventosEmail | null;
  plantillas: MetricasPlantillasEmail | null;
  refrescar?: () => Promise<void> | void;
}) {
  if (!datos) return null;

  const sinDatos = datos.enviados === 0;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="font-medium text-white text-sm flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            Entregabilidad SES
          </h3>
          <Semaforo valor={datos.semaforo} label={`Email: ${datos.semaforo}`} />
          <Chip tono="slate">{fmtNum(datos.total_eventos)} eventos</Chip>
          {refrescar && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => void refrescar()}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Actualizar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(
            [
              ['Enviados', datos.enviados, 'text-slate-100'],
              ['Entregados', datos.entregados, 'text-emerald-300'],
              ['Rebotes', datos.rebotes, datos.rebotes > 0 ? 'text-red-400' : 'text-emerald-300'],
              ['Quejas', datos.quejas, datos.quejas > 0 ? 'text-red-400' : 'text-emerald-300'],
              ['Rechazados', datos.rechazados, datos.rechazados > 0 ? 'text-orange-300' : 'text-emerald-300'],
              [
                'Entregabilidad',
                `${datos.tasa_entrega.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`,
                colorTasa(100 - datos.tasa_entrega, 5),
              ],
            ] as const
          ).map(([label, valor, color]) => (
            <div key={label} className="bg-slate-900/40 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>
                {typeof valor === 'number' ? fmtNum(valor) : valor}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 mt-4">
          Semáforo: verde con rebotes &lt; 1% y quejas &lt; 0.1%; amarillo con
          rebotes entre 1% y 5%; rojo con rebotes &gt; 5% o quejas &gt; 0.1%.
        </p>

        {sinDatos && (
          <p className="text-xs text-slate-500 mt-3">
            Aún no hay envíos registrados. Verificá que el Configuration Set
            <span className="font-mono"> ContratoDirectoProd </span>
            tenga un event destination de EventBridge y que el Lambda envíe los
            eventos a <span className="font-mono">POST /api/v1/admin/email/events</span>.
          </p>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="font-medium text-white text-sm">Métricas por plantilla / evento</h3>
          <Chip tono="slate">{plantillas?.templates.length ?? 0}</Chip>
        </div>

        {!plantillas || plantillas.templates.length === 0 ? (
          <p className="text-sm text-slate-500">
            Sin datos por plantilla todavía.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="text-left py-2 pr-3">Plantilla</th>
                  <th className="text-right py-2 pr-3">Enviados</th>
                  <th className="text-right py-2 pr-3">Entregados</th>
                  <th className="text-right py-2 pr-3">Rebotes</th>
                  <th className="text-right py-2 pr-3">Quejas</th>
                  <th className="text-right py-2 pr-3">Rechazados</th>
                  <th className="text-right py-2 pr-3">Entrega</th>
                  <th className="text-right py-2">Rebote</th>
                </tr>
              </thead>
              <tbody>
                {plantillas.templates.map((fila) => (
                  <tr
                    key={fila.template}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30"
                  >
                    <td className="py-2 pr-3 font-mono text-slate-300">
                      {fila.template}
                    </td>
                    <td className="py-2 pr-3 text-right text-slate-200">
                      {fmtNum(fila.enviados)}
                    </td>
                    <td className="py-2 pr-3 text-right text-emerald-300">
                      {fmtNum(fila.entregados)}
                    </td>
                    <td className="py-2 pr-3 text-right text-red-300">
                      {fmtNum(fila.rebotes)}
                    </td>
                    <td className="py-2 pr-3 text-right text-red-300">
                      {fmtNum(fila.quejas)}
                    </td>
                    <td className="py-2 pr-3 text-right text-orange-300">
                      {fmtNum(fila.rechazados)}
                    </td>
                    <td className="py-2 pr-3 text-right text-cyan-300">
                      {fila.tasa_entrega.toLocaleString('es-AR', {
                        maximumFractionDigits: 2,
                      })}
                      %
                    </td>
                    <td className="py-2 text-right text-red-300">
                      {fila.tasa_rebote.toLocaleString('es-AR', {
                        maximumFractionDigits: 2,
                      })}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="font-medium text-white text-sm">Últimos eventos</h3>
          <Chip tono="slate">{eventos?.meta.total ?? 0}</Chip>
        </div>

        {!eventos || eventos.data.length === 0 ? (
          <p className="text-sm text-slate-500">
            Sin eventos de email registrados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="text-left py-2 pr-3">Fecha</th>
                  <th className="text-left py-2 pr-3">Evento</th>
                  <th className="text-left py-2 pr-3">Destinatario</th>
                  <th className="text-left py-2 pr-3">Plantilla</th>
                  <th className="text-left py-2 pr-3">Proveedor</th>
                  <th className="text-left py-2">Message ID</th>
                </tr>
              </thead>
              <tbody>
                {eventos.data.map((evento) => {
                  const etiqueta =
                    ETIQUETAS_EVENTO[evento.event_type] ?? {
                      label: evento.event_type,
                      tono: 'slate' as const,
                    };

                  return (
                    <tr
                      key={evento.id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/30"
                    >
                      <td className="py-2 pr-3 text-slate-300 whitespace-nowrap">
                        {fmtFecha(evento.created_at)}
                      </td>
                      <td className="py-2 pr-3">
                        <Chip tono={etiqueta.tono}>{etiqueta.label}</Chip>
                      </td>
                      <td className="py-2 pr-3 text-slate-300">
                        {evento.recipient_email}
                      </td>
                      <td className="py-2 pr-3 font-mono text-slate-400">
                        {evento.template ?? '—'}
                      </td>
                      <td className="py-2 pr-3 uppercase text-slate-500">
                        {evento.provider}
                      </td>
                      <td className="py-2 font-mono text-slate-500 max-w-[14rem] truncate">
                        {evento.message_id ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
