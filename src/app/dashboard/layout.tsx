'use client';

import Sidebar from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData, mensajeError } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleResendVerification = async () => {
    setResendingEmail(true);
    setEmailMessage(null);
    setEmailError(null);

    try {
      const res = await api.post('/auth/resend-verification');
      const data = extractData<{ message?: string }>(res);
      setEmailMessage(
        data?.message || 'Te enviamos un nuevo enlace de verificación.',
      );
    } catch (err) {
      setEmailError(
        mensajeError(err, 'No se pudo reenviar el email de verificación.'),
      );
    } finally {
      setResendingEmail(false);
    }
  };

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [mounted, isAuthenticated, isLoading, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const rolesActivos = (user?.usuario_roles || [])
    .filter((ur) => ur.activo)
    .map((ur) => ur.rol?.nombre as string)
    .filter(Boolean);
  const contexto = localStorage.getItem('contexto_activo');
  const role =
    contexto && rolesActivos.includes(contexto)
      ? contexto
      : rolesActivos[0] || 'cliente';
  const isAdmin = rolesActivos.includes('super_admin') || rolesActivos.includes('sistemas');

  return (
    <div className="flex flex-1">
      <Sidebar role={isAdmin ? 'admin' : role} />
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8">
        {user && !user.email_verificado && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                Tu email todavía no está verificado. Revisá tu correo y confirmá
                tu cuenta.
              </span>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingEmail}
                className="font-medium text-amber-100 underline underline-offset-2 hover:text-white disabled:opacity-50"
              >
                {resendingEmail ? 'Enviando...' : 'Reenviar email'}
              </button>
            </div>
            {emailMessage && (
              <p className="mt-2 text-green-300">{emailMessage}</p>
            )}
            {emailError && <p className="mt-2 text-red-300">{emailError}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
