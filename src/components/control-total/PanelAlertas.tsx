'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Chip } from './Semaforo';
import {
  descartarAlerta,
  fmtFecha,
  fmtNum,
  reconocerAlerta,
  resolverAlerta,
} from '@/lib/control-total';
import type {
  AlertSeverity,
  AlertStatus,
  SystemAlert,
  SystemAlertType,
  SystemAlertsResponse,
} from '@/lib/control-total';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

const SEVERIDAD_META: Record<
  AlertSeverity,
  { emoji: string; label: string; tono: 'red' | 'orange' | 'yellow' | 'slate' | 'cyan' }
> = {
  CRITICAL: { emoji: '🔴', label: 'Critical', tono: 'red' },
  HIGH: { emoji: '🟠', label: 'High', tono: 'orange' },
  MEDIUM: { emoji: '🟡', label: 'Medium', tono: 'yellow' },
  LOW: { emoji: '🔵', label: 'Low', tono: 'slate' },
  INFO: { emoji: '⚪', label: 'Info', tono: 'cyan' },
};

const ESTADO_META: Record<
  AlertStatus,
  { label: string; tono: 'red' | 'yellow' | 'emerald' | 'slate' }
> = {
  OPEN: { label: 'Abierta', tono: 'red' },
  ACKNOWLEDGED: { label: 'Reconocida', tono: 'yellow' },
  RESOLVED: { label: 'Resuelta', tono: 'emerald' },
  DISMISSED: { label: 'Descartada', tono: 'slate' },
};

const TIPO_ETIQUETA: Record<SystemAlertType, string> = {
  EMAIL_BOUNCE_RATE_HIGH: 'Tasa de rebote alta',
  EMAIL_COMPLAINT_RATE_HIGH: 'Tasa de quejas crítica',
  EMAIL_DELIVERY_DEGRADED: 'Entregabilidad degradada',
  EMAIL_LOW_ENGAGEMENT: 'Engagement bajo',
  QUEUE_STUCK: 'Jobs atascados',
  QUEUE_FAILURE_SPIKE: 'Pico de fallos en colas',
  CRON_INACTIVE: 'Cron inactivo',
  SECURITY_SPIKE: 'Pico de seguridad',
  CONTRACT_EXPIRING_SPIKE: 'Contratos por vencer',
  PAYMENT_INCONSISTENCY: 'Inconsistencia de pago',
};

function Tarjeta({
  label,
  valor,
  color,
}: {
  label: string;
  valor: number;
  color: string;
}) {
  return (
    <div className="bg-slate-900/40 rounded-lg p-3">
      <p className="text-[10px] text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{fmtNum(valor)}</p>
    </div>
  );
}

function SeveridadBadge({ severidad }: { severidad: AlertSeverity }) {
  const meta = SEVERIDAD_META[severidad];
  return (
    <Chip tono={meta.tono}>
      <span aria-hidden="true">{meta.emoji}</span>
      {meta.label}
    </Chip>
  );
}

function EstadoBadge({ estado }: { estado: AlertStatus }) {
  const meta = ESTADO_META[estado];
  return <Chip tono={meta.tono}>{meta.label}</Chip>;
}

