'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import {
  obtenerEstadoMercadoPago,
  obtenerDashboardMercadoPago,
  iniciarConexionMercadoPago,
} from '@/lib/mercadopago';
import { mensajeError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Wallet,
  Link2Off,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Info,
  KeyRound,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import type {
  EstadoMercadoPagoProveedor,
  DashboardMercadoPagoProveedor,
  EstadoCronRetencionMp,
} from '@/types';

const formatoMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const etiquetasCron: Record<EstadoCronRetencionMp, string> = {
  a_la_espera_de_entrega: 'A la espera de tu entrega',
  en_plazo: 'En plazo',
  pendiente_de_captura: 'Plazo cumplido — captura próxima',
  captura_encolada: 'Captura en proceso',
  capturado: 'Capturado',
};

const coloresCron: Record<EstadoCronRetencionMp, string> = {
  a_la_espera_de_entrega: 'text-slate-400 bg-slate-500/10',
  en_plazo: 'text-cyan-400 bg-cyan-500/10',
  pendiente_de_captura: 'text-amber-400 bg-amber-500/10',
  captura_encolada: 'text-amber-400 bg-amber-500/10',
  capturado: 'text-green-400 bg-green-500/10',
};

type Semaforo = 'verde' | 'amarillo' | 'rojo' | 'gris';

const semaforoEstilos: Record<
  Semaforo,
  { punto: string; texto: string; chip: string; label: string }
> = {
  verde: {
    punto: 'bg-green-400',
    texto: 'text-green-400',
    chip: 'text-green-400 bg-green-500/10 border-green-500/20',
    label: 'Todo operativo',
  },
  amarillo: {
    punto: 'bg-amber-400',
    texto: 'text-amber-400',
    chip: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    label: 'Conectada — cobro directo pendiente',
  },
  rojo: {
    punto: 'bg-red-400',
    texto: 'text-red-400',
    chip: 'text-red-400 bg-red-500/10 border-red-500/20',
    label: 'Requiere atención',
  },
  gris: {
    punto: 'bg-slate-400',
    texto: 'text-slate-400',
    chip: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    label: 'No conectada',
  },
};

function calcularSemaforo(
  estado: EstadoMercadoPagoProveedor | null,
): Semaforo {
  if (!estado?.conectado) return 'gris';
  if (estado.token_valido === false) return 'rojo';
  if (!estado.marketplace_habilitado) return 'amarillo';
  return 'verde';
}

function formatoRestante(minutos: number | null): string {
  if (minutos === null) return '—';
  if (minutos <= 0) return 'vencido';
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas >= 24) {
    const dias = Math.floor(horas / 24);
    return `${dias} d ${horas % 24} h`;
  }
  if (horas > 0) return `${horas} h ${resto} min`;
  return `${resto} min`;
}

