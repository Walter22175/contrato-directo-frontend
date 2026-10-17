'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData, mensajeError } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { obtenerDashboardMercadoPago } from '@/lib/mercadopago';
import { useAuthStore } from '@/store/auth';
import {
  Handshake,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  ArrowRight,
  Percent,
  Wallet,
  CalendarClock,
} from 'lucide-react';
import type { Transaccion, DashboardMercadoPagoProveedor } from '@/types';

const HORAS_ANTICIPO = 72;
const PORCENTAJE_ANTICIPO = 0.3;
const COMISION = 0.08;

type EstadoInicio = 'pendiente' | 'mio' | 'cliente' | 'confirmado';

const estadoInicioConfig: Record<
  EstadoInicio,
  { label: string; chip: string; icono: typeof Clock }
> = {
  pendiente: {
    label: 'Pendiente de notificar',
    chip: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    icono: Clock,
  },
  mio: {
    label: 'Notificado por vos',
    chip: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
    icono: Handshake,
  },
  cliente: {
    label: 'Notificado por el cliente',
    chip: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    icono: Handshake,
  },
  confirmado: {
    label: 'Ambos confirmaron el inicio',
    chip: 'text-green-400 bg-green-400/10 border-green-400/30',
    icono: CheckCircle,
  },
};

const contadoresPagos = [
  { clave: 'autorizados', label: 'Autorizados' },
  { clave: 'retenidos', label: 'Retenidos' },
  { clave: 'capturados', label: 'Capturados' },
  { clave: 'cancelados', label: 'Cancelados' },
  { clave: 'auto_capturas_programadas', label: 'Auto-capturas' },
] as const;

function calcularEstadoInicio(t: Transaccion): EstadoInicio {
  if (t.fecha_inicio_servicio_at) return 'confirmado';
  if (t.fecha_inicio_servicio_proveedor) return 'mio';
  if (t.fecha_inicio_servicio_cliente) return 'cliente';
  return 'pendiente';
}

function liberacionEstimada(t: Transaccion): Date | null {
  if (!t.fecha_inicio_servicio_at) return null;
  return new Date(
    new Date(t.fecha_inicio_servicio_at).getTime() +
      HORAS_ANTICIPO * 60 * 60 * 1000,
  );
}

function duracionSuperaTresDias(t: Transaccion): boolean | null {
  if (!t.fecha_fin_estimada) return null;
  const base = t.fecha_inicio_servicio_at
    ? new Date(t.fecha_inicio_servicio_at)
    : new Date(t.fecha_creacion);
  return (
    new Date(t.fecha_fin_estimada).getTime() - base.getTime() >
    HORAS_ANTICIPO * 60 * 60 * 1000
  );
}

function estadoAnticipo(t: Transaccion): 'pendiente' | 'liberado' | 'no_aplica' {
  if (t.fecha_liberacion_anticipada_at) return 'liberado';
  if (duracionSuperaTresDias(t) === false) return 'no_aplica';
  return 'pendiente';
}

