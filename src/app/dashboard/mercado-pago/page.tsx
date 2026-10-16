'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import {
  obtenerEstadoMercadoPago,
  iniciarConexionMercadoPago,
} from '@/lib/mercadopago';
import { mensajeError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Wallet,
  Link2,
  Link2Off,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Info,
  Loader2,
} from 'lucide-react';
import type { EstadoMercadoPagoProveedor } from '@/types';

const estadoTokenColors: Record<string, string> = {
  valido: 'text-green-400 bg-green-500/10',
  invalido: 'text-red-400 bg-red-500/10',
  desconocido: 'text-slate-400 bg-slate-500/10',
};

export default function MercadoPagoPage() {
  const user = useAuthStore((s) => s.user);
  const idProveedor = user?.id_usuario;

  const [estado, setEstado] = useState<EstadoMercadoPagoProveedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [conectando, setConectando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarEstado = useCallback(async () => {
    if (!idProveedor) return;
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerEstadoMercadoPago(idProveedor);
      setEstado(data);
    } catch (e) {
      setError(mensajeError(e, 'No se pudo consultar el estado de la conexión.'));
    } finally {
      setLoading(false);
    }
  }, [idProveedor]);

  useEffect(() => {
    cargarEstado();
  }, [cargarEstado]);

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

  const estadoToken = estado?.conectado
    ? estado.token_valido === false
      ? 'invalido'
      : 'valido'
    : 'desconocido';

  const labelToken = {
    valido: 'Token operativo',
    invalido: 'Token con problemas',
    desconocido: 'Sin token',
  }[estadoToken];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="w-7 h-7 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Mercado Pago</h1>
          <p className="text-sm text-slate-400">
            Conectá tu cuenta de cobro para recibir los pagos directamente
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-40 bg-slate-800/50 rounded-xl animate-pulse" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-white">Cuenta conectada</h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      estado?.conectado
                        ? 'text-green-400 bg-green-500/10'
                        : 'text-slate-400 bg-slate-500/10'
                    }`}
                  >
                    {estado?.conectado ? 'Conectada' : 'No conectada'}
                  </span>
                  {estado?.marketplace_habilitado && (
                    <span className="text-xs px-2 py-0.5 rounded text-cyan-400 bg-cyan-500/10">
                      Cobro directo activo
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  {estado?.conectado
                    ? `Cuenta de Mercado Pago #${estado.mp_user_id || 'n/d'} vinculada a tu perfil.`
                    : 'Conectá tu cuenta para que los pagos de tus trabajos se acrediten en ella.'}
                </p>
                {estado?.mp_scopes && (
                  <p className="text-xs text-slate-500 mt-2">
                    Permisos: {estado.mp_scopes}
                  </p>
                )}
              </div>
              {estado?.conectado ? (
                <Link2Off className="w-5 h-5 text-slate-500 flex-shrink-0" />
              ) : (
                <Link2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              )}
            </div>
            <div className="mt-4">
              <Button onClick={conectar} disabled={conectando} className="w-full">
                {conectando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {estado?.conectado
                  ? 'Volver a conectar'
                  : 'Conectar con Mercado Pago'}
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                Te redirigimos a Mercado Pago para autorizar el acceso. No
                pedimos ni guardamos tu contraseña.
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              {estadoToken === 'valido' ? (
                <ShieldCheck className="w-5 h-5 text-green-400" />
              ) : estadoToken === 'invalido' ? (
                <ShieldAlert className="w-5 h-5 text-red-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-slate-500" />
              )}
              <h2 className="font-semibold text-white">Estado del token</h2>
              <span
                className={`text-xs px-2 py-0.5 rounded ${estadoTokenColors[estadoToken]}`}
              >
                {labelToken}
              </span>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Vencimiento del access token</dt>
                <dd className="text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {estado?.mp_token_expires_at
                    ? new Date(estado.mp_token_expires_at).toLocaleString(
                        'es-AR',
                        { dateStyle: 'short', timeStyle: 'short' },
                      )
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Renovación</dt>
                <dd className="text-white">Automática (cada 12 horas)</dd>
              </div>
            </dl>
            {estado?.token_valido === false && (
              <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400">
                Detectamos un problema con tu token. Los pagos usan temporalmente
                la cuenta de la plataforma y el equipo ya fue notificado. Si
                persiste, volvé a conectar tu cuenta.
                {estado.ultimo_error_token && (
                  <p className="mt-1 text-slate-400">
                    Último error: {estado.ultimo_error_token}
                  </p>
                )}
              </div>
            )}
          </Card>

          <Card className="md:col-span-2">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-cyan-400" />
              <h2 className="font-semibold text-white">
                Cómo funciona tu dinero: retención y liberación
              </h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-300 list-disc list-inside">
              <li>
                Cuando el cliente paga con <strong>custodia</strong>, el dinero
                queda retenido en Contrato Directo hasta que el trabajo se dé
                por conforme: tus fondos no corren riesgo si el servicio no se
                completó.
              </li>
              <li>
                Con tu cuenta conectada, la liberación acredita el pago{' '}
                <strong>directo en tu cuenta de Mercado Pago</strong> (menos la
                comisión del 8%), dentro de las 24 horas hábiles posteriores a
                la conformidad del cliente.
              </li>
              <li>
                Si el cliente no da conformidad en <strong>72 horas hábiles</strong>{' '}
                tras la finalización, la conformidad es automática y el pago se
                libera igual.
              </li>
              <li>
                Si hay una disputa, el monto disputado queda retenido hasta la
                resolución de mediación; el resto se libera normalmente.
              </li>
              <li>
                Los pagos de trabajos contratados antes de conectar tu cuenta se
                acreditan como hasta ahora, en la cuenta de la plataforma, con
                los mismos plazos.
              </li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
