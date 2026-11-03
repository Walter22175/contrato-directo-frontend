'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api, { extractData, mensajeError } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { AlertTriangle, CheckCircle, Loader2, MailCheck } from 'lucide-react';
import type { JSX } from 'react';

type Estado = 'verificando' | 'ok' | 'error';

const VerifyEmailContent = (): JSX.Element => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [estado, setEstado] = useState<Estado>('verificando');
  const [mensaje, setMensaje] = useState('');
  const [email, setEmail] = useState('');
  const [reenviando, setReenviando] = useState(false);
  const [mensajeReenvio, setMensajeReenvio] = useState('');
  const [errorReenvio, setErrorReenvio] = useState('');

  const reenviarVerificacion = async () => {
    setReenviando(true);
    setMensajeReenvio('');
    setErrorReenvio('');

    try {
      const res = await api.post('/auth/resend-verification-public', { email });
      const data = extractData<{ message?: string }>(res);
      setMensajeReenvio(
        data.message ||
          'Si la cuenta necesita verificación, te enviaremos un nuevo enlace.',
      );
    } catch (err) {
      setErrorReenvio(
        mensajeError(err, 'No se pudo solicitar otro email de verificación.'),
      );
    } finally {
      setReenviando(false);
    }
  };

  useEffect(() => {
    let cancelado = false;

    const verificar = async () => {
      if (!token) {
        setEstado('error');
        setMensaje('El enlace no incluye un token de verificación.');
        return;
      }

      try {
        const res = await api.post('/auth/verify-email', { token });
        const data = res?.data?.data ?? res?.data;
        if (!cancelado) {
          setEstado('ok');
          setMensaje(data?.message || 'Email verificado exitosamente.');
        }
      } catch (err) {
        if (!cancelado) {
          setEstado('error');
          setMensaje(
            mensajeError(err, 'El enlace es inválido o expiró.'),
          );
        }
      }
    };

    verificar();

    return () => {
      cancelado = true;
    };
  }, [token]);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <div className="text-center">
            {estado === 'verificando' && (
              <>
                <Loader2 className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-spin" />
                <h1 className="text-2xl font-bold text-white mb-2">Verificando tu email</h1>
                <p className="text-slate-400">Estamos confirmando tu dirección de correo.</p>
              </>
            )}

            {estado === 'ok' && (
              <>
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Email verificado</h1>
                <p className="text-slate-400 mb-6">{mensaje}</p>
                <Link href="/auth/login">
                  <Button className="w-full">Iniciar sesión</Button>
                </Link>
              </>
            )}

            {estado === 'error' && (
              <>
                <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">No pudimos verificar tu email</h1>
                <p className="text-slate-400 mb-6">{mensaje}</p>
                <div className="space-y-3 text-left">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <Button
                    type="button"
                    className="w-full"
                    isLoading={reenviando}
                    onClick={reenviarVerificacion}
                    disabled={!email}
                  >
                    Solicitar otro enlace
                  </Button>
                  {mensajeReenvio && (
                    <p className="text-sm text-green-300">{mensajeReenvio}</p>
                  )}
                  {errorReenvio && (
                    <p className="text-sm text-red-300">{errorReenvio}</p>
                  )}
                </div>
                <Link href="/auth/login" className="block mt-4">
                  <Button className="w-full" variant="secondary">
                    Volver al login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default function VerifyEmailPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="text-center">
            <MailCheck className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <p className="text-slate-400">Cargando...</p>
          </div>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