export default function InicioServicioPage() {
  const user = useAuthStore((s) => s.user);
  const idProveedor = user?.id_usuario;

  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [pagos, setPagos] = useState<DashboardMercadoPagoProveedor | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [notificando, setNotificando] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(
    null,
  );

  const cargar = useCallback(async () => {
    try {
      const [txRes, dash] = await Promise.all([
        api.get('/transacciones'),
        idProveedor
          ? obtenerDashboardMercadoPago(idProveedor).catch(() => null)
          : Promise.resolve(null),
      ]);
      const raw = extractData<Transaccion[] | { data: Transaccion[] } | null>(
        txRes,
      );
      const lista = Array.isArray(raw) ? raw : raw?.data || [];
      setTransacciones(lista.filter((t) => t.estado === 'en_custodia'));
      setPagos(dash);
    } catch {
      setTransacciones([]);
    } finally {
      setLoading(false);
    }
  }, [idProveedor]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const notificar = async (t: Transaccion) => {
    setNotificando(t.id_transaccion);
    setMsg(null);
    try {
      await api.post(`/transacciones/${t.id_transaccion}/inicio-servicio`);
      setMsg({
        tipo: 'ok',
        texto: 'Comienzo notificado. Cuando el cliente confirme, empieza el conteo de las 72 horas para el anticipo del 30%.',
      });
      await cargar();
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeError(e, 'No se pudo notificar el comienzo.') });
    } finally {
      setNotificando(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Handshake className="w-7 h-7 text-cyan-400" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">
            Inicio del servicio y anticipo del 30%
          </h1>
          <p className="text-sm text-slate-400">
            Notificá el comienzo de tus trabajos y seguí el estado del anticipo
          </p>
        </div>
        <Link
          href="/ayuda/comienzo-del-servicio"
          className="text-sm text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
        >
          Condiciones legales
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {msg && (
        <div
          className={`text-sm rounded-lg border px-4 py-3 ${
            msg.tipo === 'ok'
              ? 'text-green-400 bg-green-400/10 border-green-400/20'
              : 'text-red-400 bg-red-400/10 border-red-400/20'
          }`}
          role="status"
        >
          {msg.texto}
        </div>
      )}

      {loading ? (
        <div className="space-y-4" aria-label="Cargando">
          {[1, 2].map((i) => (
            <Card key={i}>
              <div className="p-6 space-y-3">
                <div className="h-5 w-64 bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-full bg-slate-800/70 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-slate-800/50 rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      ) : transacciones.length === 0 ? (
        <Card>
          <div className="p-10 text-center">
            <CalendarClock className="w-14 h-14 text-slate-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-1">
              No tenés servicios en curso
            </h2>
            <p className="text-sm text-slate-400">
              Cuando un cliente pague un trabajo, vas a poder notificar el
              comienzo y seguir el anticipo del 30% desde acá.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {transacciones.map((t) => {
            const estadoInicio = calcularEstadoInicio(t);
            const cfg = estadoInicioConfig[estadoInicio];
            const IconoEstado = cfg.icono;
            const estimada = liberacionEstimada(t);
            const anticipo = estadoAnticipo(t);
            const bruto = t.monto_acordado * PORCENTAJE_ANTICIPO;
            const comision = bruto * COMISION;
            const neto = bruto - comision;
            const yaNotifique = estadoInicio === 'mio' || estadoInicio === 'confirmado';
            const corto = duracionSuperaTresDias(t) === false;

            return (
              <Card key={t.id_transaccion}>
                <div className="p-6 space-y-5">
                  {/* Encabezado */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-white">
                        {t.servicio?.nombre || 'Servicio'}
                      </h2>
                      <p className="text-sm text-slate-400">
                        {t.descripcion ||
                          `Transacción #${t.id_transaccion.slice(0, 8)}`}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${cfg.chip}`}
                    >
                      <IconoEstado className="w-3.5 h-3.5" />
                      {cfg.label}
                    </span>
                  </div>

                  {/* A. Inicio del servicio */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2">
                      Inicio del servicio
                    </h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <div className="flex justify-between sm:justify-start sm:gap-2">
                        <dt className="text-slate-400">Fecha de inicio efectiva:</dt>
                        <dd className="text-white">
                          {t.fecha_inicio_servicio_at
                            ? formatDateTime(t.fecha_inicio_servicio_at)
                            : 'Todavía no se confirmó'}
                        </dd>
                      </div>
                      <div className="flex justify-between sm:justify-start sm:gap-2">
                        <dt className="text-slate-400">
                          Liberación estimada del 30%:
                        </dt>
                        <dd className="text-white">
                          {estimada
                            ? formatDateTime(estimada.toISOString())
                            : '—'}
                        </dd>
                      </div>
                    </dl>
                    {estadoInicio === 'confirmado' && estimada && anticipo !== 'liberado' && (
                      <p className="mt-2 text-sm text-cyan-300">
                        El 30% se liberará automáticamente en horario bancario
                        hábil.
                      </p>
                    )}
                  </div>

                  {/* B. Botón notificar */}
                  <div className="flex flex-wrap items-center gap-3">
                    {estadoInicio !== 'confirmado' && !yaNotifique && (
                      <Button
                        size="sm"
                        disabled={notificando === t.id_transaccion}
                        onClick={() => void notificar(t)}
                      >
                        {notificando === t.id_transaccion ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Handshake className="w-4 h-4 mr-1" />
                        )}
                        Notificar comienzo del servicio
                      </Button>
                    )}
                    {estadoInicio === 'mio' && (
                      <span className="text-xs text-slate-400">
                        Ya notificaste el comienzo — esperando la confirmación
                        del cliente.
                      </span>
                    )}
                  </div>

                  {/* C. Anticipo del 30% */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2">
                      Anticipo del 30%
                    </h3>
                    {anticipo === 'no_aplica' ? (
                      <p className="text-sm text-slate-400">
                        El servicio dura menos de 3 días: no corresponde anticipo.
                        El pago se libera al final, igual que siempre.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-3 max-w-md">
                        <div className="rounded-lg bg-slate-800/50 border border-slate-700/60 p-3 text-center">
                          <p className="text-xs text-slate-400">Bruto (30%)</p>
                          <p className="text-sm font-semibold text-white mt-0.5">
                            {formatCurrency(bruto)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-800/50 border border-slate-700/60 p-3 text-center">
                          <p className="text-xs text-slate-400">Comisión (8%)</p>
                          <p className="text-sm font-semibold text-red-400 mt-0.5">
                            −{formatCurrency(comision)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-800/50 border border-slate-700/60 p-3 text-center">
                          <p className="text-xs text-slate-400">Neto (27,6%)</p>
                          <p className="text-sm font-semibold text-green-400 mt-0.5">
                            {formatCurrency(neto)}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                          anticipo === 'liberado'
                            ? 'text-green-400 bg-green-400/10 border-green-400/30'
                            : anticipo === 'no_aplica'
                              ? 'text-slate-400 bg-slate-400/10 border-slate-400/30'
                              : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
                        }`}
                      >
                        {anticipo === 'liberado' && <CheckCircle className="w-3.5 h-3.5" />}
                        {anticipo === 'liberado'
                          ? `Anticipo liberado el ${formatDateTime(t.fecha_liberacion_anticipada_at!)}`
                          : anticipo === 'no_aplica'
                            ? 'No aplica a este servicio'
                            : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  {/* E. Alertas */}
                  <ul className="space-y-1.5">
                    {estadoInicio === 'mio' && (
                      <li className="flex items-start gap-2 text-sm text-yellow-300">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        Falta que el cliente confirme el inicio.
                      </li>
                    )}
                    {corto && (
                      <li className="flex items-start gap-2 text-sm text-slate-400">
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                        El servicio dura menos de 3 días: no hay anticipo.
                      </li>
                    )}
                    {anticipo === 'liberado' && (
                      <li className="flex items-start gap-2 text-sm text-green-300">
                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        El anticipo ya fue liberado.
                      </li>
                    )}
                    {estadoInicio === 'confirmado' &&
                      anticipo === 'pendiente' && (
                        <li className="flex items-start gap-2 text-sm text-cyan-300">
                          <Percent className="w-4 h-4 mt-0.5 shrink-0" />
                          El anticipo se liberará en horario bancario hábil.
                        </li>
                      )}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* D. Pagos en curso */}
      <Card>
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="font-semibold text-white">Pagos en curso</h2>
            <Link
              href="/dashboard/mercado-pago"
              className="text-sm text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
            >
              <Wallet className="w-4 h-4" />
              Ver detalle en Mercado Pago
            </Link>
          </div>
          {pagos ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {contadoresPagos.map(({ clave, label }) => (
                <div
                  key={clave}
                  className="rounded-lg bg-slate-800/50 border border-slate-700/60 p-3 text-center"
                >
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-lg font-bold text-white mt-0.5">
                    {pagos.pagos_en_curso[clave]}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No pudimos cargar los pagos en curso. Revisá tu conexión de
              Mercado Pago desde el{' '}
              <Link
                href="/dashboard/mercado-pago"
                className="text-cyan-400 hover:text-cyan-300"
              >
                panel
              </Link>
              .
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