export function PanelAlertasSeccion({
  datos,
  refrescar,
}: {
  datos: SystemAlertsResponse;
  refrescar?: () => Promise<void> | void;
}) {
  const [accionando, setAccionando] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const alertas: SystemAlert[] = [
    ...datos.critical,
    ...datos.high,
    ...datos.medium,
    ...datos.low,
    ...datos.info,
  ];

  const ejecutar = async (
    accion: 'reconocer' | 'resolver' | 'descartar',
    alerta: SystemAlert,
  ) => {
    const clave = `${accion}:${alerta.id}`;
    setAccionando(clave);
    setErrorAccion(null);

    try {
      if (accion === 'reconocer') await reconocerAlerta(alerta.id);
      if (accion === 'resolver') await resolverAlerta(alerta.id);
      if (accion === 'descartar') await descartarAlerta(alerta.id);
      await refrescar?.();
    } catch (error) {
      setErrorAccion(
        error instanceof Error ? error.message : 'No se pudo ejecutar la acción',
      );
    } finally {
      setAccionando(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="font-medium text-white text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            Alert Center
          </h3>
          <Chip tono="slate">{fmtNum(alertas.length)} detectadas</Chip>
          {refrescar && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => void refrescar()}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Actualizar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tarjeta
            label="Abiertas"
            valor={datos.stats.open}
            color={datos.stats.open > 0 ? 'text-red-400' : 'text-emerald-300'}
          />
          <Tarjeta
            label="Reconocidas"
            valor={datos.stats.acknowledged}
            color={datos.stats.acknowledged > 0 ? 'text-yellow-300' : 'text-slate-100'}
          />
          <Tarjeta
            label="Resueltas"
            valor={datos.stats.resolved}
            color="text-emerald-300"
          />
          <Tarjeta
            label="Críticas"
            valor={datos.critical.length}
            color={datos.critical.length > 0 ? 'text-red-400' : 'text-emerald-300'}
          />
        </div>

        {errorAccion && (
          <p className="mt-3 text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {errorAccion}
          </p>
        )}
      </Card>

      <Card>
        <h3 className="font-medium text-white text-sm flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Alertas operativas
        </h3>

        {alertas.length === 0 ? (
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            No hay alertas registradas. El motor evalúa email, colas, crons,
            seguridad, contratos y pagos cada 15 minutos.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3 font-medium">Severidad</th>
                  <th className="py-2 pr-3 font-medium">Tipo</th>
                  <th className="py-2 pr-3 font-medium">Título</th>
                  <th className="py-2 pr-3 font-medium">Origen</th>
                  <th className="py-2 pr-3 font-medium">Detectada</th>
                  <th className="py-2 pr-3 font-medium">Estado</th>
                  <th className="py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {alertas.map((alerta) => {
                  const activa =
                    alerta.status === 'OPEN' || alerta.status === 'ACKNOWLEDGED';
                  const ocupada = accionando?.endsWith(`:${alerta.id}`) ?? false;

                  return (
                    <tr
                      key={alerta.id}
                      className="border-b border-slate-800/60 align-top"
                    >
                      <td className="py-2.5 pr-3">
                        <SeveridadBadge severidad={alerta.severity} />
                      </td>
                      <td
                        className="py-2.5 pr-3 text-slate-400"
                        title={alerta.type}
                      >
                        {TIPO_ETIQUETA[alerta.type] ?? alerta.type}
                      </td>
                      <td className="py-2.5 pr-3 max-w-[22rem]">
                        <p className="text-slate-200">{alerta.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {alerta.description}
                        </p>
                      </td>
                      <td
                        className="py-2.5 pr-3 font-mono text-[10px] text-slate-500 max-w-[10rem] truncate"
                        title={alerta.source}
                      >
                        {alerta.source}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-400 whitespace-nowrap">
                        {fmtFecha(alerta.last_detected_at)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <EstadoBadge estado={alerta.status} />
                      </td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap justify-end gap-1">
                          {alerta.status === 'OPEN' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="!px-2 !py-1 !text-[11px]"
                              disabled={ocupada}
                              onClick={() => void ejecutar('reconocer', alerta)}
                            >
                              Reconocer
                            </Button>
                          )}
                          {activa && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="!px-2 !py-1 !text-[11px] !text-emerald-300"
                              disabled={ocupada}
                              onClick={() => void ejecutar('resolver', alerta)}
                            >
                              Resolver
                            </Button>
                          )}
                          {activa && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="!px-2 !py-1 !text-[11px] !text-slate-400"
                              disabled={ocupada}
                              onClick={() => void ejecutar('descartar', alerta)}
                            >
                              <XCircle className="w-3 h-3" />
                              Descartar
                            </Button>
                          )}
                        </div>
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
