'use client';

import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Chip, Semaforo } from './Semaforo';
import { fmtFecha, fmtNum } from '@/lib/control-total';
import type {
  ContratoIntelligence,
  ControlTotalIntelligence,
  HealthStatus,
  RiskAlert,
  RiskPriority,
  UsuarioIntelligence,
} from '@/lib/control-total';
import {
  Activity,
  AlertTriangle,
  FileText,
  Mail,
  RefreshCw,
  ShieldAlert,
  UserRound,
} from 'lucide-react';

const TONO_PRIORIDAD: Record<RiskPriority, 'red' | 'orange' | 'yellow' | 'slate'> = {
  critical: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'slate',
};

const ORDEN_PRIORIDAD: RiskPriority[] = ['critical', 'high', 'medium', 'low'];

function fmtPct(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
  return `${valor.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;
}

function truncarHash(hash: string): string {
  return hash.length > 14 ? `${hash.slice(0, 14)}…` : hash;
}

function Tarjeta({
  label,
  valor,
  color,
  detalle,
}: {
  label: string;
  valor: string;
  color: string;
  detalle?: string;
}) {
  return (
    <div className="bg-slate-900/40 rounded-lg p-3">
      <p className="text-[10px] text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{valor}</p>
      {detalle && <p className="text-[10px] text-slate-500 mt-1">{detalle}</p>}
    </div>
  );
}

function colorSalud(estado: HealthStatus): string {
  if (estado === 'rojo') return 'text-red-400';
  if (estado === 'amarillo') return 'text-yellow-300';
  return 'text-emerald-300';
}

function ListaContratos({
  titulo,
  filas,
  metrica,
}: {
  titulo: string;
  filas: ContratoIntelligence[];
  metrica: (fila: ContratoIntelligence) => string;
}) {
  return (
    <div>
      <h4 className="text-xs font-medium text-slate-300 mb-2">{titulo}</h4>
      {filas.length === 0 ? (
        <p className="text-xs text-slate-500">Sin datos.</p>
      ) : (
        <ol className="space-y-1.5">
          {filas.slice(0, 5).map((fila, indice) => (
            <li
              key={fila.contratoId}
              className="flex items-center gap-2 text-xs text-slate-400"
            >
              <span className="w-4 text-slate-600">{indice + 1}</span>
              <span className="truncate font-mono text-slate-300">
                {fila.contratoId.slice(0, 8)}…
              </span>
              <span className="ml-auto text-slate-300">{metrica(fila)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ListaUsuarios({
  titulo,
  filas,
  metrica,
}: {
  titulo: string;
  filas: UsuarioIntelligence[];
  metrica: (fila: UsuarioIntelligence) => string;
}) {
  return (
    <div>
      <h4 className="text-xs font-medium text-slate-300 mb-2">{titulo}</h4>
      {filas.length === 0 ? (
        <p className="text-xs text-slate-500">Sin datos.</p>
      ) : (
        <ol className="space-y-1.5">
          {filas.slice(0, 5).map((fila, indice) => (
            <li
              key={fila.id_usuario}
              className="flex items-center gap-2 text-xs text-slate-400"
            >
              <span className="w-4 text-slate-600">{indice + 1}</span>
              <span className="truncate text-slate-300">{fila.email}</span>
              <span className="ml-auto text-slate-300">{metrica(fila)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Alertas({ alertas }: { alertas: RiskAlert[] }) {
  const conteo = ORDEN_PRIORIDAD.map((prioridad) => ({
    prioridad,
    cantidad: alertas.filter((alerta) => alerta.prioridad === prioridad).length,
  }));

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h3 className="font-medium text-white text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          Alertas de riesgo
        </h3>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {conteo.map(({ prioridad, cantidad }) => (
            <Chip key={prioridad} tono={TONO_PRIORIDAD[prioridad]}>
              {prioridad}: {cantidad}
            </Chip>
          ))}
        </div>
      </div>

      {alertas.length === 0 ? (
        <p className="text-sm text-slate-500">
          Sin riesgos activos: email, crons, colas, seguridad y vencimientos en
          rango.
        </p>
      ) : (
        <ul className="space-y-2">
          {alertas.map((alerta) => (
            <li
              key={alerta.id}
              className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Chip tono={TONO_PRIORIDAD[alerta.prioridad]}>
                  {alerta.prioridad}
                </Chip>
                <span className="text-xs font-mono text-slate-500">
                  {alerta.tipo}
                </span>
                <span className="text-sm text-slate-200">{alerta.titulo}</span>
                <span className="text-xs text-slate-500 ml-auto">
                  {fmtNum(alerta.valor)} / umbral {fmtNum(alerta.umbral)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{alerta.detalle}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function InteligenciaOperativaSeccion({
  datos,
  refrescar,
}: {
  datos: ControlTotalIntelligence;
  refrescar?: () => Promise<void> | void;
}) {
  const { health, email, contracts, users, security, alerts } = datos;
  const resumenEmail = email.resumen;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="font-medium text-white text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Salud del Sistema
          </h3>
          <Semaforo valor={health.estado} label={`Global: ${health.estado}`} />
          <span className="text-[11px] text-slate-500 ml-auto">
            {fmtFecha(health.generado_en)}
          </span>
          {refrescar && (
            <Button variant="ghost" size="sm" onClick={() => void refrescar()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Actualizar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <Tarjeta
            label="Bounce Rate"
            valor={fmtPct(health.metricas.bounce_rate)}
            color={colorSalud(health.checks[0]?.estado ?? 'verde')}
            detalle="últimas 24 h"
          />
          <Tarjeta
            label="Complaint Rate"
            valor={fmtPct(health.metricas.complaint_rate)}
            color={colorSalud(health.checks[1]?.estado ?? 'verde')}
            detalle="últimas 24 h"
          />
          <Tarjeta
            label="Jobs stuck"
            valor={fmtNum(health.metricas.jobs_stuck)}
            color={colorSalud(health.checks[2]?.estado ?? 'verde')}
            detalle={`${fmtNum(health.metricas.jobs_fallidos_24h)} fallidos 24 h`}
          />
          <Tarjeta
            label="Errores 24 h"
            valor={fmtNum(health.metricas.errores_24h)}
            color={colorSalud(health.checks[3]?.estado ?? 'verde')}
            detalle="control_evento"
          />
          <Tarjeta
            label="Crons detenidos"
            valor={fmtNum(health.metricas.crons_detenidos)}
            color={colorSalud(health.checks[4]?.estado ?? 'verde')}
            detalle={`${fmtNum(health.metricas.crons_con_fallos_24h)} fallos 24 h`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
          {health.checks.map((check) => (
            <div
              key={check.codigo}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2"
            >
              <Semaforo valor={check.estado} label={check.etiqueta} />
              <span className="text-[10px] text-slate-500 ml-auto">
                {check.detalle}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Alertas alertas={alerts} />

      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="font-medium text-white text-sm flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            Inteligencia de Email
          </h3>
          <Semaforo
            valor={resumenEmail.semaforo}
            label={`Email: ${resumenEmail.semaforo}`}
          />
          <Chip tono="slate">{email.rango}</Chip>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tarjeta
            label="Open Rate Global"
            valor={fmtPct(resumenEmail.tasa_apertura)}
            color={
              resumenEmail.tasa_apertura >= 20
                ? 'text-emerald-300'
                : 'text-yellow-300'
            }
            detalle={`${fmtNum(resumenEmail.aperturas)} aperturas`}
          />
          <Tarjeta
            label="CTR Global"
            valor={fmtPct(resumenEmail.ctr)}
            color={resumenEmail.ctr > 0 ? 'text-emerald-300' : 'text-slate-100'}
            detalle={`${fmtNum(resumenEmail.clicks)} clicks`}
          />
          <Tarjeta
            label="Bounce Rate"
            valor={fmtPct(resumenEmail.tasa_rebote)}
            color={
              resumenEmail.tasa_rebote <= 1
                ? 'text-emerald-300'
                : resumenEmail.tasa_rebote <= 5
                  ? 'text-yellow-300'
                  : 'text-red-400'
            }
            detalle={`${fmtNum(resumenEmail.rebotes)} rebotes`}
          />
          <Tarjeta
            label="Complaint Rate"
            valor={fmtPct(resumenEmail.tasa_queja)}
            color={
              resumenEmail.tasa_queja <= 0.1
                ? 'text-emerald-300'
                : 'text-red-400'
            }
            detalle={`${fmtNum(resumenEmail.quejas)} quejas`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <h4 className="text-xs font-medium text-slate-300 mb-2">
              Top plantillas por CTR
            </h4>
            <ol className="space-y-1.5">
              {email.ranking.top_ctr.slice(0, 5).map((fila, indice) => (
                <li
                  key={fila.template}
                  className="flex items-center gap-2 text-xs text-slate-400"
                >
                  <span className="w-4 text-slate-600">{indice + 1}</span>
                  <span className="truncate text-slate-300">{fila.template}</span>
                  <span className="ml-auto text-emerald-300">{fmtPct(fila.ctr)}</span>
                </li>
              ))}
              {email.ranking.top_ctr.length === 0 && (
                <p className="text-xs text-slate-500">Sin datos.</p>
              )}
            </ol>
          </div>
          <div>
            <h4 className="text-xs font-medium text-slate-300 mb-2">
              Plantillas con más rebotes
            </h4>
            <ol className="space-y-1.5">
              {email.ranking.top_bounce.slice(0, 5).map((fila, indice) => (
                <li
                  key={fila.template}
                  className="flex items-center gap-2 text-xs text-slate-400"
                >
                  <span className="w-4 text-slate-600">{indice + 1}</span>
                  <span className="truncate text-slate-300">{fila.template}</span>
                  <span className="ml-auto text-red-400">
                    {fmtPct(fila.tasa_rebote)}
                  </span>
                </li>
              ))}
              {email.ranking.top_bounce.length === 0 && (
                <p className="text-xs text-slate-500">Sin datos.</p>
              )}
            </ol>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-medium text-white text-sm flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-cyan-400" />
          Inteligencia de Contratos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ListaContratos
            titulo="Más activos"
            filas={contracts.top_activos}
            metrica={(fila) => `score ${fila.actividadScore}`}
          />
          <ListaContratos
            titulo="Próximos a vencer"
            filas={contracts.proximos_a_vencer}
            metrica={(fila) => `${fila.dias_para_vencer ?? '—'} días`}
          />
          <ListaContratos
            titulo="Más mensajes"
            filas={contracts.top_mensajes}
            metrica={(fila) => `${fmtNum(fila.mensajes)} mensajes`}
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          {fmtNum(contracts.total)} contratos analizados. El score combina
          eventos, mensajes, versiones y modificaciones de los últimos 30 días.
        </p>
      </Card>

      <Card>
        <h3 className="font-medium text-white text-sm flex items-center gap-2 mb-3">
          <UserRound className="w-4 h-4 text-cyan-400" />
          Inteligencia de Usuarios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ListaUsuarios
            titulo="Más activos"
            filas={users.top_activos}
            metrica={(fila) => `score ${fila.actividadScore}`}
          />
          <ListaUsuarios
            titulo="Más contratos"
            filas={users.top_contratos}
            metrica={(fila) => fmtNum(fila.contratos)}
          />
          <ListaUsuarios
            titulo="Más mensajes"
            filas={users.top_mensajes}
            metrica={(fila) => fmtNum(fila.mensajes)}
          />
          <ListaUsuarios
            titulo="Más logins"
            filas={users.top_logins}
            metrica={(fila) => fmtNum(fila.logins)}
          />
        </div>
      </Card>

      <Card>
        <h3 className="font-medium text-white text-sm flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          Inteligencia de Seguridad
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tarjeta
            label="Intentos fallidos 24 h"
            valor={fmtNum(security.intentos_fallidos_24h)}
            color={
              security.intentos_fallidos_24h >= 20
                ? 'text-red-400'
                : security.intentos_fallidos_24h >= 5
                  ? 'text-yellow-300'
                  : 'text-emerald-300'
            }
          />
          <Tarjeta
            label="Intentos fallidos 7 d"
            valor={fmtNum(security.intentos_fallidos_7d)}
            color="text-slate-100"
          />
          <Tarjeta
            label="Alertas 24 h"
            valor={fmtNum(security.alertas_24h)}
            color={security.alertas_24h > 0 ? 'text-red-400' : 'text-emerald-300'}
          />
          <Tarjeta
            label="Alertas 7 d"
            valor={fmtNum(security.alertas_7d)}
            color={security.alertas_7d > 0 ? 'text-yellow-300' : 'text-emerald-300'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <h4 className="text-xs font-medium text-slate-300 mb-2">
              IPs sospechosas (hash)
            </h4>
            {security.ips_sospechosas.length === 0 ? (
              <p className="text-xs text-slate-500">Sin IPs sospechosas.</p>
            ) : (
              <ol className="space-y-1.5">
                {security.ips_sospechosas.slice(0, 5).map((fila, indice) => (
                  <li
                    key={fila.ip_hash}
                    className="flex items-center gap-2 text-xs text-slate-400"
                  >
                    <span className="w-4 text-slate-600">{indice + 1}</span>
                    <span className="font-mono text-slate-300">
                      {truncarHash(fila.ip_hash)}
                    </span>
                    <span className="ml-auto text-red-400">
                      {fmtNum(fila.intentos)} intentos
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div>
            <h4 className="text-xs font-medium text-slate-300 mb-2">
              Usuarios con más intentos fallidos (hash)
            </h4>
            {security.usuarios_intentos_fallidos.length === 0 ? (
              <p className="text-xs text-slate-500">Sin intentos fallidos.</p>
            ) : (
              <ol className="space-y-1.5">
                {security.usuarios_intentos_fallidos
                  .slice(0, 5)
                  .map((fila, indice) => (
                    <li
                      key={fila.email_hash}
                      className="flex items-center gap-2 text-xs text-slate-400"
                    >
                      <span className="w-4 text-slate-600">{indice + 1}</span>
                      <span className="font-mono text-slate-300">
                        {truncarHash(fila.email_hash)}
                      </span>
                      <span className="ml-auto text-yellow-300">
                        {fmtNum(fila.intentos)} intentos
                      </span>
                    </li>
                  ))}
              </ol>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
