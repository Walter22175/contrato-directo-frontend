'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import {
  intercambiarCodigoMercadoPago,
  obtenerEstadoMercadoPago,
} from '@/lib/mercadopago';
import { mensajeError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { EstadoMercadoPagoProveedor } from '@/types';

type Estado = 'procesando' | 'ok' | 'error';

export default function MercadoPagoCallbackContent() {
  const searchParams = useSearchParams();
  const idUsuario = useAuthStore((s) => s.user?.id_usuario);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const [estado, setEstado] = useState<Estado>('procesando');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [datos, setDatos] = useState<EstadoMercadoPagoProveedor | null>(null);

  useEffect(() => {
    const intercambiar = async () => {
      if (!code || !state) {
        setEstado('error');
        setMensaje(
          'La autorización llegó incompleta. Volvé a intentar desde tu panel de Mercado Pago.',
        );
        return;
      }

      try {
        await intercambiarCodigoMercadoPago(code, state);
        if (idUsuario) {
          try {
            setDatos(await obtenerEstadoMercadoPago(idUsuario));
          } catch {
            setDatos(null);
          }
        }
        setEstado('ok');
      } catch (e) {
        setEstado('error');
        setMensaje(
          mensajeError(
            e,
            'Mercado Pago rechazó la autorización. Iniciá la conexión nuevamente.',
          ),
        );
      }
    };

    intercambiar();
  }, [code, state, idUsuario]);

  return (
    <div className="max-w-lg mx-auto mt-12">
      <Card>
        <div className="text-center py-6">
          {estado === 'procesando' && (
            <>
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white">
                Conectando tu cuenta…
              </h1>
              <p className="text-sm text-slate-400 mt-2">
                Estamos validando la autorización con Mercado Pago.
              </p>
            </>
          )}

          {estado === 'ok' && (
            <>
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white">
                Tu cuenta fue conectada correctamente.
              </h1>
              <p className="text-sm text-slate-400 mt-2">
                Los pagos de tus trabajos se acreditarán en tu cuenta según la
                política de retención y liberación.
              </p>
              <dl className="mt-4 space-y-2 text-left bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Usuario MP</dt>
                  <dd className="text-white">
                    {datos?.mp_user_id ? `#${datos.mp_user_id}` : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Permisos</dt>
                  <dd className="text-white text-right break-all">
                    {datos?.mp_scopes || '—'}
                  </dd>
                </div>
              </dl>
              {datos && !datos.marketplace_habilitado && (
                <div className="mt-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-cyan-300 text-left">
                  La vinculación quedó lista. Para que los pagos se acrediten
                  directamente en tu cuenta, el equipo de la plataforma debe
                  habilitar el cobro directo (marketplace) en tu perfil.
                  Te avisaremos apenas esté activo.
                </div>
              )}
              <Link href="/dashboard/mercado-pago" className="block mt-6">
                <Button className="w-full">Volver a mi panel</Button>
              </Link>
            </>
          )}

          {estado === 'error' && (
            <>
              <XCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white">
                No pudimos conectar la cuenta
              </h1>
              <p className="text-sm text-slate-400 mt-2">{mensaje}</p>
              <Link href="/dashboard/mercado-pago" className="block mt-6">
                <Button className="w-full">Reintentar desde el panel</Button>
              </Link>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
