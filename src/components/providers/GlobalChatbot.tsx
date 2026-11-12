'use client';

import Chatbot from '@/components/ayuda/Chatbot';
import { useAuthStore } from '@/store/auth';
import { getRolesActivos, esRolTotal } from '@/lib/roles';
import { usePathname } from 'next/navigation';

export default function GlobalChatbot() {
  const user = useAuthStore((s) => s.user);
  const roles = getRolesActivos(user);
  const pathname = usePathname();
  const esAdminTotal = esRolTotal(roles);
  const esDashboard = pathname.startsWith('/dashboard');

  if (esAdminTotal && esDashboard) return null;

  return <Chatbot />;
}
