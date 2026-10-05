'use client';

import Sidebar from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
