'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Search,
  FileText,
  CreditCard,
  Star,
  MessageSquare,
  HelpCircle,
  Settings,
  Users,
  BarChart3,
  Bell,
  AlertTriangle,
  Scale,
  Shield,
  Phone,
  Clock,
  Activity,
  UserCheck,
  FileBarChart,
} from 'lucide-react';

const clientLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/servicios', label: 'Buscar Servicios', icon: Search },
  { href: '/dashboard/transacciones', label: 'Mis Transacciones', icon: CreditCard },
  { href: '/dashboard/contratos', label: 'Mis Contratos', icon: FileText },
  { href: '/dashboard/valoraciones', label: 'Mis Valoraciones', icon: Star },
  { href: '/dashboard/reclamos', label: 'Reclamos', icon: AlertTriangle },
  { href: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell },
  { href: '/dashboard/tickets', label: 'Soporte', icon: MessageSquare },
  { href: '/dashboard/sla', label: 'Estado SLA', icon: Clock },
  { href: '/contacto', label: 'Contacto', icon: Phone },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
  { href: '/ayuda', label: 'Centro de Ayuda', icon: HelpCircle },
];

const providerLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/mis-servicios', label: 'Mis Servicios', icon: Settings },
  { href: '/dashboard/transacciones', label: 'Transacciones', icon: CreditCard },
  { href: '/dashboard/contratos', label: 'Contratos', icon: FileText },
  { href: '/dashboard/valoraciones', label: 'Valoraciones', icon: Star },
  { href: '/dashboard/reclamos', label: 'Reclamos', icon: AlertTriangle },
  { href: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell },
  { href: '/dashboard/tickets', label: 'Soporte', icon: MessageSquare },
  { href: '/dashboard/sla', label: 'Estado SLA', icon: Clock },
  { href: '/contacto', label: 'Contacto', icon: Phone },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
];

const adminLinks = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/dashboard/admin/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/dashboard/admin/reportes/trimestral', label: 'Reporte Trimestral', icon: FileBarChart },
  { href: '/dashboard/admin/metricas', label: 'Métricas de Atención', icon: Activity },
  { href: '/dashboard/admin/agentes', label: 'Agentes de Soporte', icon: UserCheck },
  { href: '/dashboard/sla', label: 'Gestión SLA', icon: Clock },
  { href: '/dashboard/reclamos', label: 'Reclamos', icon: AlertTriangle },
  { href: '/dashboard/mediacion', label: 'Mediación', icon: Scale },
  { href: '/dashboard/sanciones', label: 'Sanciones', icon: Shield },
  { href: '/ayuda', label: 'Centro de Ayuda', icon: HelpCircle },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar({ role = 'cliente' }: { role?: string }) {
  const pathname = usePathname();

  const links = role === 'admin' ? adminLinks : role === 'proveedor' ? providerLinks : clientLinks;

  return (
    <aside className="hidden lg:block w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800',
              )}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
