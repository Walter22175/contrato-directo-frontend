'use client';

import { useAuthStore } from '@/store/auth';
import Sidebar from '@/components/layout/Sidebar';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const role = isAuthenticated 
    ? (user?.usuario_roles?.[0]?.rol?.nombre === 'super_admin' || user?.usuario_roles?.[0]?.rol?.nombre === 'sistemas' 
        ? 'admin' 
        : user?.usuario_roles?.[0]?.rol?.nombre === 'proveedor' 
          ? 'proveedor' 
          : 'cliente')
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