function formatoFecha(f: string | null): string {
  if (!f) return '—';
  return new Date(f).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

const contadores = [
  { clave: 'autorizados', label: 'Autorizados' },
  { clave: 'retenidos', label: 'Retenidos' },
  { clave: 'capturados', label: 'Capturados' },
  { clave: 'cancelados', label: 'Cancelados' },
  { clave: 'auto_capturas_programadas', label: 'Auto-capturas' },
] as const;

export default function MercadoPagoPage() {
  const user = useAuthStore((s) => s.user);
  const idProveedor = user?.id_usuario;

  const [estado, setEstado] = useState<EstadoMercadoPagoProveedor | null>(null);
  const [dashboard, setDashboard] =
    useState<DashboardMercadoPagoProveedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [conectando, setConectando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarTodo = useCallback(async () => {
    if (!idProveedor) return;
    setLoading(true);
    setError(null);
    try {
      const [estadoData, dashboardData] = await Promise.all([
        obtenerEstadoMercadoPago(idProveedor),
        obtenerDashboardMercadoPago(idProveedor).catch(() => null),
      ]);
      setEstado(estadoData);
      setDashboard(dashboardData);
    } catch (e) {
      setError(mensajeError(e, 'No se pudo cargar tu panel de Mercado Pago.'));
    } finally {
      setLoading(false);
    }
  }, [idProveedor]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const conectar = async () => {
    if (!idProveedor) return;
    setConectando(true);
    setError(null);
    try {
      const { url } = await iniciarConexionMercadoPago(idProveedor);
      window.location.href = url;
    } catch (e) {
      setError(
        mensajeError(
          e,
          'No se pudo iniciar la conexión. Verificá que el onboarding esté configurado e intentá nuevamente.',
        ),
      );
      setConectando(false);
    }
  };

  const semaforo = calcularSemaforo(estado);
  const est = semaforoEstilos[semaforo];
  const tokenInvalido = estado?.conectado && estado.token_valido === false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Wallet className="w-7 h-7 text-cyan-400" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Mercado Pago</h1>
          <p className="text-sm text-slate-400">
            Estado de tu conexión, cobros y retenciones
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${est.chip}`}
        >
          <span className={`w-2 h-2 rounded-full ${est.punto}`} />
          {est.label}
        </span>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed">
        Conectá tu cuenta para recibir los pagos de tus trabajos{' '}
        <strong className="text-white">directamente en tu Mercado Pago</strong>.
        La conexión es la autorización oficial de Mercado Pago: nunca vemos tu
        contraseña ni tu saldo, y podés revocarla cuando quieras.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-44 bg-slate-800/50 rounded-xl animate-pulse" />
          <div className="h-28 bg-slate-800/50 rounded-xl animate-pulse" />
          <div className="h-40 bg-slate-800/50 rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* E. Alertas */}
          {dashboard && dashboard.alertas.length > 0 && (
            <div className="space-y-2">
              {dashboard.alertas.map((alerta) => (
                <div
                  key={alerta.tipo}
                  className={`flex items-start gap-3 border rounded-lg px-4 py-3 text-sm ${
                    alerta.tipo === 'marketplace_deshabilitado'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{alerta.mensaje}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* A. Estado + B. Botón */}
            <Card>
              <div className="flex items-center gap-2">
                {semaforo === 'verde' ? (
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                ) : semaforo === 'rojo' ? (
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-slate-500" />
                )}
                <h2 className="font-semibold text-white">
                  Estado de Mercado Pago
                </h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    estado?.conectado
                      ? 'text-green-400 bg-green-500/10'
                      : 'text-slate-400 bg-slate-500/10'
                  }`}
                >
                  {estado?.conectado ? 'Conectada' : 'No conectada'}
                </span>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Usuario MP</dt>
                  <dd className="text-white">
                    {estado?.mp_user_id ? `#${estado.mp_user_id}` : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Permisos</dt>
                  <dd className="text-white text-right break-all">
                    {estado?.mp_scopes || '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Vencimiento del token</dt>
                  <dd className="text-white flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {formatoFecha(estado?.mp_token_expires_at || null)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Cobro directo</dt>
                  <dd
                    className={
                      estado?.marketplace_habilitado
                        ? 'text-green-400'
                        : 'text-slate-400'
                    }
                  >
                    {estado?.marketplace_habilitado
                      ? 'Habilitado'
                      : 'Pendiente de habilitar'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Token</dt>
                  <dd
                    className={
                      tokenInvalido ? 'text-red-400' : 'text-green-400'
                    }
                  >
                    {estado?.conectado
                      ? tokenInvalido
                        ? 'Con problemas'
                        : 'Operativo'
                      : '—'}
                  </dd>
                </div>
              </dl>

              {tokenInvalido && estado?.ultimo_error_token && (
                <p className="mt-3 text-xs text-red-400/90">
                  Último error: {estado.ultimo_error_token}
                </p>
              )}

              <div className="mt-4">
                {!estado?.conectado || tokenInvalido ? (
                  <Button onClick={conectar} disabled={conectando} className="w-full">
                    {conectando ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    {estado?.conectado
                      ? 'Reconectar con Mercado Pago'
                      : 'Conectar Mercado Pago'}
                  </Button>
                ) : (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Link2Off className="w-3.5 h-3.5" />
                    Conexión activa — el token se renueva solo cada 12 horas.
                  </p>
                )}
              </div>
            </Card>

            {/* C. Pagos en curso */}
            <Card>
              <h2 className="font-semibold text-white">Pagos en curso</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {contadores.map(({ clave, label }) => (
                  <div
                    key={clave}
                    className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5"
                  >
                    <p className="text-2xl font-bold text-white">
                      {dashboard?.pagos_en_curso[clave] ?? 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Los auto-capturados son pagos entregados cuya captura ya fue
                programada para las próximas 72 horas hábiles.
              </p>
            </Card>
          </div>

          {/* D. Retenciones y liberaciones */}
          <Card>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h2 className="font-semibold text-white">
                Retenciones y liberaciones
              </h2>
            </div>
            {!dashboard || dashboard.retenciones.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No tenés pagos retenidos ni liberaciones en proceso.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {dashboard.retenciones.map((r) => (
                  <div
                    key={r.id_pago}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 text-sm"
                  >
                    <span className="text-white font-semibold">
                      {formatoMoneda.format(r.monto)}
                    </span>
                    <span className="text-slate-400">
                      Entrega:{' '}
                      <span className="text-white">
                        {formatoFecha(r.entrega_proveedor_at)}
                      </span>
                    </span>
                    <span className="text-slate-400">
                      Tiempo hábil restante:{' '}
                      <span
                        className={
                          r.minutos_habiles_restantes === 0
                            ? 'text-amber-400'
                            : 'text-white'
                        }
                      >
                        {formatoRestante(r.minutos_habiles_restantes)}
                      </span>
                    </span>
                    {r.liberacion_estimada && (
                      <span className="text-slate-400">
                        Liberación estimada:{' '}
                        <span className="text-white">
                          {formatoFecha(r.liberacion_estimada)}
                        </span>
                      </span>
                    )}
                    <span
                      className={`ml-auto text-xs px-2 py-0.5 rounded ${coloresCron[r.estado_cron]}`}
                    >
                      {etiquetasCron[r.estado_cron]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Secciones informativas */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <h2 className="font-semibold text-white">
                  ¿Qué permisos estás otorgando?
                </h2>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300 list-disc list-inside">
                <li>
                  Identificación de tu cuenta de Mercado Pago
                  <span className="text-slate-500"> (usuario MP #</span>
                  {estado?.mp_user_id || 'n/d'}
                  <span className="text-slate-500">)</span> para saber a qué
                  cuenta acreditar.
                </li>
                <li>
                  Creación de preferencias de pago en tu nombre cuando un cliente
                  contrata tus servicios.
                </li>
                <li>
                  Captura y cancelación de esos pagos, según el flujo de
                  retención y liberación.
                </li>
                <li>
                  No accedemos a tu saldo, a tus movimientos ni a datos
                  personales fuera de la operación de pago.
                </li>
              </ul>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h2 className="font-semibold text-white">
                  ¿Por qué es necesario conectarla?
                </h2>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300 list-disc list-inside">
                <li>
                  Cuando el cliente paga con <strong>custodia</strong>, el dinero
                  queda retenido en Contrato Directo hasta que el trabajo se dé
                  por conforme.
                </li>
                <li>
                  Si el cliente no da conformidad en{' '}
                  <strong>72 horas hábiles</strong>, la conformidad es automática
                  y el pago se libera igual.
                </li>
                <li>
                  Si el cliente rechaza el trabajo, el pago se cancela o se
                  resuelve por mediación antes de liberarse.
                </li>
                <li>
                  Con la cuenta conectada, la liberación acredita directo en tu
                  cuenta (menos la comisión del 8%).
                </li>
              </ul>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                <h2 className="font-semibold text-white">
                  ¿Qué pasa si no conecto mi cuenta?
                </h2>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300 list-disc list-inside">
                <li>
                  No podés recibir los pagos directamente en tu cuenta de
                  Mercado Pago.
                </li>
                <li>
                  La plataforma sigue operando en modo tradicional, con los
                  mismos plazos de siempre.
                </li>
                <li>
                  El modo de cobro directo (marketplace) queda deshabilitado
                  hasta que conectes tu cuenta.
                </li>
              </ul>
            </Card>
          </div>

          <a
            href="/ayuda/retencion-liberacion"
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
          >
            Ver condiciones de retención, liberación y cancelación
            <ArrowRight className="w-4 h-4" />
          </a>
        </>
      )}
    </div>
  );
}
