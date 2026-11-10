'use client';

import { useAuthStore } from '@/store/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getRolesActivos, puedeAccederAdmin } from '@/lib/roles';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();
  const pathname = usePathname();

  const roles = getRolesActivos(user);
  const isAdmin = puedeAccederAdmin(pathname, roles);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading || !isAdmin) return null;

  return <>{children}</>;
}
