'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { intercambiarCodigoMercadoPago } from '@/lib/mercadopago';
import { mensajeError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type Estado = 'procesando' | 'ok' | 'error';

export default function MercadoPagoCallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const [estado, setEstado] = useState<Estado>('procesando');
  const [mensaje, setMensaje] = useState<string | null>(null);

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
  }, [code, state]);

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
                ¡Cuenta conectada!
              </h1>
              <p className="text-sm text-slate-400 mt-2">
                Tu cuenta de Mercado Pago quedó vinculada. Los pagos de tus
                trabajos se acreditarán en ella según la política de retención y
                liberación.
              </p>
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
