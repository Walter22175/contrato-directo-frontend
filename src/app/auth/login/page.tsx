'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import api, { extractData, mensajeError } from '@/lib/api';
import {
  limpiarDestinoPostLogin,
  obtenerDestinoPostLogin,
} from '@/lib/postLoginRedirect';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');
  const [next, setNext] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset, resetField, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });
  const [emailIngresado, setEmailIngresado] = useState('');
  const emailInput = register('email');

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    const destino = obtenerDestinoPostLogin(
      new URLSearchParams(window.location.search).get('next'),
    );
    if (destino) {
      setNext(destino);
    }
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  const onSubmit = async (data: LoginForm) => {
    try {
      clearError();
      await login(data);
      const destino = next || '/';
      limpiarDestinoPostLogin();
      router.push(destino);
    } catch {
      resetField('password');
    }
  };

  const reenviarVerificacion = async () => {
    setResendingEmail(true);
    setResendMessage('');
    setResendError('');

    try {
      const res = await api.post('/auth/resend-verification-public', {
        email: emailIngresado,
      });
      const data = extractData<{ message?: string }>(res);
      setResendMessage(
        data.message ||
          'Si la cuenta necesita verificación, te enviaremos un nuevo enlace.',
      );
    } catch (err) {
      setResendError(
        mensajeError(err, 'No se pudo solicitar otro email de verificación.'),
      );
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Iniciar Sesión</h1>
            <p className="text-slate-400 mt-2">Accedé a tu cuenta de Contrato Directo</p>
          </div>

          {error && (
            <div ref={errorRef} className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {error?.includes('Verificá tu email') && (
            <div className="mb-4">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                isLoading={resendingEmail}
                disabled={!emailIngresado}
                onClick={reenviarVerificacion}
              >
                Reenviar email de confirmación
              </Button>
              {resendMessage && (
                <p className="mt-2 text-sm text-green-300">{resendMessage}</p>
              )}
              {resendError && (
                <p className="mt-2 text-sm text-red-300">{resendError}</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              onFocus={clearError}
              {...emailInput}
              onChange={(event) => {
                emailInput.onChange(event);
                setEmailIngresado(event.target.value);
              }}
            />

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                onFocus={clearError}
                autoComplete="new-password"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              Iniciar Sesión
            </Button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            ¿No tenés cuenta?{' '}
            <Link
              href={next ? `/auth/register?next=${encodeURIComponent(next)}` : '/auth/register'}
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
