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
  X,
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
  { href: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell },
  { href: '/ayuda', label: 'Centro de Ayuda', icon: HelpCircle },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar({ role = 'cliente', isOpen, onClose }: { role?: string; isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const links = role === 'admin' ? adminLinks : role === 'proveedor' ? providerLinks : clientLinks;

  const navContent = (
    <nav className="p-4 space-y-1">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
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
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-4rem)]">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <span className="text-lg font-bold text-white">Menú</span>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
