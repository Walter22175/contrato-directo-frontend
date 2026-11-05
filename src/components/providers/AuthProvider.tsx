'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const loadUser = useAuthStore((s) => s.loadUser);
  const logout = useAuthStore((s) => s.logout);
  const inicializado = useRef(false);

  useEffect(() => {
    if (inicializado.current) return;
    inicializado.current = true;

    const entrada = performance.getEntriesByType?.('navigation')?.[0] as
      | PerformanceNavigationTiming
      | undefined;

    if (entrada?.type === 'reload') {
      logout();
      window.location.replace('/');
      return;
    }

    loadUser();
  }, [loadUser, logout]);

  return <>{children}</>;
}
