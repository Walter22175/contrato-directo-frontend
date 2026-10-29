'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import Button from '@/components/ui/Button';
import { AlertTriangle, CheckCircle, Loader2, MailCheck } from 'lucide-react';
import type { JSX } from 'react';

type Estado = 'verificando' | 'ok' | 'error';

const VerifyEmailContent = (): JSX.Element => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const loadUser = useAuthStore((s) => s.loadUser);

  const [estado, setEstado] = useState<Estado>('verificando');
  const [mensaje, setMensaje] = useState('');

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
          void loadUser();
        }
      } catch (err) {
        if (!cancelado) {
          const mensajeError =
            (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message;
          setEstado('error');
          setMensaje(mensajeError || 'El enlace es inválido o expiró.');
        }
      }
    };

    verificar();

    return () => {
      cancelado = true;
    };
  }, [token, loadUser]);

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
                <Link href="/dashboard">
                  <Button className="w-full">Ir a mi panel</Button>
                </Link>
              </>
            )}

            {estado === 'error' && (
              <>
                <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">No pudimos verificar tu email</h1>
                <p className="text-slate-400 mb-6">{mensaje}</p>
                <Link href="/auth/login">
                  <Button className="w-full">Volver al login</Button>
                </Link>
                <p className="text-center text-slate-400 text-sm mt-4">
                  Iniciá sesión y reenviá la verificación desde tu perfil.
                </p>
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
