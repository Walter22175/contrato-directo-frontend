'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { CheckCircle, Mail } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    try {
      setError('');
      await api.post('/auth/forgot-password', data);
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar el email');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            {sent ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Email Enviado</h1>
                <p className="text-slate-400 mb-6">
                  Si el email está registrado, recibiste un enlace para restablecer tu contraseña.
                </p>
                <Link href="/auth/login">
                  <Button className="w-full">Volver al Login</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <Mail className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-white">Recuperar Contraseña</h1>
                  <p className="text-slate-400 mt-2">Te enviaremos un enlace para restablecer tu contraseña</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="tu@email.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />

                  <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                    Enviar Enlace
                  </Button>
                </form>

                <p className="text-center text-slate-400 text-sm mt-6">
                  <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                    Volver al Login
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
