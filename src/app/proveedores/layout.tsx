'use client';

import { useAuthStore } from '@/store/auth';
import Sidebar from '@/components/layout/Sidebar';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const roles = isAuthenticated
    ? (user?.usuario_roles || [])
        .filter((ur) => ur.activo)
        .map((ur) => ur.rol?.nombre)
        .filter(Boolean)
    : [];

  const role = roles.includes('super_admin') || roles.includes('sistemas')
    ? 'admin'
    : roles.includes('proveedor')
      ? 'proveedor'
      : 'cliente';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <Sidebar role={role} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}