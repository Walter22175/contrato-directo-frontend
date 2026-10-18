'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ROLES_SOPORTE_INTERNO = [
  'super_admin',
  'sistemas',
  'admin_contable',
  'admin_comercial',
  'agente_atencion',
  'soporte',
];

export default function SoporteInternoGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();

  const roles = (user?.usuario_roles || [])
    .filter((ur) => ur.activo)
    .map((ur) => ur.rol?.nombre)
    .filter(Boolean);
  const puedeVer = roles.some((r) => ROLES_SOPORTE_INTERNO.includes(r as string));

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !puedeVer)) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, puedeVer, router]);

  if (isLoading || !puedeVer) return null;

  return <>{children}</>;
}
