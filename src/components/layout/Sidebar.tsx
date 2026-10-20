'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';
import {
  LayoutDashboard,
  Search,
  FileText,
  CreditCard,

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
  Image as ImageIcon,
  Briefcase,
  LogOut,
  Wallet,
  Handshake,
  KeyRound,
  Gauge,
} from 'lucide-react';
import { LlaveIcon } from '@/components/ui/LlaveIcon';

const clientLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/servicios', label: 'Buscar Servicios', icon: Search },
  { href: '/dashboard/transacciones', label: 'Mis Transacciones', icon: CreditCard },
  { href: '/dashboard/contratos', label: 'Mis Contratos', icon: FileText },
  { href: '/dashboard/documentos', label: 'Documentos', icon: FileText },
  { href: '/dashboard/valoraciones', label: 'Mis Valoraciones', icon: LlaveIcon },
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
  { href: '/dashboard/inicio-servicio', label: 'Anticipo 30%', icon: Handshake },
  { href: '/dashboard/contratos', label: 'Contratos', icon: FileText },
  { href: '/dashboard/documentos', label: 'Documentos', icon: FileText },
  { href: '/dashboard/valoraciones', label: 'Valoraciones', icon: LlaveIcon },
  { href: '/dashboard/mercado-pago', label: 'Mercado Pago', icon: Wallet },
  { href: '/dashboard/reclamos', label: 'Reclamos', icon: AlertTriangle },
  { href: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell },
  { href: '/dashboard/tickets', label: 'Soporte', icon: MessageSquare },
  { href: '/dashboard/sla', label: 'Estado SLA', icon: Clock },
  { href: '/contacto', label: 'Contacto', icon: Phone },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
];

const adminLinks = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/admin/control-total', label: 'Control Total', icon: Gauge },
  { href: '/dashboard/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/dashboard/admin/roles', label: 'Roles', icon: KeyRound },
  { href: '/dashboard/admin/configuracion', label: 'Config. Sistema', icon: Settings },
  { href: '/dashboard/admin/promociones', label: 'Promociones', icon: ImageIcon },
  { href: '/dashboard/admin/servicios', label: 'Gestión de Servicios', icon: Briefcase },
  { href: '/dashboard/admin/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/dashboard/admin/reportes/trimestral', label: 'Reporte Trimestral', icon: FileBarChart },
  { href: '/dashboard/admin/metricas', label: 'Métricas de Atención', icon: Activity },
  { href: '/dashboard/admin/inicio-servicio', label: 'Anticipo 30%', icon: Handshake },
  { href: '/dashboard/admin/agentes', label: 'Agentes de Soporte', icon: UserCheck },
  { href: '/dashboard/sla', label: 'Gestión SLA', icon: Clock },
  { href: '/dashboard/reclamos', label: 'Reclamos', icon: AlertTriangle },
  { href: '/dashboard/mediacion', label: 'Mediación', icon: Scale },
  { href: '/dashboard/sanciones', label: 'Sanciones', icon: Shield },
  { href: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell },
  { href: '/ayuda', label: 'Centro de Ayuda', icon: HelpCircle },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar({ role = 'cliente' }: { role?: string }) {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const abierta = useUiStore((s) => s.sidebarAbierta);
  const cerrar = useUiStore((s) => s.cerrarSidebar);
  const links = role === 'admin' ? adminLinks : role === 'proveedor' ? providerLinks : clientLinks;
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const centrarItem = (href: string) => {
    const nav = navRef.current;
    const el = itemRefs.current[href];
    if (!nav || !el) return;
    const top = Math.max(0, el.offsetTop - nav.clientHeight / 2 + el.clientHeight / 2);
    if (typeof nav.scrollTo === 'function') {
      nav.scrollTo({ top, behavior: 'smooth' });
    } else {
      nav.scrollTop = top;
    }
  };

  useEffect(() => {
    centrarItem(pathname);
  }, [pathname]);

  return (
    <>
      {abierta && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={cerrar}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col pt-28 transition-transform duration-200',
          abierta ? 'translate-x-0' : '-translate-x-full',
          'md:top-28 md:pt-0 md:translate-x-0 md:z-30',
        )}
      >
        <nav
          ref={navRef}
          className="relative p-4 space-y-1 flex-1 overflow-y-auto overflow-x-hidden"
        >
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={(el) => {
                  itemRefs.current[link.href] = el;
                }}
                onClick={() => {
                  cerrar();
                  centrarItem(link.href);
                }}
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
        <div className="p-4 border-t border-slate-800 space-y-3">
          <p className="text-xs text-slate-500 text-center">Contrato Directo</p>
          <button
            onClick={() => {
              logout();
              cerrar();
            }}
            className="md:hidden w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
