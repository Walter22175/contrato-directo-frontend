'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Chip, Semaforo } from './Semaforo';
import { BannerAccion, DialogoAccion, useAccionAdmin } from './AccionAdmin';
import {
  CAMPOS_CORREGIBLES,
  corregirEstadoPago,
  descargarTrazaJson,
  fmtArs,
  fmtFecha,
  forzarCancelacionPago,
  forzarCapturaPago,
  reintentarWebhookMp,
  regenerarTimelineTransaccion,
} from '@/lib/control-total';
import type { CampoCorreccion, EventoControl, InspectorTransaccion } from '@/lib/control-total';
import { Ban, FileJson, Play, RefreshCw, RotateCcw, Search } from 'lucide-react';

function ListaEventos({
  eventos,
  vacio,
  onReintentar,
}: {
  eventos: EventoControl[];
  vacio: string;
  onReintentar?: (ev: EventoControl) => void;
}) {
  if (eventos.length === 0) {
    return <p className="text-xs text-slate-500">{vacio}</p>;
  }
  return (
    <ul className="space-y-1">
      {eventos.map((ev) => (
        <li
          key={ev.id}
          className="flex flex-wrap items-center gap-2 text-xs bg-slate-900/40 rounded-lg px-3 py-2"
        >
          <span className="font-mono text-slate-500">{fmtFecha(ev.fecha)}</span>
          <span className="font-mono text-slate-200">{ev.tipo}</span>
          <Chip tono={ev.severidad === 'error' ? 'red' : 'slate'}>{ev.origen}</Chip>
          {ev.titulo && <span className="text-slate-400 truncate">{ev.titulo}</span>}
          {onReintentar && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              title="Reencolar el payload original de este webhook"
              onClick={() => onReintentar(ev)}
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function InspectorTransaccionSeccion({
  datos,
  onBuscar,
  buscando,
  refrescar,
}: {
  datos: InspectorTransaccion | null;
  onBuscar: (id: string) => void;
  buscando: boolean;
  refrescar?: () => Promise<void> | void;
}) {
  const [id, setId] = useState('');
  const [campoCorreccion, setCampoCorreccion] = useState<CampoCorreccion>('entrega_proveedor_at');
  const [valorCorreccion, setValorCorreccion] = useState('');
  const acc = useAccionAdmin();

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

  const pago = (datos.pago ?? {}) as Record<string, unknown>;
  const idPago = typeof pago.id_pago === 'string' ? pago.id_pago : null;
  const mpStatus = typeof pago.mp_status === 'string' ? pago.mp_status : null;
  const capturado = pago.captured_at != null;
  const cancelado = pago.cancelled_at != null;
  const reembolsado = typeof pago.estado === 'string' && pago.estado === 'REEMBOLSADO';
  const capturable =
    !!idPago && !capturado && !cancelado && !!mpStatus && ['authorized', 'in_process', 'pending'].includes(mpStatus);
  const cancelable =
    !!idPago && !capturado && !cancelado && !reembolsado && !!mpStatus && !['cancelled', 'refunded', 'captured'].includes(mpStatus);

  const metaCampo = CAMPOS_CORREGIBLES.find((c) => c.valor === campoCorreccion);

  const corregir = () =>
    acc.pedir({
      titulo: 'Corrección aditiva de estado',
      mensaje: `Se seteará «${campoCorreccion}»${
        valorCorreccion ? ` = ${valorCorreccion}` : ' con la fecha actual'
      } en el pago ${idPago} SOLO si el campo está vacío${
        metaCampo?.requiereMp ? ` y Mercado Pago confirma estado ${metaCampo.requiereMp}` : ''
      }. No se modifica EstadoPagoEnum.`,
      variant: metaCampo?.requiereMp ? 'danger' : 'primary',
      confirmLabel: 'Sí, corregir',
      ejecutar: async () => {
        const r = await corregirEstadoPago(idPago as string, {
          campo: campoCorreccion,
          ...(valorCorreccion ? { valor: valorCorreccion } : {}),
        });
        acc.ok(`Corrección aplicada: ${r.campo} → ${r.valor} (${r.entidad}).`);
        setValorCorreccion('');
        await refrescar?.();
      },
    });

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="font-medium text-white text-sm">Inspector de trazabilidad</h3>
          <span className="font-mono text-xs text-cyan-300">{datos.id_transaccion}</span>
          {datos.espejo && <Semaforo valor={datos.espejo.semaforo} className="ml-auto" />}
        </div>

        <BannerAccion msg={acc.msg} onCerrar={acc.cerrarMsg} />

        {/* Acciones administrativas */}
        <div className="mb-4 border border-slate-700 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-300 mb-3">
            Acciones administrativas (SUPER_ADMIN)
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                acc.pedir({
                  titulo: 'Regenerar timeline',
                  mensaje: `Se reconstruirá el timeline de ${datos.id_transaccion} desde control_evento y se recalcularán las correlaciones MP↔BD.`,
                  ejecutar: async () => {
                    const r = await regenerarTimelineTransaccion(datos.id_transaccion);
                    acc.ok(
                      `Timeline regenerado: ${r.timeline.length} eventos · semáforo ${r.semaforo ?? 'sin cambio'}.`,
                    );
                    await refrescar?.();
                  },
                })
              }
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Regenerar timeline
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                descargarTrazaJson(datos.id_transaccion)
                  .then(() => acc.ok(`Traza de ${datos.id_transaccion} descargada.`))
                  .catch((e: unknown) => acc.err(`No se pudo exportar la traza: ${String(e)}`));
              }}
            >
              <FileJson className="w-3 h-3 mr-1" />
              Exportar traza JSON
            </Button>
            {capturable && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  acc.pedir({
                    titulo: 'Forzar captura en MP',
                    mensaje: `Se marcará la solicitud de captura del pago ${idPago} y se encolará el job de captura. Mercado Pago debe tener el pago en estado capturable (authorized).`,
                    ejecutar: async () => {
                      const r = await forzarCapturaPago(idPago as string);
                      acc.ok(
                        `Captura encolada (modo ${r.job.modo}, ${r.job.accion}, job ${r.job.jobId}).`,
                      );
                      await refrescar?.();
                    },
                  })
                }
              >
                <Play className="w-3 h-3 mr-1" />
                Forzar captura MP
              </Button>
            )}
            {cancelable && (
              <Button
                size="sm"
                variant="danger"
                onClick={() =>
                  acc.pedir({
                    titulo: 'Forzar cancelación en MP',
                    mensaje: `Se marcará la cancelación del pago ${idPago} y se encolará el job de cancelación. Si MP lo permite, el pago quedará cancelled.`,
                    variant: 'danger',
                    confirmLabel: 'Sí, cancelar',
                    ejecutar: async () => {
                      const r = await forzarCancelacionPago(idPago as string);
                      acc.ok(
                        `Cancelación encolada (modo ${r.job.modo}, ${r.job.accion}, job ${r.job.jobId}).`,
                      );
                      await refrescar?.();
                    },
                  })
                }
              >
                <Ban className="w-3 h-3 mr-1" />
                Forzar cancelación MP
              </Button>
            )}
            {idPago && (
              <details className="w-full mt-1">
                <summary className="text-[11px] text-cyan-400 cursor-pointer">
                  Corrección aditiva de estado (setear solo campos vacíos)
                </summary>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1" htmlFor="corr-campo">
                      Campo
                    </label>
                    <select
                      id="corr-campo"
                      value={campoCorreccion}
                      onChange={(e) => setCampoCorreccion(e.target.value as CampoCorreccion)}
                      className="bg-slate-800 border border-slate-700 rounded-lg text-xs text-white px-2 py-1.5 font-mono"
                    >
                      {CAMPOS_CORREGIBLES.map((c) => (
                        <option key={c.valor} value={c.valor}>
                          {c.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className="block text-[10px] text-slate-500 mb-1" htmlFor="corr-valor">
                      Valor (vacío = ahora)
                    </label>
                    <input
                      id="corr-valor"
                      type="datetime-local"
                      value={valorCorreccion}
                      onChange={(e) => setValorCorreccion(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg text-xs text-white px-2 py-1.5"
                    />
                  </div>
                  <Button size="sm" disabled={acc.ejecutando} onClick={corregir}>
                    Aplicar
                  </Button>
                </div>
                {metaCampo?.requiereMp && (
                  <p className="mt-2 text-[10px] text-yellow-400">
                    Requiere que MP tenga el pago en {metaCampo.requiereMp}; si no, el backend
                    rechazará la corrección.
                  </p>
                )}
              </details>
            )}
            {!idPago && (
              <p className="text-[11px] text-slate-500">
                Sin pago asociado: no hay acciones MP disponibles para esta transacción.
              </p>
            )}
          </div>
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
              onReintentar={(ev) =>
                acc.pedir({
                  titulo: 'Reintentar webhook',
                  mensaje: `Se reencolará el payload original del webhook #${ev.id} (${ev.tipo}). En modo marketplace solo se reintentan webhooks con firma válida.`,
                  ejecutar: async () => {
                    const r = await reintentarWebhookMp(String(ev.id));
                    acc.ok(
                      `Webhook reintentado hacia MP ${r.id_pago_mercadopago} (modo ${r.job.modo}, ${r.job.accion}).`,
                    );
                    await refrescar?.();
                  },
                })
              }
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

      <DialogoAccion state={acc} />
    </div>
  );
}
