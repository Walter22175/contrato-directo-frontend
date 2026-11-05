'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import Sidebar from '@/components/layout/Sidebar';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const proveedorEstado = useAuthStore((s) => s.proveedorEstado);
  const [contexto, setContexto] = useState<string | null>(null);

  useEffect(() => {
    setContexto(localStorage.getItem('contexto_activo'));
  }, []);

  const roles = isAuthenticated
    ? (user?.usuario_roles || [])
        .filter((ur) => ur.activo)
        .map((ur) => ur.rol?.nombre)
        .filter(Boolean)
    : [];

  const esProveedorAprobado =
    roles.includes('proveedor') && proveedorEstado === 'aprobado';
  const tieneCliente = roles.includes('cliente');

  const role = roles.includes('super_admin') || roles.includes('sistemas')
    ? 'admin'
    : contexto === 'proveedor' && esProveedorAprobado
      ? 'proveedor'
      : !tieneCliente && esProveedorAprobado
        ? 'proveedor'
        : 'cliente';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <Sidebar role={role} />
        <main className="flex-1 md:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}