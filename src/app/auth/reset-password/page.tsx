'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { AlertTriangle, CheckCircle, KeyRound } from 'lucide-react';
import type { JSX } from 'react';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe tener mayúscula, minúscula y número'),
    confirmacion: z.string().min(8, 'Mínimo 8 caracteres'),
  })
  .refine((data) => data.password === data.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  });

type ResetForm = z.infer<typeof resetSchema>;

const SuccessView = (): JSX.Element => (
  <main className="flex-1 flex items-center justify-center px-4 py-12">
    <div className="w-full max-w-md">
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Contraseña Actualizada</h1>
          <p className="text-slate-400 mb-6">
            Tu contraseña se cambió correctamente. Ya podés iniciar sesión.
          </p>
          <Link href="/auth/login">
            <Button className="w-full">Ir al Login</Button>
          </Link>
        </div>
      </div>
    </div>
  </main>
);

const InvalidTokenView = ({ error }: { error: string }): JSX.Element => (
  <main className="flex-1 flex items-center justify-center px-4 py-12">
    <div className="w-full max-w-md">
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Enlace Inválido</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link href="/auth/forgot-password">
            <Button className="w-full">Solicitar un enlace nuevo</Button>
          </Link>
        </div>
      </div>
    </div>
  </main>
);

const FormView = ({
  token,
  error,
  handleSubmit,
  onSubmit,
  register,
  errors,
  isSubmitting,
}: {
  token: string;
  error: string;
  handleSubmit: UseFormHandleSubmit<ResetForm>;
  onSubmit: (data: ResetForm) => Promise<void>;
  register: UseFormRegister<ResetForm>;
  errors: FieldErrors<ResetForm>;
  isSubmitting: boolean;
}): JSX.Element => (
  <main className="flex-1 flex items-center justify-center px-4 py-12">
    <div className="w-full max-w-md">
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
        <div className="text-center mb-8">
          <KeyRound className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Nueva Contraseña</h1>
          <p className="text-slate-400 mt-2">Elegí una contraseña nueva para tu cuenta</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" value={token} readOnly />
          <Input
            label="Nueva contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Repetir contraseña"
            type="password"
            placeholder="Repetí la contraseña"
            error={errors.confirmacion?.message}
            {...register('confirmacion')}
          />

          <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
            Guardar Contraseña
          </Button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Volver al Login
          </Link>
        </p>
      </div>
    </div>
  </main>
);

const ResetPasswordContent = (): JSX.Element => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const logout = useAuthStore((s) => s.logout);

  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [tokenError, setTokenError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    try {
      setError('');
      await api.post('/auth/reset-password', {
        token,
        nueva_password: data.password,
      });
      // La contraseña cambió: cerramos cualquier sesión local para que el
      // proxy no redirija el login al dashboard con tokens viejos.
      logout();
      setDone(true);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const mensaje = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 400) {
        setTokenError(mensaje || 'El enlace expiró o ya fue usado. Solicitá uno nuevo.');
      } else {
        setError(mensaje || 'No se pudo actualizar la contraseña');
      }
    }
  };

  if (done) {
    return <SuccessView />;
  }

  if (tokenError) {
    return <InvalidTokenView error={tokenError} />;
  }

  if (!token) {
    return (
      <InvalidTokenView error="El enlace de recuperación no es válido. Solicitá uno nuevo desde «Olvidé mi contraseña»." />
    );
  }

  return (
    <FormView
      token={token}
      error={error}
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      isSubmitting={isSubmitting}
    />
  );
};

export default function ResetPasswordPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <p className="text-slate-400">Cargando...</p>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
